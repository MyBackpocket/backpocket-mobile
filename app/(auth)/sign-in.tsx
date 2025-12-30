import { useSignIn, useSSO } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
	const { signIn, setActive, isLoaded } = useSignIn();
	const { startSSOFlow } = useSSO();
	const router = useRouter();
	const colors = useThemeColors();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
		null,
	);

	// 2FA state
	const [needs2FA, setNeeds2FA] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");

	const handleSignIn = useCallback(async () => {
		if (!isLoaded || !signIn) return;

		if (!email.trim() || !password.trim()) {
			Alert.alert("Error", "Please enter your email and password");
			return;
		}

		setLoading(true);
		try {
			const result = await signIn.create({
				identifier: email.trim(),
				password,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(tabs)");
			} else if (result.status === "needs_second_factor") {
				// Prepare email code verification (sends the email)
				await signIn.prepareSecondFactor({
					strategy: "email_code",
				});
				setNeeds2FA(true);
			} else {
				console.log("Sign in requires additional steps:", result.status);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "An error occurred during sign in";
			Alert.alert("Sign In Error", message);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, signIn, setActive, router, email, password]);

	const handle2FAVerify = useCallback(async () => {
		if (!isLoaded || !signIn) return;

		if (!verificationCode.trim()) {
			Alert.alert("Error", "Please enter the verification code");
			return;
		}

		setLoading(true);
		try {
			const result = await signIn.attemptSecondFactor({
				strategy: "email_code",
				code: verificationCode.trim(),
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(tabs)");
			} else {
				console.log("2FA verification requires additional steps:", result.status);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Invalid verification code";
			Alert.alert("Verification Error", message);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, signIn, setActive, router, verificationCode]);

	const handleResendCode = useCallback(async () => {
		if (!isLoaded || !signIn) return;

		setLoading(true);
		try {
			await signIn.prepareSecondFactor({
				strategy: "email_code",
			});
			Alert.alert("Code Sent", "A new verification code has been sent to your email");
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to resend code";
			Alert.alert("Error", message);
		} finally {
			setLoading(false);
		}
	}, [isLoaded, signIn]);

	const handleOAuthSignIn = useCallback(
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
						: "An error occurred during sign in";
				Alert.alert("Sign In Error", message);
			} finally {
				setOauthLoading(null);
			}
		},
		[startSSOFlow, router],
	);

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
						Welcome back
					</Text>
					<Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
						Sign in to your account to continue
					</Text>
				</View>

				<View style={styles.form}>
					{needs2FA ? (
						<>
							{/* 2FA Verification Form */}
							<Text style={[styles.twoFactorTitle, { color: colors.text }]}>
								Check Your Email
							</Text>
							<Text style={[styles.twoFactorSubtitle, { color: colors.mutedForeground }]}>
								We sent a verification code to your email address
							</Text>

							<Input
								label="Verification Code"
								placeholder="Enter code"
								value={verificationCode}
								onChangeText={setVerificationCode}
								autoCapitalize="none"
								keyboardType="number-pad"
								editable={!loading}
								containerStyle={styles.inputContainer}
							/>

							<Button
								onPress={handle2FAVerify}
								loading={loading}
								disabled={!isLoaded || loading || !verificationCode.trim()}
								style={styles.signInButton}
							>
								Verify
							</Button>

							<Button
								variant="ghost"
								onPress={handleResendCode}
								disabled={loading}
								style={styles.backButton}
							>
								Resend Code
							</Button>

							<Button
								variant="ghost"
								onPress={() => {
									setNeeds2FA(false);
									setVerificationCode("");
								}}
								disabled={loading}
								style={styles.backButton}
							>
								Back to Sign In
							</Button>
						</>
					) : (
						<>
							{/* OAuth Buttons */}
							<Button
								variant="outline"
								onPress={() => handleOAuthSignIn("oauth_google")}
								loading={oauthLoading === "google"}
								disabled={!!oauthLoading || loading}
								style={styles.oauthButton}
							>
								Continue with Google
							</Button>

							<Button
								variant="outline"
								onPress={() => handleOAuthSignIn("oauth_apple")}
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
								placeholder="Enter your password"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								autoCapitalize="none"
								autoComplete="password"
								editable={!loading && !oauthLoading}
								containerStyle={styles.inputContainer}
							/>

							<Button
								onPress={handleSignIn}
								loading={loading}
								disabled={!isLoaded || loading || !!oauthLoading}
								style={styles.signInButton}
							>
								Sign In
							</Button>
						</>
					)}
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: colors.mutedForeground }]}>
						Don't have an account?{" "}
					</Text>
					<Link href="/(auth)/sign-up" asChild>
						<TouchableOpacity>
							<Text style={[styles.link, { color: brandColors.rust.DEFAULT }]}>
								Sign up
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
	backButton: {
		marginTop: 4,
	},
	twoFactorTitle: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		textAlign: "center",
		marginBottom: 8,
	},
	twoFactorSubtitle: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
		marginBottom: 20,
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
