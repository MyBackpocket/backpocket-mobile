/**
 * Saves API hooks
 * React Query hooks for save-related operations
 */

import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useAPIClient } from "./hooks";
import type {
	CreateSaveInput,
	ListSavesInput,
	ListSavesResponse,
	Save,
	UpdateSaveInput,
} from "./types";

// Query keys
export const savesKeys = {
	all: ["saves"] as const,
	lists: () => [...savesKeys.all, "list"] as const,
	list: (filters: ListSavesInput) => [...savesKeys.lists(), filters] as const,
	details: () => [...savesKeys.all, "detail"] as const,
	detail: (id: string) => [...savesKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of saves
 */
export function useListSaves(input: ListSavesInput = {}) {
	const client = useAPIClient();

	return useInfiniteQuery({
		queryKey: savesKeys.list(input),
		queryFn: async ({ pageParam }) => {
			return client.query<ListSavesInput, ListSavesResponse>(
				"space.listSaves",
				{
					...input,
					cursor: pageParam,
				},
			);
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

/**
 * Hook to fetch a single save by ID
 */
export function useGetSave(saveId: string) {
	const client = useAPIClient();

	return useQuery({
		queryKey: savesKeys.detail(saveId),
		queryFn: () =>
			client.query<{ saveId: string }, Save | null>("space.getSave", {
				saveId,
			}),
		enabled: !!saveId,
	});
}

/**
 * Hook to create a new save
 */
export function useCreateSave() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateSaveInput) =>
			client.mutate<CreateSaveInput, Save>("space.createSave", input),
		onSuccess: () => {
			// Invalidate saves list to refetch
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
			// Also invalidate stats
			queryClient.invalidateQueries({ queryKey: ["stats"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}

/**
 * Hook to update a save
 */
export function useUpdateSave() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateSaveInput) =>
			client.mutate<UpdateSaveInput, Save>("space.updateSave", input),
		onSuccess: (data) => {
			// Update the specific save in cache
			queryClient.setQueryData(savesKeys.detail(data.id), data);
			// Invalidate lists
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
		},
	});
}

/**
 * Hook to toggle favorite status
 */
export function useToggleFavorite() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ saveId, value }: { saveId: string; value?: boolean }) =>
			client.mutate<{ saveId: string; value?: boolean }, Save>(
				"space.toggleFavorite",
				{
					saveId,
					value,
				},
			),
		onSuccess: (data) => {
			queryClient.setQueryData(savesKeys.detail(data.id), data);
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
		},
	});
}

/**
 * Hook to toggle archive status
 */
export function useToggleArchive() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ saveId, value }: { saveId: string; value?: boolean }) =>
			client.mutate<{ saveId: string; value?: boolean }, Save>(
				"space.toggleArchive",
				{
					saveId,
					value,
				},
			),
		onSuccess: (data) => {
			queryClient.setQueryData(savesKeys.detail(data.id), data);
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
		},
	});
}

/**
 * Hook to delete a save
 */
export function useDeleteSave() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (saveId: string) =>
			client.mutate<{ saveId: string }, { success: boolean }>(
				"space.deleteSave",
				{ saveId },
			),
		onSuccess: (_, saveId) => {
			// Remove from cache
			queryClient.removeQueries({ queryKey: savesKeys.detail(saveId) });
			// Invalidate lists
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard"] });
		},
	});
}
