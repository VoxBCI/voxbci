#!/usr/bin/env node

/**
 * Keeps Metro usable when the project lives inside a OneDrive folder.
 *
 * OneDrive "Files On-Demand" puts a reparse point on every file it manages.
 * The crawler in @expo/metro-file-map reports those placeholders as symlinks,
 * Metro then calls `readlink` on them, Windows answers EINVAL, and
 * #applyFileDelta treats that as fatal — so the file map never finishes
 * building and every module looks missing ("None of these files exist").
 *
 * This script teaches the file map to re-check suspected symlinks with
 * `lstat` and fall back to "regular file" when the filesystem disagrees.
 * Real symlinks are left alone, so the patch is harmless off OneDrive too.
 *
 * Runs from `postinstall`, is idempotent, and never fails an install: if the
 * package is absent or its internals have moved, it prints a warning instead.
 *
 * Usage: node ./scripts/patch-metro-file-map.js [path/to/index.js]
 */

const fs = require("fs");
const path = require("path");

const MARKER = "NOTE(local patch): cloud placeholder files";

const ANCHOR = [
  "        const readLinkPromises = [];",
  "        const readLinkErrors = [];",
  "        const filesToProcess = [];",
].join("\n");

const PATCH = [
  ANCHOR,
  '        // NOTE(local patch): cloud placeholder files (OneDrive "Files On-Demand")',
  "        // carry a reparse point that the crawler reports as a symlink. `readlink`",
  "        // then throws EINVAL and aborts the whole file map build. Reclassify",
  "        // anything `lstat` says is a real file before processing.",
  "        const suspectedSymlinks = [];",
  "        for (const [normalFilePath, fileData] of changedFiles){",
  "            if (fileData[_constants.default.SYMLINK] === 1) {",
  "                suspectedSymlinks.push([",
  "                    normalFilePath,",
  "                    fileData",
  "                ]);",
  "            }",
  "        }",
  "        if (suspectedSymlinks.length > 0) {",
  "            const CONCURRENCY = 256;",
  "            for(let i = 0; i < suspectedSymlinks.length; i += CONCURRENCY){",
  "                await Promise.all(suspectedSymlinks.slice(i, i + CONCURRENCY).map(async ([normalFilePath, fileData])=>{",
  "                    try {",
  "                        const stat = await _fs().promises.lstat(this.#pathUtils.normalToAbsolute(normalFilePath));",
  "                        if (stat.isSymbolicLink()) {",
  "                            return;",
  "                        }",
  "                        fileData[_constants.default.SYMLINK] = 0;",
  "                        if (fileData[_constants.default.MTIME] == null || fileData[_constants.default.MTIME] === 0) {",
  "                            fileData[_constants.default.MTIME] = stat.mtime.getTime();",
  "                            fileData[_constants.default.SIZE] = stat.size;",
  "                        }",
  "                    } catch  {}",
  "                }));",
  "            }",
  "        }",
].join("\n");

const log = (message) => console.log(`[patch-metro-file-map] ${message}`);

function resolveTarget() {
  if (process.argv[2]) {
    return path.resolve(process.argv[2]);
  }
  const projectRoot = path.resolve(__dirname, "..");
  try {
    const packageJson = require.resolve("@expo/metro-file-map/package.json", {
      paths: [projectRoot],
    });
    return path.join(path.dirname(packageJson), "build", "index.js");
  } catch {
    return null;
  }
}

function main() {
  const target = resolveTarget();
  if (!target || !fs.existsSync(target)) {
    log("@expo/metro-file-map is not installed, skipping");
    return;
  }

  const contents = fs.readFileSync(target, "utf8");
  const eol = contents.includes("\r\n") ? "\r\n" : "\n";

  if (contents.includes(MARKER)) {
    log("already applied");
    return;
  }

  const anchor = ANCHOR.replace(/\n/g, eol);
  if (!contents.includes(anchor)) {
    log(
      `could not find the patch anchor in ${target} — upstream may have changed. ` +
        "Metro will fail to crawl OneDrive folders until this script is updated."
    );
    return;
  }

  fs.writeFileSync(target, contents.replace(anchor, PATCH.replace(/\n/g, eol)));
  log(`patched ${path.relative(process.cwd(), target)}`);
}

main();
