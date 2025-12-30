/**
 * Space/Dashboard API hooks
 * React Query hooks for space and dashboard operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAPIClient } from "./hooks";
import type {
	DashboardData,
	Space,
	SpaceSettingsInput,
	StatsResponse,
} from "./types";

// Query keys
export const spaceKeys = {
	all: ["space"] as const,
	mySpace: () => [...spaceKeys.all, "mySpace"] as const,
	dashboard: () => [...spaceKeys.all, "dashboard"] as const,
	stats: () => [...spaceKeys.all, "stats"] as const,
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
 */
export function useDashboard() {
	const client = useAPIClient();

	return useQuery({
		queryKey: spaceKeys.dashboard(),
		queryFn: () => client.query<void, DashboardData>("space.getDashboardData"),
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
			client.mutate<{ slug: string }, { available: boolean; message?: string }>(
				"space.checkSlugAvailability",
				{ slug },
			),
	});
}
