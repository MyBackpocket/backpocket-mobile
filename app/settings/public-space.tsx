import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
	AlertCircle,
	Bookmark,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	ExternalLink,
	Eye,
	Globe,
	Laptop,
	Lock,
	PanelTop,
	Trash2,
	Unlock,
	XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, CardContent } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	useCheckSlugAvailability,
	useListDomains,
	useMySpace,
	useRemoveDomain,
	useUpdateSettings,
	useUpdateSlug,
} from "@/lib/api/space";
import type {
	DomainMapping,
	DomainStatus,
	SaveVisibility,
	SlugAvailability,
} from "@/lib/api/types";
import { buildPublicSpaceUrl, ROOT_DOMAIN } from "@/lib/constants";
import { useOpenUrl } from "@/lib/utils";

// Slug validation regex (same as API)
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 32;

// Debounce hook for slug checking
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

// Get status color and icon for domains
function getDomainStatusInfo(status: DomainStatus) {
	switch (status) {
		case "active":
			return { color: brandColors.mint, label: "Active", Icon: CheckCircle2 };
		case "verified":
			return { color: brandColors.mint, label: "Verified", Icon: CheckCircle2 };
		case "pending_verification":
			return { color: brandColors.amber, label: "Pending", Icon: Clock };
		case "error":
			return { color: brandColors.rust.DEFAULT, label: "Error", Icon: XCircle };
		case "disabled":
			return { color: "#9CA3AF", label: "Disabled", Icon: AlertCircle };
		default:
			return { color: "#9CA3AF", label: status, Icon: AlertCircle };
	}
}

// Get reason message for unavailable slug
function getSlugReasonMessage(reason: SlugAvailability["reason"]): string {
	switch (reason) {
		case "reserved":
			return "This subdomain is reserved";
		case "taken":
			return "This subdomain is already taken";
		case "too_short":
			return `Must be at least ${MIN_SLUG_LENGTH} characters`;
		case "too_long":
			return `Must be ${MAX_SLUG_LENGTH} characters or less`;
		case "invalid_format":
			return "Only lowercase letters, numbers, and hyphens";
		default:
			return "Invalid subdomain";
	}
}

