import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
	const { signUp, setActive, isLoaded } = useSignUp();
	const { startSSOFlow } = useSSO();
	const router = useRouter();
	const colors = useThemeColors();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pendingVerification, setPendingVerification] = useState(false);
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
		null,
	);

	const handleSignUp = useCallback(async () => {
		if (!isLoaded || !signUp) return;

		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please enter your email and password");
			return;
		}

		if (password.length < 8) {
			Alert.alert("Error", "Password must be at least 8 characters");
			return;
		}

		setLoading(true);
		try {
			await signUp.create({
				emailAddress: email.trim(),
				password,
			});

			// Send email verification code
			await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
			setPendingVerification(true);
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "An error occurred during sign up";
			Alert.alert("Sign Up Error", message);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, signUp, email, password]);

	const handleVerification = useCallback(async () => {
		if (!isLoaded || !signUp) return;

		if (!code.trim()) {
			Alert.alert("Error", "Please enter the verification code");
			return;
		}

		setLoading(true);
		try {
			const result = await signUp.attemptEmailAddressVerification({
				code: code.trim(),
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(tabs)");
			} else {
				console.log("Verification requires additional steps:", result.status);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Invalid verification code";
			Alert.alert("Verification Error", message);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, signUp, setActive, router, code]);

	const handleOAuthSignUp = useCallback(
		async (strategy: "oauth_google" | "oauth_apple") => {
			if (!startSSOFlow) return;

			const provider = strategy === "oauth_google" ? "google" : "apple";
			setOauthLoading(provider);

			try {
				const { createdSessionId, setActive: setSSOActive } =
					await startSSOFlow({
						strategy,
						redirectUrl: Linking.createURL("/(tabs)", { scheme: "backpocket" }),
					});

				if (createdSessionId && setSSOActive) {
					await setSSOActive({ session: createdSessionId });
					router.replace("/(tabs)");
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error
						? error.message
						: "An error occurred during sign up";
				Alert.alert("Sign Up Error", message);
			} finally {
				setOauthLoading(null);
			}
		},
		[startSSOFlow, router],
	);

	// Verification code screen
	if (pendingVerification) {
		return (
			<KeyboardAvoidingView
				style={[styles.container, { backgroundColor: colors.background }]}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.header}>
						<Logo size="lg" />
						<Text style={[styles.title, { color: colors.text }]}>
							Verify your email
						</Text>
						<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
							We've sent a verification code to {email}
						</Text>
					</View>

					<View style={styles.form}>
						<Input
							label="Verification Code"
							placeholder="Enter 6-digit code"
							value={code}
							onChangeText={setCode}
							keyboardType="number-pad"
							autoComplete="one-time-code"
							editable={!loading}
							containerStyle={styles.inputContainer}
						/>

						<Button
							onPress={handleVerification}
							loading={loading}
							disabled={!isLoaded || loading}
							style={styles.signInButton}
						>
							Verify Email
						</Button>

						<TouchableOpacity
							onPress={() => setPendingVerification(false)}
							disabled={loading}
						>
							<Text
								style={[styles.backLink, { color: colors.mutedForeground }]}
							>
								← Back to sign up
							</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		);
	}

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Logo size="lg" />
					<Text style={[styles.title, { color: colors.text }]}>
						Create an account
					</Text>
					<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
						Start saving and sharing your favorite links
					</Text>
				</View>

				<View style={styles.form}>
					{/* OAuth Buttons */}
					<Button
						variant="outline"
						onPress={() => handleOAuthSignUp("oauth_google")}
						loading={oauthLoading === "google"}
						disabled={!!oauthLoading || loading}
						style={styles.oauthButton}
					>
						Continue with Google
					</Button>

					<Button
						variant="outline"
						onPress={() => handleOAuthSignUp("oauth_apple")}
						loading={oauthLoading === "apple"}
						disabled={!!oauthLoading || loading}
						style={styles.oauthButton}
					>
						Continue with Apple
					</Button>

					<View style={styles.divider}>
						<View
							style={[styles.dividerLine, { backgroundColor: colors.border }]}
						/>
						<Text
							style={[styles.dividerText, { color: colors.mutedForeground }]}
						>
							or continue with email
						</Text>
						<View
							style={[styles.dividerLine, { backgroundColor: colors.border }]}
						/>
					</View>

					{/* Email/Password Form */}
					<Input
						label="Email"
						placeholder="you@example.com"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						autoComplete="email"
						keyboardType="email-address"
						editable={!loading && !oauthLoading}
						containerStyle={styles.inputContainer}
					/>

					<Input
						label="Password"
						placeholder="Create a password (min. 8 characters)"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoCapitalize="none"
						autoComplete="password-new"
						editable={!loading && !oauthLoading}
						containerStyle={styles.inputContainer}
					/>

					<Button
						onPress={handleSignUp}
						loading={loading}
						disabled={!isLoaded || loading || !!oauthLoading}
						style={styles.signInButton}
					>
						Create Account
					</Button>
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: colors.mutedForeground }]}>
						Already have an account?{" "}
					</Text>
					<Link href="/(auth)/sign-in" asChild>
						<TouchableOpacity>
							<Text style={[styles.link, { color: brandColors.rust.DEFAULT }]}>
								Sign in
							</Text>
						</TouchableOpacity>
					</Link>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 24,
	},
	header: {
		alignItems: "center",
		marginBottom: 32,
	},
	title: {
		fontSize: 24,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginTop: 24,
	},
	subtitle: {
		fontSize: 15,
		fontFamily: "DMSans",
		marginTop: 8,
		textAlign: "center",
	},
	form: {
		gap: 12,
	},
	oauthButton: {
		marginBottom: 4,
	},
	divider: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 16,
	},
	dividerLine: {
		flex: 1,
		height: 1,
	},
	dividerText: {
		fontSize: 13,
		fontFamily: "DMSans",
		paddingHorizontal: 12,
	},
	inputContainer: {
		marginBottom: 4,
	},
	signInButton: {
		marginTop: 8,
	},
	backLink: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
		marginTop: 16,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 24,
	},
	footerText: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	link: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
});
