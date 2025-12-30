/**
 * iOS Share Extension entry point
 *
 * This registers the share extension's root component.
 * The component name MUST be "shareExtension" for expo-share-extension to work.
 */
import { AppRegistry } from "react-native";
import ShareExtension from "./ShareExtension";

AppRegistry.registerComponent("shareExtension", () => ShareExtension);
