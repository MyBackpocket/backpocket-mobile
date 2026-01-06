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
 * Hook to fetch a single collection by ID
 * Uses the list endpoint and filters client-side (API doesn't have a dedicated getCollection endpoint)
 */
export function useGetCollection(collectionId: string) {
	const client = useAPIClient();

	return useQuery({
		queryKey: collectionsKeys.detail(collectionId),
		queryFn: async () => {
			const collections = await client.query<void, Collection[]>(
				"space.listCollections",
			);
			return collections.find((c) => c.id === collectionId) ?? null;
		},
		enabled: !!collectionId,
	});
}

/**
 * Hook to create a new collection with optimistic updates
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
		onMutate: async (newCollection) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: collectionsKeys.lists() });

			// Snapshot previous value
			const previousCollections = queryClient.getQueryData<Collection[]>(
				collectionsKeys.list(),
			);

			// Optimistically add the new collection
			const optimisticCollection: Collection = {
				id: `temp-${Date.now()}`,
				spaceId: "",
				name: newCollection.name,
				visibility: newCollection.visibility ?? "private",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				_count: { saves: 0 },
			};

			queryClient.setQueryData<Collection[]>(collectionsKeys.list(), (old) =>
				old ? [optimisticCollection, ...old] : [optimisticCollection],
			);

			return { previousCollections };
		},
		onError: (_err, _newCollection, context) => {
			// Rollback on error
			if (context?.previousCollections) {
				queryClient.setQueryData(
					collectionsKeys.list(),
					context.previousCollections,
				);
			}
		},
		onSettled: () => {
			// Always refetch after error or success
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
 * Hook to delete a collection with optimistic updates
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
		onMutate: async (collectionId) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: collectionsKeys.lists() });

			// Snapshot previous value
			const previousCollections = queryClient.getQueryData<Collection[]>(
				collectionsKeys.list(),
			);

			// Optimistically remove the collection
			queryClient.setQueryData<Collection[]>(collectionsKeys.list(), (old) =>
				old ? old.filter((c) => c.id !== collectionId) : [],
			);

			return { previousCollections };
		},
		onError: (_err, _collectionId, context) => {
			// Rollback on error
			if (context?.previousCollections) {
				queryClient.setQueryData(
					collectionsKeys.list(),
					context.previousCollections,
				);
			}
		},
		onSettled: (_, __, collectionId) => {
			queryClient.removeQueries({
				queryKey: collectionsKeys.detail(collectionId),
			});
			queryClient.invalidateQueries({ queryKey: collectionsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
		},
	});
}
