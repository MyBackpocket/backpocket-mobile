/**
 * React Context and hooks for the API client
 * Provides authenticated API access throughout the app
 */

import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";
import { type APIClient, createAPIClient } from "./client";

// Context for the API client
const APIClientContext = createContext<APIClient | null>(null);

interface APIClientProviderProps {
	children: React.ReactNode;
}

/**
 * Provider component that creates an authenticated API client
 */
export function APIClientProvider({ children }: APIClientProviderProps) {
	// Get token function from Clerk (if configured)
	// biome-ignore lint/correctness/useHookAtTopLevel: Conditional hook based on Clerk config is intentional
	const auth = CLERK_PUBLISHABLE_KEY ? useAuth() : null;
	const queryClient = useQueryClient();

	// Use a ref to always have the latest auth object
	const authRef = useRef(auth);
	authRef.current = auth;

	// Create client that always uses latest auth via ref
	const client = useMemo(() => {
		const getToken = async (): Promise<string | null> => {
			const currentAuth = authRef.current;
			if (!currentAuth?.getToken) {
				return null;
			}
			try {
				return await currentAuth.getToken();
			} catch {
				return null;
			}
		};

		return createAPIClient(getToken);
	}, []); // No deps needed since we use ref

	// Invalidate all queries when auth state changes (sign in/out)
	const isSignedIn = auth?.isSignedIn;
	const prevIsSignedIn = useRef(isSignedIn);

	useEffect(() => {
		console.log("[Auth]", {
			isSignedIn,
			prevIsSignedIn: prevIsSignedIn.current,
			willInvalidate:
				prevIsSignedIn.current !== isSignedIn &&
				prevIsSignedIn.current !== undefined,
		});

		// Only invalidate when auth state actually changes (not on initial mount)
		if (
			prevIsSignedIn.current !== isSignedIn &&
			prevIsSignedIn.current !== undefined
		) {
			console.log("[Auth] Invalidating all queries due to auth state change");
			// Clear all cached queries when auth state changes
			queryClient.invalidateQueries();
		}
		prevIsSignedIn.current = isSignedIn;
	}, [isSignedIn, queryClient]);

	return (
		<APIClientContext.Provider value={client}>
			{children}
		</APIClientContext.Provider>
	);
}

/**
 * Hook to get the API client
 */
export function useAPIClient(): APIClient {
	const client = useContext(APIClientContext);
	if (!client) {
		throw new Error("useAPIClient must be used within an APIClientProvider");
	}
	return client;
}
