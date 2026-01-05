/**
 * Settings storage hook using expo-secure-store
 * Persists user preferences like theme, notifications, etc.
 */

import * as SecureStore from "expo-secure-store";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

export type ThemePreference = "system" | "light" | "dark";

export interface Settings {
	theme: ThemePreference;
	notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
	theme: "system",
	notificationsEnabled: true,
};

const SETTINGS_KEY = "backpocket_settings";

interface SettingsContextValue {
	settings: Settings;
	isLoading: boolean;
	updateSettings: (updates: Partial<Settings>) => Promise<void>;
	setTheme: (theme: ThemePreference) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsStore() {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);

	// Load settings on mount
	useEffect(() => {
		async function loadSettings() {
			try {
				const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
				if (stored) {
					const parsed = JSON.parse(stored);
					setSettings({ ...DEFAULT_SETTINGS, ...parsed });
				}
			} catch (error) {
				console.error("[settings] Failed to load settings:", error);
			} finally {
				setIsLoading(false);
			}
		}
		loadSettings();
	}, []);

	const updateSettings = useCallback(
		async (updates: Partial<Settings>) => {
			const newSettings = { ...settings, ...updates };
			setSettings(newSettings);
			try {
				await SecureStore.setItemAsync(
					SETTINGS_KEY,
					JSON.stringify(newSettings),
				);
			} catch (error) {
				console.error("[settings] Failed to save settings:", error);
			}
		},
		[settings],
	);

	const setTheme = useCallback(
		async (theme: ThemePreference) => {
			await updateSettings({ theme });
		},
		[updateSettings],
	);

	return {
		settings,
		isLoading,
		updateSettings,
		setTheme,
	};
}

export function useSettings(): SettingsContextValue {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}
