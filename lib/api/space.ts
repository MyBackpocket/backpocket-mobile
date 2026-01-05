/**
 * Space/Dashboard API hooks
 * React Query hooks for space and dashboard operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAPIClient } from "./hooks";
import type {
	DashboardData,
	DomainMapping,
	DomainStatusResponse,
	SlugAvailability,
	Space,
	SpaceSettingsInput,
	StatsResponse,
} from "./types";
import {
	hasProcessingSaves,
	PROCESSING_POLL_INTERVAL_MS,
} from "./use-processing-saves";

// Query keys
export const spaceKeys = {
	all: ["space"] as const,
	mySpace: () => [...spaceKeys.all, "mySpace"] as const,
	dashboard: () => [...spaceKeys.all, "dashboard"] as const,
	stats: () => [...spaceKeys.all, "stats"] as const,
	domains: () => [...spaceKeys.all, "domains"] as const,
	domainStatus: (domainId: string) =>
		[...spaceKeys.all, "domainStatus", domainId] as const,
};

/**
 * Hook to fetch the current user's space
 */
export function useMySpace() {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.mySpace(),
		queryFn: () => client.query<void, Space>("space.getMySpace"),
	});
}

/**
 * Hook to fetch dashboard data (stats + recent saves + space)
 *
 * Automatically polls for updates when there are recently created saves
 * that are still being processed by the backend.
 */
export function useDashboard() {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.dashboard(),
		queryFn: () => client.query<void, DashboardData>("space.getDashboardData"),
		// Auto-poll when there are processing saves
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data?.recentSaves) return false;
			return hasProcessingSaves(data.recentSaves)
				? PROCESSING_POLL_INTERVAL_MS
				: false;
		},
	});
}

/**
 * Hook to fetch stats
 */
export function useStats() {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.stats(),
		queryFn: () => client.query<void, StatsResponse>("space.getStats"),
	});
}

/**
 * Hook to update space settings
 */
export function useUpdateSettings() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SpaceSettingsInput) =>
			client.mutate<SpaceSettingsInput, Space>("space.updateSettings", input),
		onSuccess: (data) => {
			queryClient.setQueryData(spaceKeys.mySpace(), data);
			queryClient.invalidateQueries({ queryKey: spaceKeys.dashboard() });
		},
	});
}

/**
 * Hook to update the space slug
 */
export function useUpdateSlug() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (slug: string) =>
			client.mutate<{ slug: string }, Space>("space.updateSlug", { slug }),
		onSuccess: (data) => {
			queryClient.setQueryData(spaceKeys.mySpace(), data);
			queryClient.invalidateQueries({ queryKey: spaceKeys.dashboard() });
		},
	});
}

/**
 * Hook to check if a slug is available
 */
export function useCheckSlugAvailability() {
	const client = useAPIClient();

	return useMutation({
		mutationFn: (slug: string) =>
			client.mutate<{ slug: string }, SlugAvailability>(
				"space.checkSlugAvailability",
				{ slug },
			),
	});
}

// === Domain Hooks ===

/**
 * Hook to list all custom domains for the user's space
 */
export function useListDomains() {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.domains(),
		queryFn: () => client.query<void, DomainMapping[]>("space.listDomains"),
	});
}

/**
 * Hook to get detailed status for a specific domain
 */
export function useDomainStatus(domainId: string) {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.domainStatus(domainId),
		queryFn: () =>
			client.query<{ domainId: string }, DomainStatusResponse>(
				"space.getDomainStatus",
				{ domainId },
			),
		enabled: !!domainId,
	});
}

/**
 * Hook to remove a custom domain
 */
export function useRemoveDomain() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (domainId: string) =>
			client.mutate<{ domainId: string }, { success: boolean }>(
				"space.removeDomain",
				{ domainId },
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: spaceKeys.domains() });
		},
	});
}

/**
 * Hook to verify a domain (trigger verification check)
 */
export function useVerifyDomain() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (domainId: string) =>
			client.mutate<
				{ domainId: string },
				{ verified: boolean; status: string }
			>("space.verifyDomain", { domainId }),
		onSuccess: (_, domainId) => {
			queryClient.invalidateQueries({ queryKey: spaceKeys.domains() });
			queryClient.invalidateQueries({
				queryKey: spaceKeys.domainStatus(domainId),
			});
		},
	});
}
