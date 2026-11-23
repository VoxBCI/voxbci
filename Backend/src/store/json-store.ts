import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Tiny JSON collection store.
 *
 * Design notes, and the limits that come with them:
 *  - rows are loaded into memory once at boot, so reads are synchronous cheap;
 *  - every mutation is written through a per-collection promise chain, so two
 *    concurrent requests can never interleave file writes;
 *  - writes are atomic (temp file + rename), so a kill during a write leaves the
 *    previous good file in place rather than a truncated one;
 *  - reads return clones, so a route cannot accidentally mutate state.
 *
 * Single process only. That is fine for local development and the demo; the
 * repository interfaces in `repositories.ts` are what allow Postgres later.
 */
export class JsonCollection<T extends { id: string }> {
  private writeChain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly file: string,
    private readonly directory: string,
    private readonly rows: Map<string, T>,
  ) {}

  static async open<T extends { id: string }>(
    directory: string,
    name: string,
    seed: readonly T[] = [],
  ): Promise<JsonCollection<T>> {
    await mkdir(directory, { recursive: true });

    const file = path.join(directory, `${name}.json`);
    let rows: T[];

    try {
      rows = JSON.parse(await readFile(file, 'utf8')) as T[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      rows = structuredClone([...seed]);
      await JsonCollection.writeAtomic(directory, file, rows);
    }

    return new JsonCollection<T>(file, directory, new Map(rows.map((row) => [row.id, row])));
  }

  get(id: string): T | undefined {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : undefined;
  }

  all(): T[] {
    return [...this.rows.values()].map((row) => structuredClone(row));
  }

  find(predicate: (row: T) => boolean): T[] {
    const matches: T[] = [];

    for (const row of this.rows.values()) {
      if (predicate(row)) matches.push(structuredClone(row));
    }

    return matches;
  }

  findOne(predicate: (row: T) => boolean): T | undefined {
    for (const row of this.rows.values()) {
      if (predicate(row)) return structuredClone(row);
    }

    return undefined;
  }

  count(): number {
    return this.rows.size;
  }

  async insert(row: T): Promise<T> {
    if (this.rows.has(row.id)) {
      throw new Error(`Duplicate id ${row.id} in ${path.basename(this.file)}`);
    }

    this.rows.set(row.id, structuredClone(row));
    await this.flush();

    return structuredClone(row);
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    const current = this.rows.get(id);
    if (!current) return undefined;

    const next = { ...current, ...patch, id: current.id } as T;
    this.rows.set(id, next);
    await this.flush();

    return structuredClone(next);
  }

  /** Hard delete. Presence/chats will use `deletedAt` instead when they land. */
  async delete(id: string): Promise<boolean> {
    if (!this.rows.delete(id)) return false;
    await this.flush();
    return true;
  }

  /** Resolves when every queued write has hit disk. */
  async flush(): Promise<void> {
    const snapshot = [...this.rows.values()];

    this.writeChain = this.writeChain.then(() =>
      JsonCollection.writeAtomic(this.directory, this.file, snapshot),
    );

    await this.writeChain;
  }

  private static async writeAtomic(directory: string, file: string, rows: unknown[]) {
    const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.tmp`);
    await writeFile(temporary, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
    // rename() replaces an existing file on both POSIX and Windows.
    await rename(temporary, file);
  }
}
