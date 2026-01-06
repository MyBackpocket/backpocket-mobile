/**
 * SwipeableRow component
 * iOS Mail-style swipe to reveal action menu
 */

import * as Haptics from "expo-haptics";
import { Archive, ArchiveRestore, Star, Trash2 } from "lucide-react-native";
import type React from "react";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { brandColors } from "@/constants/theme";

const ACTION_WIDTH = 64;
const NUM_ACTIONS = 3;
const TOTAL_ACTIONS_WIDTH = ACTION_WIDTH * NUM_ACTIONS;
const SNAP_THRESHOLD = 40;
// Minimum horizontal movement to consider it a swipe (not a tap)
const SWIPE_MOVEMENT_THRESHOLD = 5;

const TIMING_CONFIG = {
	duration: 200,
	easing: Easing.out(Easing.cubic),
};

interface SwipeableRowProps {
	children: React.ReactNode;
	onPress?: () => void;
	onDelete?: () => void;
	onArchive?: () => void;
	onFavorite?: () => void;
	isArchived?: boolean;
	isFavorite?: boolean;
	enabled?: boolean;
}

export function SwipeableRow({
	children,
	onPress,
	onDelete,
	onArchive,
	onFavorite,
	isArchived = false,
	isFavorite = false,
	enabled = true,
}: SwipeableRowProps) {
	const translateX = useSharedValue(0);
	const isOpen = useSharedValue(false);
	// Track if user has swiped (to prevent tap from firing after swipe)
	const didSwipeRef = useRef(false);

	const triggerLightHaptic = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	const closeRow = () => {
		translateX.value = withTiming(0, TIMING_CONFIG);
		isOpen.value = false;
	};

	const openRow = () => {
		translateX.value = withTiming(-TOTAL_ACTIONS_WIDTH, TIMING_CONFIG);
		isOpen.value = true;
	};

	const markAsSwiped = () => {
		didSwipeRef.current = true;
	};

	const handleDelete = () => {
		closeRow();
		onDelete?.();
	};

	const handleArchive = () => {
		closeRow();
		onArchive?.();
	};

	const handleFavorite = () => {
		closeRow();
		onFavorite?.();
	};

	const panGesture = Gesture.Pan()
		.enabled(enabled)
		.activeOffsetX([-10, 10])
		.failOffsetY([-10, 10])
		.onUpdate((event) => {
			// Track if we've moved enough to consider this a swipe
			if (Math.abs(event.translationX) > SWIPE_MOVEMENT_THRESHOLD) {
				runOnJS(markAsSwiped)();
			}

			const startPosition = isOpen.value ? -TOTAL_ACTIONS_WIDTH : 0;
			const newPosition = startPosition + event.translationX;
			// Clamp between fully closed (0) and fully open (-TOTAL_ACTIONS_WIDTH)
			translateX.value = Math.min(
				0,
				Math.max(newPosition, -TOTAL_ACTIONS_WIDTH),
			);
		})
		.onEnd((event) => {
			const velocity = event.velocityX;
			const currentPosition = translateX.value;

			// Fast swipe detection
			if (Math.abs(velocity) > 500) {
				if (velocity < 0) {
					runOnJS(triggerLightHaptic)();
					runOnJS(openRow)();
				} else {
					runOnJS(closeRow)();
				}
				return;
			}

			// Position-based snap
			if (currentPosition < -SNAP_THRESHOLD) {
				if (!isOpen.value) {
					runOnJS(triggerLightHaptic)();
				}
				runOnJS(openRow)();
			} else {
				runOnJS(closeRow)();
			}
		});

	const animatedRowStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const animatedActionsStyle = useAnimatedStyle(() => ({
		opacity: translateX.value < -10 ? 1 : 0,
	}));

	// Handle press on the row content (separate from swipe gesture)
	const handleRowPress = () => {
		// If we just finished swiping, don't trigger press
		if (didSwipeRef.current) {
			didSwipeRef.current = false;
			return;
		}

		// If row is open, close it instead of navigating
		if (isOpen.value) {
			closeRow();
		} else {
			onPress?.();
		}
	};

	// Reset swipe tracking when touch starts
	const handlePressIn = () => {
		didSwipeRef.current = false;
	};

	return (
		<View style={styles.container}>
			{/* Action buttons (revealed on swipe) */}
			<Animated.View style={[styles.actionsContainer, animatedActionsStyle]}>
				<Pressable
					style={({ pressed }) => [
						styles.actionButton,
						pressed && styles.actionButtonPressed,
					]}
					onPress={handleFavorite}
				>
					<Star
						size={20}
						color={brandColors.amber}
						strokeWidth={2}
						fill={isFavorite ? brandColors.amber : "transparent"}
					/>
					<Text style={[styles.actionText, { color: brandColors.amber }]}>
						{isFavorite ? "Unfavorite" : "Favorite"}
					</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.actionButton,
						pressed && styles.actionButtonPressed,
					]}
					onPress={handleArchive}
				>
					{isArchived ? (
						<ArchiveRestore
							size={20}
							color={brandColors.teal}
							strokeWidth={2}
						/>
					) : (
						<Archive size={20} color={brandColors.teal} strokeWidth={2} />
					)}
					<Text style={[styles.actionText, { color: brandColors.teal }]}>
						{isArchived ? "Restore" : "Archive"}
					</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.actionButton,
						pressed && styles.actionButtonPressed,
					]}
					onPress={handleDelete}
				>
					<Trash2 size={20} color="#E53935" strokeWidth={2} />
					<Text style={[styles.actionText, { color: "#E53935" }]}>Delete</Text>
				</Pressable>
			</Animated.View>

			{/* Row Content - Pan gesture for swipe, Pressable for tap */}
			<GestureDetector gesture={panGesture}>
				<Animated.View style={[styles.row, animatedRowStyle]}>
					<Pressable
						onPress={handleRowPress}
						onPressIn={handlePressIn}
						disabled={!enabled}
						style={styles.pressableContent}
					>
						{children}
					</Pressable>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		overflow: "hidden",
	},
	row: {
		backgroundColor: "transparent",
	},
	pressableContent: {
		flex: 1,
	},
	actionsContainer: {
		position: "absolute",
		right: 0,
		top: 0,
		bottom: 0,
		flexDirection: "row",
		alignItems: "center",
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
		gap: 6,
	},
	actionButtonPressed: {
		opacity: 0.5,
	},
	actionText: {
		fontSize: 11,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
});
