// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const nativewindMetro = require("nativewind/metro");
const { withShareExtension } = require("expo-share-extension/metro");

let config = getDefaultConfig(__dirname);

// Apply NativeWind configuration
const withNativeWind = nativewindMetro.withNativeWind;
config = withNativeWind(config, { input: './global.css' });

// Apply Share Extension configuration (for iOS Share Extension bundle)
config = withShareExtension(config);

module.exports = config;
