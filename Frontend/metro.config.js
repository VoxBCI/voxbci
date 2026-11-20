const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * The telemetry screen loads the headset mesh with three's OBJLoader, which
 * fetches the file at runtime. Registering `obj` as an asset extension makes
 * Metro publish it as a static file instead of trying to parse it as JS.
 */
if (!config.resolver.assetExts.includes('obj')) {
  config.resolver.assetExts.push('obj');
}

module.exports = config;
