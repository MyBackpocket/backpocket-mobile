/**
 * Share Handler Screen
 *
 * This screen handles incoming share intents from both iOS and Android.
 * It auto-saves the shared URL immediately and shows a confirmation.
 */

import { useAuth } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntent } from "expo-share-intent";
import {
	Bookmark,
	Check,
	ExternalLink,
	Globe,
	Lock,
	LogIn,
	Pencil,
	Plus,
	RefreshCw,
	Unlock,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Animated,
	Easing,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import { LogoIcon } from "@/components/ui/logo";
import { brandColors, radii, Shadows } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	getDuplicateSaveFromError,
	useCreateSave,
	useUpdateSave,
} from "@/lib/api/saves";
import { useMySpace } from "@/lib/api/space";
import { useListTags } from "@/lib/api/tags";
import type { DuplicateSaveInfo, Save, SaveVisibility } from "@/lib/api/types";

type ShareStatus =
	| "loading"
	| "saving"
	| "success"
	| "error"
	| "auth_required"
	| "duplicate";

/**
 * Extract domain from URL for display
 */
function extractDomain(url: string): string {
	try {
		const parsed = new URL(url);
		return parsed.hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}

/**
 * Format a relative time string (e.g., "2 days ago", "just now")
 */
function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return "just now";
	if (diffMins < 60)
		return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
	if (diffHours < 24)
		return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

	// For older dates, show the date
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
	});
}

/**
 * Animated checkmark component
 */
function AnimatedCheckmark({ color }: { color: string }) {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const rotateAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 50,
				friction: 3,
				useNativeDriver: true,
			}),
		]).start();

		Animated.timing(rotateAnim, {
			toValue: 1,
			duration: 600,
			easing: Easing.out(Easing.back(1.5)),
			useNativeDriver: true,
		}).start();
	}, [scaleAnim, rotateAnim]);

	const rotate = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["-45deg", "0deg"],
	});

	return (
		<Animated.View
			style={{
				transform: [{ scale: scaleAnim }, { rotate }],
			}}
		>
			<Check size={36} color={color} strokeWidth={3} />
		</Animated.View>
	);
}

/**
 * Pulsing loader dots
 */
function PulsingDots({ color }: { color: string }) {
	const dot1 = useRef(new Animated.Value(0.3)).current;
	const dot2 = useRef(new Animated.Value(0.3)).current;
	const dot3 = useRef(new Animated.Value(0.3)).current;

	useEffect(() => {
		const createPulse = (anim: Animated.Value, delay: number) => {
			return Animated.loop(
				Animated.sequence([
					Animated.delay(delay),
					Animated.timing(anim, {
						toValue: 1,
						duration: 400,
						useNativeDriver: true,
					}),
					Animated.timing(anim, {
						toValue: 0.3,
						duration: 400,
						useNativeDriver: true,
					}),
				]),
			);
		};

		createPulse(dot1, 0).start();
		createPulse(dot2, 150).start();
		createPulse(dot3, 300).start();
	}, [dot1, dot2, dot3]);

	return (
		<View style={styles.dotsContainer}>
			<Animated.View
				style={[styles.dot, { backgroundColor: color, opacity: dot1 }]}
			/>
			<Animated.View
				style={[styles.dot, { backgroundColor: color, opacity: dot2 }]}
			/>
			<Animated.View
				style={[styles.dot, { backgroundColor: color, opacity: dot3 }]}
			/>
		</View>
	);
}

/**
 * Visibility toggle pill
 */
interface VisibilityToggleProps {
	visibility: SaveVisibility;
	onToggle: () => void;
	disabled?: boolean;
	colors: ReturnType<typeof useThemeColors>;
}

function VisibilityToggle({
	visibility,
	onToggle,
	disabled,
	colors,
}: VisibilityToggleProps) {
	const isPublic = visibility === "public";

	return (
		<Pressable
			onPress={onToggle}
			disabled={disabled}
			style={({ pressed }) => [
				styles.visibilityToggle,
				{
					backgroundColor: isPublic
						? `${brandColors.mint}20`
						: `${colors.mutedForeground}15`,
					borderColor: isPublic ? brandColors.mint : colors.border,
				},
				pressed && { opacity: 0.8 },
				disabled && { opacity: 0.5 },
			]}
		>
			{isPublic ? (
				<Unlock size={14} color={brandColors.mint} strokeWidth={2.5} />
			) : (
				<Lock size={14} color={colors.mutedForeground} strokeWidth={2.5} />
			)}
			<Text
				style={[
					styles.visibilityToggleText,
					{ color: isPublic ? brandColors.mint : colors.mutedForeground },
				]}
			>
				{isPublic ? "Public" : "Private"}
			</Text>
		</Pressable>
	);
}

