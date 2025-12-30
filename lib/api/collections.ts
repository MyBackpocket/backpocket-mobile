/**
 * Collections API hooks
 * React Query hooks for collection-related operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAPIClient } from "./hooks";
import type {
	Collection,
	CreateCollectionInput,
	UpdateCollectionInput,
} from "./types";

// Query keys
export const collectionsKeys = {
	all: ["collections"] as const,
	lists: () => [...collectionsKeys.all, "list"] as const,
	list: () => [...collectionsKeys.lists()] as const,
	details: () => [...collectionsKeys.all, "detail"] as const,
	detail: (id: string) => [...collectionsKeys.details(), id] as const,
};

/**
 * Hook to fetch all collections
 */
export function useListCollections() {
	const client = useAPIClient();

	return useQuery({
		queryKey: collectionsKeys.list(),
		queryFn: () => client.query<void, Collection[]>("space.listCollections"),
	});
}

/**
 * Hook to create a new collection
 */
export function useCreateCollection() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateCollectionInput) =>
			client.mutate<CreateCollectionInput, Collection>(
				"space.createCollection",
				input,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
		},
	});
}

/**
 * Hook to update a collection
 */
export function useUpdateCollection() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateCollectionInput) =>
			client.mutate<UpdateCollectionInput, Collection>(
				"space.updateCollection",
				input,
			),
		onSuccess: (data) => {
			queryClient.setQueryData(collectionsKeys.detail(data.id), data);
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
		},
	});
}

/**
 * Hook to delete a collection
 */
export function useDeleteCollection() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (collectionId: string) =>
			client.mutate<{ collectionId: string }, { success: boolean }>(
				"space.deleteCollection",
				{
					collectionId,
				},
			),
		onSuccess: (_, collectionId) => {
			queryClient.removeQueries({
				queryKey: collectionsKeys.detail(collectionId),
			});
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
		},
	});
}