export default function PublicSpaceSettingsScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { openUrl } = useOpenUrl();

	// API hooks
	const { data: space, isLoading: isLoadingSpace } = useMySpace();
	const { data: domains, isLoading: isLoadingDomains } = useListDomains();
	const updateSettings = useUpdateSettings();
	const updateSlug = useUpdateSlug();
	const checkSlugAvailability = useCheckSlugAvailability();
	const removeDomain = useRemoveDomain();

	// Local state
	const [copied, setCopied] = useState(false);
	const [isEditingSlug, setIsEditingSlug] = useState(false);
	const [slugInput, setSlugInput] = useState("");
	const [slugAvailability, setSlugAvailability] =
		useState<SlugAvailability | null>(null);
	const [isCheckingSlug, setIsCheckingSlug] = useState(false);

	const debouncedSlug = useDebounce(slugInput, 300);

	// Initialize slug input when space data loads
	useEffect(() => {
		if (space?.slug && !isEditingSlug) {
			setSlugInput(space.slug);
		}
	}, [space?.slug, isEditingSlug]);

	// Check slug availability when debounced input changes
	useEffect(() => {
		if (
			!isEditingSlug ||
			debouncedSlug === space?.slug ||
			debouncedSlug.length < MIN_SLUG_LENGTH
		) {
			setSlugAvailability(null);
			setIsCheckingSlug(false);
			return;
		}

		// Client-side validation first
		if (debouncedSlug.length > MAX_SLUG_LENGTH) {
			setSlugAvailability({ available: false, reason: "too_long" });
			setIsCheckingSlug(false);
			return;
		}

		if (!SLUG_REGEX.test(debouncedSlug)) {
			setSlugAvailability({ available: false, reason: "invalid_format" });
			setIsCheckingSlug(false);
			return;
		}

		// Check with API
		setIsCheckingSlug(true);
		checkSlugAvailability.mutate(debouncedSlug, {
			onSuccess: (result) => {
				setSlugAvailability(result);
				setIsCheckingSlug(false);
			},
			onError: () => {
				setIsCheckingSlug(false);
			},
		});
	}, [debouncedSlug, isEditingSlug, space?.slug, checkSlugAvailability.mutate]);

	const isPublicEnabled = space?.visibility === "public";
	const publicUrl = space?.slug ? buildPublicSpaceUrl(space.slug) : "";

	const handleTogglePublic = useCallback(
		async (value: boolean) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			updateSettings.mutate({
				visibility: value ? "public" : "private",
			});
		},
		[updateSettings],
	);

	const handleSetDefaultSaveVisibility = useCallback(
		(value: SaveVisibility) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			updateSettings.mutate({
				defaultSaveVisibility: value,
			});
		},
		[updateSettings],
	);

	const handleCopyUrl = useCallback(async () => {
		if (!publicUrl) return;
		await Clipboard.setStringAsync(publicUrl);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [publicUrl]);

	const handleOpenPublicSpace = useCallback(() => {
		if (!publicUrl) return;
		openUrl(publicUrl);
	}, [publicUrl, openUrl]);

	const handleSlugChange = useCallback((value: string) => {
		// Normalize: lowercase, only allowed chars
		const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
		setSlugInput(normalized);
	}, []);

	const handleStartEditSlug = useCallback(() => {
		setSlugInput(space?.slug || "");
		setIsEditingSlug(true);
		setSlugAvailability(null);
	}, [space?.slug]);

	const handleCancelEditSlug = useCallback(() => {
		setSlugInput(space?.slug || "");
		setIsEditingSlug(false);
		setSlugAvailability(null);
	}, [space?.slug]);

	const handleSaveSlug = useCallback(async () => {
		if (!slugAvailability?.available || slugInput === space?.slug) {
			setIsEditingSlug(false);
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		updateSlug.mutate(slugInput, {
			onSuccess: () => {
				setIsEditingSlug(false);
				setSlugAvailability(null);
			},
			onError: (error) => {
				Alert.alert(
					"Error",
					error instanceof Error ? error.message : "Failed to update subdomain",
				);
			},
		});
	}, [slugInput, slugAvailability, space?.slug, updateSlug]);

	const handleRemoveDomain = useCallback(
		(domain: DomainMapping) => {
			Alert.alert(
				"Remove Domain",
				`Are you sure you want to remove ${domain.domain}? This cannot be undone.`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => {
							Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Warning,
							);
							removeDomain.mutate(domain.id);
						},
					},
				],
			);
		},
		[removeDomain],
	);

	const handleOpenWebSettings = useCallback(() => {
		openUrl("https://backpocket.my/app/settings");
	}, [openUrl]);

	const canSaveSlug =
		slugAvailability?.available &&
		slugInput !== space?.slug &&
		!updateSlug.isPending;

	// Loading state
	if (isLoadingSpace) {
		return (
			<View
				style={[
					styles.container,
					styles.centerContent,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 24 },
				]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Public Space Toggle */}
				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					Visibility
				</Text>
				<Card style={styles.card}>
					<CardContent style={styles.cardContent}>
						<View style={styles.row}>
							<View
								style={[
									styles.iconContainer,
									{
										backgroundColor: isPublicEnabled
											? `${brandColors.mint}30`
											: colors.muted,
									},
								]}
							>
								{isPublicEnabled ? (
									<Unlock size={20} color={brandColors.mint} strokeWidth={2} />
								) : (
									<Lock
										size={20}
										color={colors.mutedForeground}
										strokeWidth={2}
									/>
								)}
							</View>
							<View style={styles.rowContent}>
								<Text style={[styles.rowLabel, { color: colors.text }]}>
									Public Space
								</Text>
								<Text
									style={[
										styles.rowDescription,
										{ color: colors.mutedForeground },
									]}
								>
									{isPublicEnabled
										? "Your public saves are visible to anyone"
										: "Your space is private and hidden"}
								</Text>
							</View>
							<Switch
								value={isPublicEnabled}
								onValueChange={handleTogglePublic}
								trackColor={{
									false: colors.muted,
									true: brandColors.mint,
								}}
								thumbColor="#FFFFFF"
								disabled={updateSettings.isPending}
							/>
						</View>
					</CardContent>
				</Card>

				{/* Default Save Visibility */}
				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					Default Save Visibility
				</Text>
				<Card style={styles.card}>
					<CardContent style={styles.cardContent}>
						<View style={styles.row}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: `${brandColors.rust.DEFAULT}15` },
								]}
							>
								<Bookmark
									size={20}
									color={brandColors.rust.DEFAULT}
									strokeWidth={2}
								/>
							</View>
							<View style={styles.rowContent}>
								<Text style={[styles.rowLabel, { color: colors.text }]}>
									New saves default to
								</Text>
								<Text
									style={[
										styles.rowDescription,
										{ color: colors.mutedForeground },
									]}
								>
									When sharing or adding saves quickly
								</Text>
							</View>
						</View>
						<View style={styles.defaultVisibilityOptions}>
							{(["public", "private"] as SaveVisibility[]).map((v) => {
								const isSelected = space?.defaultSaveVisibility === v;
								const isPublicOption = v === "public";
								return (
									<TouchableOpacity
										key={v}
										style={[
											styles.defaultVisibilityOption,
											{
												borderColor: isSelected
													? isPublicOption
														? brandColors.mint
														: colors.mutedForeground
													: colors.border,
												backgroundColor: isSelected
													? isPublicOption
														? `${brandColors.mint}15`
														: `${colors.mutedForeground}10`
													: "transparent",
											},
										]}
										onPress={() => handleSetDefaultSaveVisibility(v)}
										activeOpacity={0.7}
										disabled={updateSettings.isPending}
									>
										{isPublicOption ? (
											<Unlock
												size={16}
												color={
													isSelected ? brandColors.mint : colors.mutedForeground
												}
												strokeWidth={2}
											/>
										) : (
											<Lock
												size={16}
												color={
													isSelected ? colors.text : colors.mutedForeground
												}
												strokeWidth={2}
											/>
										)}
										<Text
											style={[
												styles.defaultVisibilityText,
												{
													color: isSelected
														? isPublicOption
															? brandColors.mint
															: colors.text
														: colors.mutedForeground,
													fontFamily: isSelected
														? "DMSans-Bold"
														: "DMSans-Medium",
												},
											]}
										>
											{v.charAt(0).toUpperCase() + v.slice(1)}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</CardContent>
				</Card>
				<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
					This applies to quick saves from the share extension and new saves.
					You can always change visibility for individual saves.
				</Text>

				{/* Public Space URL */}
				{isPublicEnabled && (
					<>
						<Text
							style={[styles.sectionTitle, { color: colors.mutedForeground }]}
						>
							Your Public Link
						</Text>

						{/* Visual Preview Card */}
						<View style={styles.previewCardContainer}>
							<LinearGradient
								colors={[`${brandColors.teal}30`, `${brandColors.mint}20`]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.previewCard}
							>
								<View style={styles.previewHeader}>
									<View
										style={[
											styles.previewIconContainer,
											{ backgroundColor: `${brandColors.mint}40` },
										]}
									>
										<Globe size={24} color={brandColors.mint} strokeWidth={2} />
									</View>
									<View style={styles.previewHeaderText}>
										<Text style={[styles.previewTitle, { color: colors.text }]}>
											Your Public Space
										</Text>
										<Text
											style={[styles.previewUrl, { color: brandColors.teal }]}
										>
											{publicUrl}
										</Text>
									</View>
								</View>

								<View style={styles.previewStats}>
									<View style={styles.previewStat}>
										<Eye size={14} color={colors.mutedForeground} />
										<Text
											style={[
												styles.previewStatText,
												{ color: colors.mutedForeground },
											]}
										>
											Public saves appear here
										</Text>
									</View>
								</View>

								<View style={styles.previewActions}>
									<TouchableOpacity
										style={[
											styles.previewButton,
											{
												backgroundColor: colors.card,
												borderColor: colors.border,
											},
										]}
										onPress={handleCopyUrl}
										activeOpacity={0.7}
									>
										{copied ? (
											<Check
												size={18}
												color={brandColors.mint}
												strokeWidth={2}
											/>
										) : (
											<Copy size={18} color={colors.text} strokeWidth={2} />
										)}
										<Text
											style={[
												styles.previewButtonText,
												{ color: copied ? brandColors.mint : colors.text },
											]}
										>
											{copied ? "Copied!" : "Copy Link"}
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.previewButton,
											styles.previewButtonPrimary,
											{ backgroundColor: brandColors.teal },
										]}
										onPress={handleOpenPublicSpace}
										activeOpacity={0.7}
									>
										<PanelTop size={18} color="#FFFFFF" strokeWidth={2} />
										<Text style={styles.previewButtonTextPrimary}>
											Preview Space
										</Text>
									</TouchableOpacity>
								</View>
							</LinearGradient>
						</View>

						<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
							Share your public link with others to let them view your public
							saves and collections. Only saves marked as public will be
							visible.
						</Text>

						{/* Subdomain/Slug Editor */}
						<Text
							style={[styles.sectionTitle, { color: colors.mutedForeground }]}
						>
							Customize Subdomain
						</Text>
						<Card style={styles.card}>
							<CardContent style={styles.cardContent}>
								{isEditingSlug ? (
									<>
										<View style={styles.slugEditRow}>
											<TextInput
												style={[
													styles.slugInput,
													{
														color: colors.text,
														backgroundColor: colors.background,
													},
												]}
												value={slugInput}
												onChangeText={handleSlugChange}
												autoCapitalize="none"
												autoCorrect={false}
												autoFocus
												placeholder="your-subdomain"
												placeholderTextColor={colors.mutedForeground}
												maxLength={MAX_SLUG_LENGTH}
											/>
											<Text
												style={[
													styles.slugSuffix,
													{ color: colors.mutedForeground },
												]}
											>
												.{ROOT_DOMAIN}
											</Text>
										</View>

										{/* Availability indicator */}
										{(isCheckingSlug ||
											slugAvailability ||
											(slugInput.length > 0 &&
												slugInput.length < MIN_SLUG_LENGTH)) && (
											<View style={styles.availabilityRow}>
												{isCheckingSlug ? (
													<>
														<ActivityIndicator
															size="small"
															color={colors.mutedForeground}
														/>
														<Text
															style={[
																styles.availabilityText,
																{ color: colors.mutedForeground },
															]}
														>
															Checking...
														</Text>
													</>
												) : slugAvailability ? (
													<>
														{slugAvailability.available ? (
															<CheckCircle2
																size={14}
																color={brandColors.mint}
																strokeWidth={2.5}
															/>
														) : (
															<XCircle
																size={14}
																color={colors.destructive}
																strokeWidth={2.5}
															/>
														)}
														<Text
															style={[
																styles.availabilityText,
																{
																	color: slugAvailability.available
																		? brandColors.mint
																		: colors.destructive,
																},
															]}
														>
															{slugAvailability.available
																? "Available!"
																: getSlugReasonMessage(slugAvailability.reason)}
														</Text>
													</>
												) : slugInput.length > 0 &&
													slugInput.length < MIN_SLUG_LENGTH ? (
													<Text
														style={[
															styles.availabilityText,
															{ color: colors.mutedForeground },
														]}
													>
														Enter at least {MIN_SLUG_LENGTH} characters
													</Text>
												) : null}
											</View>
										)}

										{/* Edit actions */}
										<View style={styles.editActions}>
											<TouchableOpacity
												style={[
													styles.editButton,
													styles.editButtonSecondary,
													{ borderColor: colors.border },
												]}
												onPress={handleCancelEditSlug}
												activeOpacity={0.7}
											>
												<Text
													style={[
														styles.editButtonText,
														{ color: colors.text },
													]}
												>
													Cancel
												</Text>
											</TouchableOpacity>
											<TouchableOpacity
												style={[
													styles.editButton,
													{
														backgroundColor: canSaveSlug
															? colors.primary
															: colors.muted,
														opacity: canSaveSlug ? 1 : 0.5,
													},
												]}
												onPress={handleSaveSlug}
												activeOpacity={0.7}
												disabled={!canSaveSlug}
											>
												{updateSlug.isPending ? (
													<ActivityIndicator size="small" color="#FFFFFF" />
												) : (
													<Text
														style={[
															styles.editButtonText,
															{
																color: canSaveSlug
																	? "#FFFFFF"
																	: colors.mutedForeground,
															},
														]}
													>
														Save
													</Text>
												)}
											</TouchableOpacity>
										</View>
									</>
								) : (
									<View style={styles.slugDisplayRow}>
										<View style={styles.slugDisplay}>
											<Text style={[styles.slugText, { color: colors.text }]}>
												{space?.slug}
											</Text>
											<Text
												style={[
													styles.slugSuffix,
													{ color: colors.mutedForeground },
												]}
											>
												.{ROOT_DOMAIN}
											</Text>
										</View>
										<TouchableOpacity
											style={[
												styles.changeButton,
												{ backgroundColor: colors.muted },
											]}
											onPress={handleStartEditSlug}
											activeOpacity={0.7}
										>
											<Text
												style={[
													styles.changeButtonText,
													{ color: colors.text },
												]}
											>
												Change
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</CardContent>
						</Card>

						{/* Custom Domains */}
						<Text
							style={[styles.sectionTitle, { color: colors.mutedForeground }]}
						>
							Custom Domains
						</Text>

						{isLoadingDomains ? (
							<Card style={styles.card}>
								<CardContent style={styles.cardContent}>
									<ActivityIndicator
										size="small"
										color={colors.mutedForeground}
									/>
								</CardContent>
							</Card>
						) : domains && domains.length > 0 ? (
							domains.map((domain) => {
								const statusInfo = getDomainStatusInfo(domain.status);
								const StatusIcon = statusInfo.Icon;

								return (
									<Card key={domain.id} style={styles.card}>
										<CardContent style={styles.cardContent}>
											<View style={styles.domainRow}>
												<View style={styles.domainInfo}>
													<Text
														style={[styles.domainName, { color: colors.text }]}
														numberOfLines={1}
													>
														{domain.domain}
													</Text>
													<View style={styles.domainStatus}>
														<StatusIcon
															size={14}
															color={statusInfo.color}
															strokeWidth={2}
														/>
														<Text
															style={[
																styles.domainStatusText,
																{ color: statusInfo.color },
															]}
														>
															{statusInfo.label}
														</Text>
													</View>
												</View>
												<TouchableOpacity
													style={[
														styles.removeButton,
														{ backgroundColor: `${colors.destructive}15` },
													]}
													onPress={() => handleRemoveDomain(domain)}
													activeOpacity={0.7}
													disabled={removeDomain.isPending}
												>
													{removeDomain.isPending ? (
														<ActivityIndicator
															size="small"
															color={colors.destructive}
														/>
													) : (
														<Trash2
															size={18}
															color={colors.destructive}
															strokeWidth={2}
														/>
													)}
												</TouchableOpacity>
											</View>
										</CardContent>
									</Card>
								);
							})
						) : null}

						{/* Add Domain CTA (web only) */}
						<Card
							style={[styles.card, { backgroundColor: `${colors.muted}80` }]}
						>
							<CardContent style={styles.cardContent}>
								<View style={styles.webOnlyContainer}>
									<View
										style={[
											styles.iconContainer,
											{ backgroundColor: `${colors.primary}20` },
										]}
									>
										<Laptop size={20} color={colors.primary} strokeWidth={2} />
									</View>
									<View style={styles.webOnlyContent}>
										<Text style={[styles.webOnlyTitle, { color: colors.text }]}>
											Add Custom Domain
										</Text>
										<Text
											style={[
												styles.webOnlyDescription,
												{ color: colors.mutedForeground },
											]}
										>
											Adding a custom domain requires DNS configuration. Visit
											backpocket.my/settings on your computer to set one up.
										</Text>
									</View>
								</View>
								<TouchableOpacity
									style={[
										styles.webSettingsButton,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
										},
									]}
									onPress={handleOpenWebSettings}
									activeOpacity={0.7}
								>
									<Text
										style={[
											styles.webSettingsButtonText,
											{ color: colors.text },
										]}
									>
										Open Settings
									</Text>
									<ExternalLink size={16} color={colors.text} strokeWidth={2} />
								</TouchableOpacity>
							</CardContent>
						</Card>
					</>
				)}

				{/* Help Text when disabled */}
				{!isPublicEnabled && (
					<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
						When disabled, no one can view your public space. Enable it to share
						your saves with others.
					</Text>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	centerContent: {
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		padding: 16,
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 8,
		marginLeft: 4,
		marginTop: 8,
	},
	card: {
		marginBottom: 12,
	},
	cardContent: {
		padding: 16,
		paddingTop: 16,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	rowContent: {
		flex: 1,
	},
	rowLabel: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 2,
	},
	rowDescription: {
		fontSize: 14,
		fontFamily: "DMSans",
		lineHeight: 20,
	},
	urlContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	urlText: {
		flex: 1,
		fontSize: 15,
		fontFamily: "DMSans-Medium",
	},
	urlActions: {
		flexDirection: "row",
		gap: 10,
	},
	urlButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: "transparent",
	},
	urlButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	helpText: {
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 20,
		marginLeft: 4,
		marginBottom: 8,
	},
	// Preview card styles
	previewCardContainer: {
		marginBottom: 12,
		borderRadius: radii.xl,
		overflow: "hidden",
	},
	previewCard: {
		padding: 20,
		borderRadius: radii.xl,
	},
	previewHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 16,
	},
	previewIconContainer: {
		width: 48,
		height: 48,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	previewHeaderText: {
		flex: 1,
	},
	previewTitle: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 3,
	},
	previewUrl: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	previewStats: {
		marginBottom: 16,
	},
	previewStat: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	previewStatText: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	previewActions: {
		flexDirection: "row",
		gap: 10,
	},
	previewButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	previewButtonPrimary: {
		borderWidth: 0,
	},
	previewButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	previewButtonTextPrimary: {
		color: "#FFFFFF",
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	// Slug editor styles
	slugEditRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	slugInput: {
		flex: 1,
		height: 48,
		borderRadius: radii.md,
		paddingHorizontal: 16,
		fontSize: 17,
		fontFamily: "DMSans-Medium",
	},
	slugSuffix: {
		fontSize: 15,
		fontFamily: "DMSans",
		marginRight: 4,
	},
	availabilityRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 10,
	},
	availabilityText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	editActions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	editButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 14,
		borderRadius: radii.md,
	},
	editButtonSecondary: {
		backgroundColor: "transparent",
		borderWidth: 1,
	},
	editButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "600",
	},
	slugDisplayRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	slugDisplay: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	slugText: {
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	changeButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: radii.md,
	},
	changeButtonText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	// Domain styles
	domainRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	domainInfo: {
		flex: 1,
		marginRight: 12,
	},
	domainName: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 4,
	},
	domainStatus: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	domainStatusText: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	removeButton: {
		width: 40,
		height: 40,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	// Web-only CTA styles
	webOnlyContainer: {
		flexDirection: "row",
		gap: 14,
		marginBottom: 16,
	},
	webOnlyContent: {
		flex: 1,
	},
	webOnlyTitle: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 4,
	},
	webOnlyDescription: {
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 18,
	},
	webSettingsButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	webSettingsButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	// Default visibility styles
	defaultVisibilityOptions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	defaultVisibilityOption: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 14,
		borderWidth: 1.5,
		borderRadius: radii.md,
	},
	defaultVisibilityText: {
		fontSize: 15,
		fontWeight: "500",
	},
});
