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
import { APIError } from "./client";
import { useAPIClient } from "./hooks";
import { spaceKeys } from "./space";
import type {
	CheckDuplicateInput,
	CheckDuplicateResponse,
	CreateSaveInput,
	DashboardData,
	DuplicateSaveErrorData,
	DuplicateSaveInfo,
	ListSavesInput,
	ListSavesResponse,
	Save,
	UpdateSaveInput,
} from "./types";
import {
	hasProcessingSaves,
	PROCESSING_POLL_INTERVAL_MS,
} from "./use-processing-saves";

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
 *
 * Automatically polls for updates when there are recently created saves
 * that are still being processed by the backend.
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
		// Auto-poll when there are processing saves
		refetchInterval: (query) => {
			const pages = query.state.data?.pages;
			if (!pages) return false;
			// Only check first page for processing saves (most recent)
			const firstPageSaves = pages[0]?.items ?? [];
			return hasProcessingSaves(firstPageSaves)
				? PROCESSING_POLL_INTERVAL_MS
				: false;
		},
	});
}

/**
 * Hook to fetch a single save by ID
 *
 * Automatically polls for updates when the save is still being processed
 * by the backend (no title yet).
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
		// Auto-poll when the save is still processing
		refetchInterval: (query) => {
			const save = query.state.data;
			if (!save) return false;
			// Import check inline to avoid circular deps
			const isProcessing =
				save.title === null &&
				Date.now() - new Date(save.createdAt).getTime() < 60000;
			return isProcessing ? PROCESSING_POLL_INTERVAL_MS : false;
		},
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
			// Also invalidate stats and dashboard
			queryClient.invalidateQueries({ queryKey: spaceKeys.stats() });
			queryClient.invalidateQueries({ queryKey: spaceKeys.dashboard() });
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
 * Uses optimistic updates for instant UI feedback
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
		onMutate: async ({ saveId, value }) => {
			// Cancel outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: savesKeys.lists() });
			await queryClient.cancelQueries({ queryKey: savesKeys.detail(saveId) });

			// Snapshot previous data for rollback
			const previousDetail = queryClient.getQueryData<Save>(
				savesKeys.detail(saveId),
			);
			const previousLists = queryClient.getQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() });

			// Optimistically update the detail cache
			if (previousDetail) {
				queryClient.setQueryData<Save>(savesKeys.detail(saveId), {
					...previousDetail,
					isFavorite: value ?? !previousDetail.isFavorite,
				});
			}

			// Optimistically update all list caches
			queryClient.setQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() }, (old) => {
				if (!old?.pages) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						items: page.items.map((save) =>
							save.id === saveId
								? { ...save, isFavorite: value ?? !save.isFavorite }
								: save,
						),
					})),
				};
			});

			return { previousDetail, previousLists };
		},
		onError: (_err, { saveId }, context) => {
			// Rollback to previous data on error
			if (context?.previousDetail) {
				queryClient.setQueryData(
					savesKeys.detail(saveId),
					context.previousDetail,
				);
			}
			if (context?.previousLists) {
				for (const [queryKey, data] of context.previousLists) {
					queryClient.setQueryData(queryKey, data);
				}
			}
		},
		onSuccess: (data) => {
			// Sync detail cache with server response (list is already optimistically updated)
			queryClient.setQueryData(savesKeys.detail(data.id), data);
		},
	});
}

/**
 * Hook to toggle archive status
 * Uses optimistic updates for instant UI feedback
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
		onMutate: async ({ saveId, value }) => {
			// Cancel outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: savesKeys.lists() });
			await queryClient.cancelQueries({ queryKey: savesKeys.detail(saveId) });
			await queryClient.cancelQueries({ queryKey: spaceKeys.dashboard() });

			// Snapshot previous data for rollback
			const previousDetail = queryClient.getQueryData<Save>(
				savesKeys.detail(saveId),
			);
			const previousLists = queryClient.getQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() });
			const previousDashboard = queryClient.getQueryData<DashboardData>(
				spaceKeys.dashboard(),
			);

			// Optimistically update the detail cache
			if (previousDetail) {
				queryClient.setQueryData<Save>(savesKeys.detail(saveId), {
					...previousDetail,
					isArchived: value ?? !previousDetail.isArchived,
				});
			}

			// Optimistically update all list caches
			queryClient.setQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() }, (old) => {
				if (!old?.pages) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						items: page.items.map((save) =>
							save.id === saveId
								? { ...save, isArchived: value ?? !save.isArchived }
								: save,
						),
					})),
				};
			});

			// Optimistically update dashboard - remove archived items from recent saves
			if (previousDashboard) {
				const isArchiving = value ?? !previousDetail?.isArchived;
				if (isArchiving) {
					// Remove from recent saves if archiving
					queryClient.setQueryData<DashboardData>(spaceKeys.dashboard(), {
						...previousDashboard,
						recentSaves: previousDashboard.recentSaves.filter(
							(save) => save.id !== saveId,
						),
						stats: {
							...previousDashboard.stats,
							archivedSaves: previousDashboard.stats.archivedSaves + 1,
						},
					});
				} else {
					// Update the item if unarchiving (it will appear on next refresh)
					queryClient.setQueryData<DashboardData>(spaceKeys.dashboard(), {
						...previousDashboard,
						recentSaves: previousDashboard.recentSaves.map((save) =>
							save.id === saveId ? { ...save, isArchived: false } : save,
						),
						stats: {
							...previousDashboard.stats,
							archivedSaves: Math.max(0, previousDashboard.stats.archivedSaves - 1),
						},
					});
				}
			}

			return { previousDetail, previousLists, previousDashboard };
		},
		onError: (_err, { saveId }, context) => {
			// Rollback to previous data on error
			if (context?.previousDetail) {
				queryClient.setQueryData(
					savesKeys.detail(saveId),
					context.previousDetail,
				);
			}
			if (context?.previousLists) {
				for (const [queryKey, data] of context.previousLists) {
					queryClient.setQueryData(queryKey, data);
				}
			}
			if (context?.previousDashboard) {
				queryClient.setQueryData(spaceKeys.dashboard(), context.previousDashboard);
			}
		},
		onSuccess: (data) => {
			// Sync detail cache with server response
			queryClient.setQueryData(savesKeys.detail(data.id), data);
			// Invalidate dashboard to get fresh data
			queryClient.invalidateQueries({ queryKey: spaceKeys.dashboard() });
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
		onMutate: async (saveId) => {
			// Cancel outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: savesKeys.lists() });
			await queryClient.cancelQueries({ queryKey: spaceKeys.dashboard() });

			// Snapshot previous list data for rollback
			const previousLists = queryClient.getQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() });

			// Snapshot previous dashboard data for rollback
			const previousDashboard = queryClient.getQueryData<DashboardData>(
				spaceKeys.dashboard(),
			);

			// Optimistically remove the save from all list caches
			queryClient.setQueriesData<{
				pages: ListSavesResponse[];
				pageParams: unknown[];
			}>({ queryKey: savesKeys.lists() }, (old) => {
				if (!old?.pages) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						items: page.items.filter((save) => save.id !== saveId),
					})),
				};
			});

			// Optimistically remove the save from the dashboard cache
			if (previousDashboard) {
				const deletedSave = previousDashboard.recentSaves.find(
					(s) => s.id === saveId,
				);
				queryClient.setQueryData<DashboardData>(spaceKeys.dashboard(), {
					...previousDashboard,
					recentSaves: previousDashboard.recentSaves.filter(
						(save) => save.id !== saveId,
					),
					stats: {
						...previousDashboard.stats,
						totalSaves: Math.max(0, previousDashboard.stats.totalSaves - 1),
						// Decrement relevant counters if the deleted save had those properties
						favoriteSaves: deletedSave?.isFavorite
							? Math.max(0, previousDashboard.stats.favoriteSaves - 1)
							: previousDashboard.stats.favoriteSaves,
						publicSaves:
							deletedSave?.visibility === "public"
								? Math.max(0, previousDashboard.stats.publicSaves - 1)
								: previousDashboard.stats.publicSaves,
						archivedSaves: deletedSave?.isArchived
							? Math.max(0, previousDashboard.stats.archivedSaves - 1)
							: previousDashboard.stats.archivedSaves,
					},
				});
			}

			return { previousLists, previousDashboard };
		},
		onError: (_err, _saveId, context) => {
			// Rollback to previous data on error
			if (context?.previousLists) {
				for (const [queryKey, data] of context.previousLists) {
					queryClient.setQueryData(queryKey, data);
				}
			}
			if (context?.previousDashboard) {
				queryClient.setQueryData(spaceKeys.dashboard(), context.previousDashboard);
			}
		},
		onSuccess: (_, saveId) => {
			// Remove detail cache
			queryClient.removeQueries({ queryKey: savesKeys.detail(saveId) });
			// Invalidate to refetch fresh data in background
			queryClient.invalidateQueries({ queryKey: savesKeys.lists() });
			queryClient.invalidateQueries({ queryKey: spaceKeys.stats() });
			queryClient.invalidateQueries({ queryKey: spaceKeys.dashboard() });
		},
	});
}

/**
 * Hook to check if a URL is already saved (duplicate detection)
 */
export function useCheckDuplicate() {
	const client = useAPIClient();

	return useMutation({
		mutationFn: (input: CheckDuplicateInput) =>
			client.mutate<CheckDuplicateInput, CheckDuplicateResponse>(
				"space.checkDuplicate",
				input,
			),
	});
}

/**
 * Check if an error is a duplicate save error
 * Returns the existing save info if it is, or null if it's not
 */
export function getDuplicateSaveFromError(
	error: unknown,
): DuplicateSaveInfo | null {
	if (!(error instanceof APIError)) {
		return null;
	}

	// The API returns:
	// - error.code = JSON-RPC error code (e.g., -32009)
	// - error.status = HTTP status (409)
	// - error.data = { code: "CONFLICT", httpStatus: 409, cause: { type: "DUPLICATE_SAVE", existingSave: {...} } }
	const data = error.data as DuplicateSaveErrorData | undefined;

	// Check for structured duplicate error data
	if (
		error.status === 409 ||
		data?.code === "CONFLICT" ||
		data?.httpStatus === 409
	) {
		if (data?.cause?.type === "DUPLICATE_SAVE" && data.cause.existingSave) {
			return data.cause.existingSave;
		}
	}

	return null;
}
