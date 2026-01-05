// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const nativewindMetro = require("nativewind/metro");

let config = getDefaultConfig(__dirname);

// Apply NativeWind configuration
const withNativeWind = nativewindMetro.withNativeWind;
config = withNativeWind(config, { input: "./global.css" });

module.exports = config;