/**
 * Visibility toggle section for post-save visibility editing
 */
interface VisibilityToggleSectionProps {
	savedItem: Save;
	colors: ReturnType<typeof useThemeColors>;
}

function VisibilityToggleSection({
	savedItem,
	colors,
}: VisibilityToggleSectionProps) {
	const updateSave = useUpdateSave();
	const [currentVisibility, setCurrentVisibility] = useState<SaveVisibility>(
		savedItem.visibility,
	);

	const handleToggleVisibility = async () => {
		Haptics.selectionAsync();

		const newVisibility: SaveVisibility =
			currentVisibility === "public" ? "private" : "public";
		setCurrentVisibility(newVisibility);

		try {
			await updateSave.mutateAsync({
				id: savedItem.id,
				visibility: newVisibility,
			});
		} catch {
			// Rollback on error
			setCurrentVisibility(currentVisibility);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	};

	const isPublic = currentVisibility === "public";

	return (
		<View style={styles.visibilitySection}>
			<Pressable
				onPress={handleToggleVisibility}
				disabled={updateSave.isPending}
				style={({ pressed }) => [
					styles.visibilityToggleLarge,
					{
						backgroundColor: isPublic
							? `${brandColors.mint}15`
							: `${colors.mutedForeground}10`,
						borderColor: isPublic ? brandColors.mint : colors.border,
					},
					pressed && { opacity: 0.8 },
					updateSave.isPending && { opacity: 0.5 },
				]}
			>
				{isPublic ? (
					<Unlock size={18} color={brandColors.mint} strokeWidth={2} />
				) : (
					<Lock size={18} color={colors.mutedForeground} strokeWidth={2} />
				)}
				<View style={styles.visibilityTextContainer}>
					<Text
						style={[
							styles.visibilityMainText,
							{ color: isPublic ? brandColors.mint : colors.text },
						]}
					>
						{isPublic ? "Public" : "Private"}
					</Text>
					<Text
						style={[
							styles.visibilitySubText,
							{ color: colors.mutedForeground },
						]}
					>
						{isPublic ? "Visible on your public space" : "Only visible to you"}
					</Text>
				</View>
				<Text
					style={[styles.visibilityTapHint, { color: colors.mutedForeground }]}
				>
					Tap to change
				</Text>
			</Pressable>
		</View>
	);
}

/**
 * Quick tag section for post-save tagging
 */
interface QuickTagSectionProps {
	savedItem: Save;
	colors: ReturnType<typeof useThemeColors>;
}

function QuickTagSection({ savedItem, colors }: QuickTagSectionProps) {
	const { data: allTags = [] } = useListTags();
	const updateSave = useUpdateSave();

	const [selectedTags, setSelectedTags] = useState<string[]>(
		savedItem.tags?.map((t) => t.name) || [],
	);
	const [newTagInput, setNewTagInput] = useState("");
	const [isAddingTag, setIsAddingTag] = useState(false);

	// Get recent/suggested tags (limit to 6, exclude already selected)
	const suggestedTags = allTags
		.filter((tag) => !selectedTags.includes(tag.name))
		.slice(0, 6);

	const handleToggleTag = async (tagName: string) => {
		// Prevent multiple simultaneous updates
		if (updateSave.isPending) return;

		Haptics.selectionAsync();

		const isSelected = selectedTags.includes(tagName);
		const newTags = isSelected
			? selectedTags.filter((t) => t !== tagName)
			: [...selectedTags, tagName];

		// Store previous tags for potential rollback
		const previousTags = [...selectedTags];
		setSelectedTags(newTags);

		try {
			await updateSave.mutateAsync({
				id: savedItem.id,
				tagNames: newTags,
			});
		} catch (error) {
			// Rollback on error
			setSelectedTags(previousTags);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

			// Show user-friendly error for the known server bug
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			if (errorMessage.includes("not found")) {
				Alert.alert(
					"Couldn't update tags",
					"Tags can't be modified right now. Try editing this save from your library instead.",
					[{ text: "OK" }],
				);
			}
		}
	};

	const handleAddNewTag = async () => {
		const trimmed = newTagInput.trim().toLowerCase();
		if (!trimmed || selectedTags.includes(trimmed)) {
			setNewTagInput("");
			setIsAddingTag(false);
			return;
		}

		// Prevent multiple simultaneous updates
		if (updateSave.isPending) return;

		Haptics.selectionAsync();
		const previousTags = [...selectedTags];
		const newTags = [...selectedTags, trimmed];
		setSelectedTags(newTags);
		setNewTagInput("");
		setIsAddingTag(false);

		try {
			await updateSave.mutateAsync({
				id: savedItem.id,
				tagNames: newTags,
			});
		} catch (error) {
			setSelectedTags(previousTags);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

			// Show user-friendly error for the known server bug
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			if (errorMessage.includes("not found")) {
				Alert.alert(
					"Couldn't add tag",
					"Tags can't be added right now. Try editing this save from your library instead.",
					[{ text: "OK" }],
				);
			}
		}
	};

	return (
		<View style={styles.tagSection}>
			<Text style={[styles.tagSectionLabel, { color: colors.mutedForeground }]}>
				Quick tags
			</Text>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.tagScrollContent}
			>
				{/* Selected tags */}
				{selectedTags.map((tagName) => (
					<Pressable
						key={tagName}
						onPress={() => handleToggleTag(tagName)}
						style={({ pressed }) => [
							styles.tagChip,
							styles.tagChipSelected,
							{ backgroundColor: brandColors.denim.DEFAULT },
							pressed && { opacity: 0.8 },
						]}
					>
						<Text style={[styles.tagChipText, { color: "#FFFFFF" }]}>
							{tagName}
						</Text>
						<X size={12} color="#FFFFFF" strokeWidth={2.5} />
					</Pressable>
				))}

				{/* Suggested tags */}
				{suggestedTags.map((tag) => (
					<Pressable
						key={tag.id}
						onPress={() => handleToggleTag(tag.name)}
						style={({ pressed }) => [
							styles.tagChip,
							{
								backgroundColor: colors.muted,
								borderColor: colors.border,
								borderWidth: 1,
							},
							pressed && { opacity: 0.8 },
						]}
					>
						<Text style={[styles.tagChipText, { color: colors.text }]}>
							{tag.name}
						</Text>
					</Pressable>
				))}

				{/* Add new tag button/input */}
				{isAddingTag ? (
					<View
						style={[
							styles.newTagInputContainer,
							{ backgroundColor: colors.muted, borderColor: colors.border },
						]}
					>
						<TextInput
							value={newTagInput}
							onChangeText={setNewTagInput}
							placeholder="tag name"
							placeholderTextColor={colors.mutedForeground}
							style={[styles.newTagInput, { color: colors.text }]}
							autoFocus
							autoCapitalize="none"
							autoCorrect={false}
							returnKeyType="done"
							onSubmitEditing={handleAddNewTag}
							onBlur={() => {
								if (!newTagInput.trim()) {
									setIsAddingTag(false);
								}
							}}
						/>
					</View>
				) : (
					<Pressable
						onPress={() => setIsAddingTag(true)}
						style={({ pressed }) => [
							styles.addTagButton,
							{ backgroundColor: colors.muted, borderColor: colors.border },
							pressed && { opacity: 0.8 },
						]}
					>
						<Plus size={16} color={colors.mutedForeground} strokeWidth={2} />
					</Pressable>
				)}
			</ScrollView>
		</View>
	);
}

export default function ShareScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const params = useLocalSearchParams<{ url?: string }>();

	// Always call useAuth hook (React rules of hooks)
	const auth = useAuth();
	const isSignedIn = auth.isSignedIn ?? false;
	const isLoaded = auth.isLoaded;

	// Get user's space settings for default visibility
	const { data: space } = useMySpace();

	// Get share intent data (for Android/iOS share intent flow)
	const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

	// Create save mutation
	const createSave = useCreateSave();
	// Extract mutateAsync to stable ref to avoid re-renders
	const mutateAsyncRef = useRef(createSave.mutateAsync);
	mutateAsyncRef.current = createSave.mutateAsync;

	const [status, setStatus] = useState<ShareStatus>("loading");
	const [savedUrl, setSavedUrl] = useState<string | null>(null);
	const [savedItem, setSavedItem] = useState<Save | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [duplicateSave, setDuplicateSave] = useState<DuplicateSaveInfo | null>(
		null,
	);
	// Visibility state - defaults to space's default or "public"
	const [visibility, setVisibility] = useState<SaveVisibility>(
		space?.defaultSaveVisibility ?? "public",
	);
	// Track if user has explicitly changed visibility
	const userChangedVisibilityRef = useRef(false);

	// Animation values
	const cardScale = useRef(new Animated.Value(0.9)).current;
	const cardOpacity = useRef(new Animated.Value(0)).current;

	// Refs to prevent multiple save attempts and track URL
	const saveInitiatedRef = useRef(false);
	const urlToSaveRef = useRef<string | null>(null);

	// Animate card on mount
	useEffect(() => {
		Animated.parallel([
			Animated.spring(cardScale, {
				toValue: 1,
				tension: 65,
				friction: 8,
				useNativeDriver: true,
			}),
			Animated.timing(cardOpacity, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}),
		]).start();
	}, [cardScale, cardOpacity]);

	// Sync visibility with space's default when it loads (if user hasn't changed it)
	useEffect(() => {
		if (space?.defaultSaveVisibility && !userChangedVisibilityRef.current) {
			setVisibility(space.defaultSaveVisibility);
		}
	}, [space?.defaultSaveVisibility]);

	// Debug logging (separate effect, no state changes)
	useEffect(() => {
		console.log("[share] === Share Screen Debug ===");
		console.log("[share] params:", JSON.stringify(params));
		console.log("[share] hasShareIntent:", hasShareIntent);
		console.log("[share] shareIntent:", JSON.stringify(shareIntent, null, 2));
		console.log("[share] isLoaded:", isLoaded);
		console.log("[share] isSignedIn:", isSignedIn);
		console.log("[share] status:", status);
		console.log("[share] saveInitiated:", saveInitiatedRef.current);
		console.log("[share] urlToSave:", urlToSaveRef.current);

		// Check initial URL
		Linking.getInitialURL().then((initialUrl) => {
			console.log("[share] Initial URL:", initialUrl);
		});
	}, [params, hasShareIntent, shareIntent, isLoaded, isSignedIn, status]);

	/**
	 * Extract URL from params or share intent
	 */
	const extractUrl = useCallback((): string | null => {
		// Check URL params first (from iOS share extension openHostApp)
		if (params.url) {
			try {
				return decodeURIComponent(params.url);
			} catch {
				return params.url;
			}
		}

		// Check share intent (from useShareIntent hook)
		if (hasShareIntent && shareIntent) {
			// Direct URL
			if (shareIntent.webUrl) {
				return shareIntent.webUrl;
			}
			// Check text for URL
			if (shareIntent.text) {
				const urlMatch = shareIntent.text.match(/https?:\/\/[^\s]+/);
				if (urlMatch) {
					return urlMatch[0];
				}
			}
		}

		return null;
	}, [params.url, hasShareIntent, shareIntent]);

	/**
	 * Handle the share flow - runs once when data is ready
	 */
	useEffect(() => {
		// Skip if already initiated
		if (saveInitiatedRef.current) {
			console.log("[share] Save already initiated, skipping");
			return;
		}

		// Wait for auth to load
		if (!isLoaded) {
			console.log("[share] Waiting for auth to load...");
			return;
		}

		// Check if user is signed in
		if (!isSignedIn) {
			console.log("[share] User not signed in");
			setStatus("auth_required");
			return;
		}

		// Get the URL to save
		const url = extractUrl();
		console.log("[share] Extracted URL:", url);

		if (!url) {
			// Only set error if we have share intent data but no URL
			// Otherwise keep loading (share intent might still be loading)
			if (hasShareIntent) {
				console.log("[share] Has share intent but no URL found");
				setStatus("error");
				setErrorMessage("No valid URL found in shared content");
			} else if (params.url === undefined && !hasShareIntent) {
				// No URL from params and no share intent - might still be loading
				console.log("[share] No URL source yet, waiting...");
			}
			return;
		}

		// Mark as initiated IMMEDIATELY to prevent any re-runs
		saveInitiatedRef.current = true;
		// Store the URL in case shareIntent gets cleared
		urlToSaveRef.current = url;

		console.log("[share] Starting save for:", url);

		// Start saving
		setStatus("saving");
		setSavedUrl(url);

		// Use the ref to get the current mutateAsync
		const saveInput = { url, visibility };
		console.log("[share] Calling mutateAsync with:", JSON.stringify(saveInput));
		console.log("[share] saveInput.url:", saveInput.url);
		console.log("[share] typeof saveInput.url:", typeof saveInput.url);

		mutateAsyncRef
			.current(saveInput)
			.then((save) => {
				console.log("[share] Save successful!", save.id);
				setSavedItem(save);
				setStatus("success");
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				resetShareIntent();
			})
			.catch((error: unknown) => {
				// Check if this is a duplicate save error first
				const existingSave = getDuplicateSaveFromError(error);
				if (existingSave) {
					console.log(
						"[share] Duplicate detected:",
						existingSave.id || "(no ID)",
					);
					setDuplicateSave(existingSave);
					setStatus("duplicate");
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
					resetShareIntent();
					return;
				}

				// Only log as error if it's an actual error (not a duplicate)
				console.error("[share] Save failed:", error);
				setStatus("error");
				setErrorMessage(
					error instanceof Error ? error.message : "Failed to save link",
				);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				// NOTE: We do NOT reset saveInitiatedRef here!
				// User must explicitly click "Try Again" button
			});
	}, [
		isLoaded,
		isSignedIn,
		hasShareIntent,
		params.url,
		extractUrl,
		resetShareIntent,
		visibility,
	]);

	/**
	 * Toggle visibility between public and private
	 */
	const handleToggleVisibility = useCallback(() => {
		Haptics.selectionAsync();
		userChangedVisibilityRef.current = true;
		setVisibility((v) => (v === "public" ? "private" : "public"));
	}, []);

	/**
	 * Handle close
	 */
	const handleClose = () => {
		if (hasShareIntent) {
			resetShareIntent();
		}
		router.back();
	};

	/**
	 * Navigate to sign in
	 */
	const handleSignIn = () => {
		const url = extractUrl() || urlToSaveRef.current;
		router.push({
			pathname: "/(auth)/sign-in",
			params: url ? { returnUrl: `/share?url=${encodeURIComponent(url)}` } : {},
		});
	};

	/**
	 * View saved item
	 */
	const handleViewSave = () => {
		router.replace("/(tabs)/saves");
	};

	/**
	 * View a specific existing save (for duplicates)
	 */
	const handleViewExistingSave = () => {
		if (duplicateSave?.id) {
			router.replace(`/save/${duplicateSave.id}`);
		} else {
			// Fallback to saves list if we don't have the ID
			router.replace("/(tabs)/saves");
		}
	};

	/**
	 * Edit a specific existing save (for duplicates)
	 */
	const handleEditExistingSave = () => {
		if (duplicateSave?.id) {
			// Navigate to save detail which allows editing
			router.replace(`/save/${duplicateSave.id}`);
		} else {
			// Fallback to saves list if we don't have the ID
			router.replace("/(tabs)/saves");
		}
	};

	/**
	 * Retry save - user explicitly clicked retry
	 */
	const handleRetry = () => {
		const url = urlToSaveRef.current;
		console.log("[share] Retry clicked, url from ref:", url);

		if (!url) {
			setErrorMessage("URL no longer available. Please share again.");
			return;
		}

		// Reset state for retry
		setStatus("saving");
		setErrorMessage(null);

		const retryInput = { url, visibility };
		console.log(
			"[share] Retry calling mutateAsync with:",
			JSON.stringify(retryInput),
		);

		mutateAsyncRef
			.current(retryInput)
			.then((save) => {
				console.log("[share] Retry save successful!", save.id);
				setSavedItem(save);
				setStatus("success");
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				if (hasShareIntent) {
					resetShareIntent();
				}
			})
			.catch((error: unknown) => {
				// Check if this is a duplicate save error first
				const existingSave = getDuplicateSaveFromError(error);
				if (existingSave) {
					console.log(
						"[share] Duplicate detected on retry:",
						existingSave.id || "(no ID)",
					);
					setDuplicateSave(existingSave);
					setStatus("duplicate");
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
					if (hasShareIntent) {
						resetShareIntent();
					}
					return;
				}

				// Only log as error if it's an actual error (not a duplicate)
				console.error("[share] Retry save failed:", error);
				setStatus("error");
				setErrorMessage(
					error instanceof Error ? error.message : "Failed to save link",
				);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			});
	};

	const domain = savedUrl ? extractDomain(savedUrl) : null;

	return (
		<View style={styles.container}>
			{/* Backdrop */}
			<Pressable style={styles.backdrop} onPress={handleClose} />

			{/* Card */}
			<Animated.View
				style={[
					styles.card,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
						transform: [{ scale: cardScale }],
						opacity: cardOpacity,
					},
					Shadows.lg,
				]}
			>
				{/* Header */}
				<View style={styles.header}>
					<LogoIcon size="sm" />
					<Pressable
						onPress={handleClose}
						style={({ pressed }) => [
							styles.closeButton,
							{ opacity: pressed ? 0.6 : 1 },
						]}
						hitSlop={12}
					>
						<X size={20} color={colors.mutedForeground} />
					</Pressable>
				</View>

				{/* Content */}
				<View style={styles.content}>
					{/* Loading State */}
					{status === "loading" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: `${brandColors.rust.DEFAULT}15` },
								]}
							>
								<Bookmark
									size={28}
									color={brandColors.rust.DEFAULT}
									strokeWidth={2}
								/>
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Getting ready...
							</Text>
							<PulsingDots color={brandColors.rust.DEFAULT} />
						</View>
					)}

					{/* Saving State */}
					{status === "saving" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: `${brandColors.rust.DEFAULT}15` },
								]}
							>
								<ActivityIndicator
									size="small"
									color={brandColors.rust.DEFAULT}
								/>
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Saving to Backpocket
							</Text>
							{domain && (
								<View
									style={[styles.urlPill, { backgroundColor: colors.muted }]}
								>
									<Globe size={14} color={colors.mutedForeground} />
									<Text
										style={[
											styles.urlPillText,
											{ color: colors.mutedForeground },
										]}
										numberOfLines={1}
									>
										{domain}
									</Text>
								</View>
							)}
							{/* Visibility indicator during save */}
							<View style={styles.visibilityRow}>
								<Text
									style={[
										styles.visibilityLabel,
										{ color: colors.mutedForeground },
									]}
								>
									Saving as:
								</Text>
								<VisibilityToggle
									visibility={visibility}
									onToggle={handleToggleVisibility}
									disabled
									colors={colors}
								/>
							</View>
						</View>
					)}

					{/* Success State */}
					{status === "success" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.successIconContainer,
									{ backgroundColor: brandColors.mint },
								]}
							>
								<AnimatedCheckmark color="#FFFFFF" />
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Saved to Backpocket!
							</Text>
							{domain && (
								<View
									style={[styles.urlPill, { backgroundColor: colors.muted }]}
								>
									<Globe size={14} color={colors.mutedForeground} />
									<Text
										style={[
											styles.urlPillText,
											{ color: colors.mutedForeground },
										]}
										numberOfLines={1}
									>
										{domain}
									</Text>
								</View>
							)}

							{/* Visibility toggle */}
							{savedItem && (
								<VisibilityToggleSection
									savedItem={savedItem}
									colors={colors}
								/>
							)}

							{/* Quick Tags */}
							{savedItem && (
								<QuickTagSection savedItem={savedItem} colors={colors} />
							)}

							{/* Actions */}
							<View style={styles.actions}>
								<Pressable
									onPress={handleViewSave}
									style={({ pressed }) => [
										styles.primaryButton,
										{ backgroundColor: colors.primary },
										pressed && styles.buttonPressed,
									]}
								>
									<ExternalLink size={18} color={colors.primaryForeground} />
									<Text
										style={[
											styles.primaryButtonText,
											{ color: colors.primaryForeground },
										]}
									>
										View Saves
									</Text>
								</Pressable>
								<Pressable
									onPress={handleClose}
									style={({ pressed }) => [
										styles.secondaryButton,
										{
											backgroundColor: colors.secondary,
											borderColor: colors.border,
										},
										pressed && styles.buttonPressed,
									]}
								>
									<Text
										style={[
											styles.secondaryButtonText,
											{ color: colors.secondaryForeground },
										]}
									>
										Done
									</Text>
								</Pressable>
							</View>
						</View>
					)}

					{/* Duplicate State */}
					{status === "duplicate" && duplicateSave && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.successIconContainer,
									{ backgroundColor: brandColors.denim.DEFAULT },
								]}
							>
								<Bookmark
									size={32}
									color="#FFFFFF"
									strokeWidth={2}
									fill="#FFFFFF"
								/>
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Already in your pocket!
							</Text>
							<Text
								style={[styles.subtitle, { color: colors.mutedForeground }]}
							>
								{duplicateSave.id
									? `You saved this ${formatRelativeTime(duplicateSave.savedAt)}`
									: "This link is already in your saves"}
							</Text>

							{/* Existing save preview - only show if we have details */}
							{(duplicateSave.title ||
								duplicateSave.siteName ||
								duplicateSave.url) &&
								duplicateSave.id && (
									<Pressable
										onPress={handleViewExistingSave}
										style={({ pressed }) => [
											styles.duplicatePreview,
											{
												backgroundColor: colors.muted,
												borderColor: colors.border,
											},
											pressed && { opacity: 0.8 },
										]}
									>
										{duplicateSave.siteName && (
											<Text
												style={[
													styles.duplicateSiteName,
													{ color: colors.mutedForeground },
												]}
												numberOfLines={1}
											>
												{duplicateSave.siteName}
											</Text>
										)}
										<Text
											style={[styles.duplicateTitle, { color: colors.text }]}
											numberOfLines={2}
										>
											{duplicateSave.title || extractDomain(duplicateSave.url)}
										</Text>
									</Pressable>
								)}

							{/* Actions */}
							<View style={styles.actions}>
								{duplicateSave.id ? (
									<>
										<Pressable
											onPress={handleViewExistingSave}
											style={({ pressed }) => [
												styles.primaryButton,
												{ backgroundColor: colors.primary },
												pressed && styles.buttonPressed,
											]}
										>
											<ExternalLink
												size={18}
												color={colors.primaryForeground}
											/>
											<Text
												style={[
													styles.primaryButtonText,
													{ color: colors.primaryForeground },
												]}
											>
												View Save
											</Text>
										</Pressable>
										<Pressable
											onPress={handleEditExistingSave}
											style={({ pressed }) => [
												styles.secondaryButton,
												{
													backgroundColor: colors.secondary,
													borderColor: colors.border,
												},
												pressed && styles.buttonPressed,
											]}
										>
											<Pencil size={16} color={colors.secondaryForeground} />
											<Text
												style={[
													styles.secondaryButtonText,
													{ color: colors.secondaryForeground },
												]}
											>
												Edit Save
											</Text>
										</Pressable>
									</>
								) : (
									<>
										<Pressable
											onPress={handleViewSave}
											style={({ pressed }) => [
												styles.primaryButton,
												{ backgroundColor: colors.primary },
												pressed && styles.buttonPressed,
											]}
										>
											<ExternalLink
												size={18}
												color={colors.primaryForeground}
											/>
											<Text
												style={[
													styles.primaryButtonText,
													{ color: colors.primaryForeground },
												]}
											>
												View Saves
											</Text>
										</Pressable>
										<Pressable
											onPress={handleClose}
											style={({ pressed }) => [
												styles.secondaryButton,
												{
													backgroundColor: "transparent",
													borderColor: colors.border,
												},
												pressed && styles.buttonPressed,
											]}
										>
											<Text
												style={[
													styles.secondaryButtonText,
													{ color: colors.mutedForeground },
												]}
											>
												Got it
											</Text>
										</Pressable>
									</>
								)}
							</View>
						</View>
					)}

					{/* Error State */}
					{status === "error" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.errorIconContainer,
									{ backgroundColor: `${colors.destructive}15` },
								]}
							>
								<X size={28} color={colors.destructive} strokeWidth={2.5} />
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Couldn't save
							</Text>
							<Text
								style={[styles.errorMessage, { color: colors.mutedForeground }]}
							>
								{errorMessage || "Something went wrong. Please try again."}
							</Text>

							{/* Actions */}
							<View style={styles.actions}>
								<Pressable
									onPress={handleRetry}
									style={({ pressed }) => [
										styles.primaryButton,
										{ backgroundColor: colors.primary },
										pressed && styles.buttonPressed,
									]}
								>
									<RefreshCw size={18} color={colors.primaryForeground} />
									<Text
										style={[
											styles.primaryButtonText,
											{ color: colors.primaryForeground },
										]}
									>
										Try Again
									</Text>
								</Pressable>
								<Pressable
									onPress={handleClose}
									style={({ pressed }) => [
										styles.secondaryButton,
										{
											backgroundColor: "transparent",
											borderColor: colors.border,
										},
										pressed && styles.buttonPressed,
									]}
								>
									<Text
										style={[
											styles.secondaryButtonText,
											{ color: colors.mutedForeground },
										]}
									>
										Cancel
									</Text>
								</Pressable>
							</View>
						</View>
					)}

					{/* Auth Required State */}
					{status === "auth_required" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: `${brandColors.denim.DEFAULT}15` },
								]}
							>
								<LogIn
									size={28}
									color={brandColors.denim.DEFAULT}
									strokeWidth={2}
								/>
							</View>
							<Text style={[styles.title, { color: colors.text }]}>
								Sign in to save
							</Text>
							<Text
								style={[styles.subtitle, { color: colors.mutedForeground }]}
							>
								Your Backpocket is just a sign-in away
							</Text>

							{/* Actions */}
							<View style={styles.actions}>
								<Pressable
									onPress={handleSignIn}
									style={({ pressed }) => [
										styles.primaryButton,
										{ backgroundColor: colors.primary },
										pressed && styles.buttonPressed,
									]}
								>
									<Text
										style={[
											styles.primaryButtonText,
											{ color: colors.primaryForeground },
										]}
									>
										Sign In
									</Text>
								</Pressable>
								<Pressable
									onPress={handleClose}
									style={({ pressed }) => [
										styles.secondaryButton,
										{
											backgroundColor: "transparent",
											borderColor: colors.border,
										},
										pressed && styles.buttonPressed,
									]}
								>
									<Text
										style={[
											styles.secondaryButtonText,
											{ color: colors.mutedForeground },
										]}
									>
										Cancel
									</Text>
								</Pressable>
							</View>
						</View>
					)}
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
	},
	card: {
		width: "100%",
		maxWidth: 340,
		borderRadius: radii.xl,
		borderWidth: 1,
		overflow: "hidden",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 16,
		paddingHorizontal: 20,
		paddingBottom: 12,
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		paddingHorizontal: 24,
		paddingBottom: 28,
		paddingTop: 8,
	},
	statusContainer: {
		alignItems: "center",
		gap: 12,
	},
	iconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	successIconContainer: {
		width: 72,
		height: 72,
		borderRadius: 36,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
		...Platform.select({
			ios: {
				shadowColor: "#9DC08B",
				shadowOffset: { width: 0, height: 4 },
				shadowOpacity: 0.3,
				shadowRadius: 12,
			},
			android: {
				elevation: 8,
			},
		}),
	},
	errorIconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	title: {
		fontSize: 20,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 15,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 22,
		marginTop: -4,
	},
	urlPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: radii.full,
		maxWidth: "100%",
		marginTop: 4,
	},
	urlPillText: {
		fontSize: 13,
		fontFamily: "DMSans",
		flexShrink: 1,
	},
	errorMessage: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 20,
		marginTop: -4,
	},
	actions: {
		width: "100%",
		gap: 10,
		marginTop: 20,
	},
	primaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: radii.md,
	},
	primaryButtonText: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	secondaryButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	secondaryButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	buttonPressed: {
		opacity: 0.8,
		transform: [{ scale: 0.98 }],
	},
	dotsContainer: {
		flexDirection: "row",
		gap: 6,
		marginTop: 8,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	tagSection: {
		width: "100%",
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(128, 128, 128, 0.2)",
	},
	tagSectionLabel: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 10,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	tagScrollContent: {
		flexDirection: "row",
		gap: 8,
		paddingRight: 4,
	},
	tagChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radii.full,
	},
	tagChipSelected: {
		paddingRight: 8,
	},
	tagChipText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	newTagInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: radii.full,
		borderWidth: 1,
		minWidth: 80,
	},
	newTagInput: {
		fontSize: 13,
		fontFamily: "DMSans",
		padding: 0,
		margin: 0,
		minWidth: 60,
	},
	addTagButton: {
		width: 32,
		height: 28,
		borderRadius: radii.full,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
	},
	// Duplicate state styles
	duplicateIconContainer: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 4,
	},
	duplicatePreview: {
		width: "100%",
		padding: 14,
		borderRadius: radii.md,
		borderWidth: 1,
		marginTop: 8,
	},
	duplicateSiteName: {
		fontSize: 11,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 4,
	},
	duplicateTitle: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		lineHeight: 20,
	},
	// Visibility toggle styles
	visibilityRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 8,
	},
	visibilityLabel: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	visibilityToggle: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radii.full,
		borderWidth: 1,
	},
	visibilityToggleText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	visibilitySection: {
		width: "100%",
		marginTop: 12,
	},
	visibilityToggleLarge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 14,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	visibilityTextContainer: {
		flex: 1,
	},
	visibilityMainText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	visibilitySubText: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginTop: 1,
	},
	visibilityTapHint: {
		fontSize: 11,
		fontFamily: "DMSans",
	},
});
