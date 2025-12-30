/**
 * Tags API hooks
 * React Query hooks for tag-related operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAPIClient } from "./hooks";
import type { CreateTagInput, Tag, UpdateTagInput } from "./types";

// Query keys
export const tagsKeys = {
	all: ["tags"] as const,
	lists: () => [...tagsKeys.all, "list"] as const,
	list: () => [...tagsKeys.lists()] as const,
	details: () => [...tagsKeys.all, "detail"] as const,
	detail: (id: string) => [...tagsKeys.details(), id] as const,
};

/**
 * Hook to fetch all tags
 */
export function useListTags() {
	const client = useAPIClient();

	return useQuery({
		queryKey: tagsKeys.list(),
		queryFn: () => client.query<void, Tag[]>("space.listTags"),
	});
}

/**
 * Hook to create a new tag
 */
export function useCreateTag() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateTagInput) =>
			client.mutate<CreateTagInput, Tag>("space.createTag", input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
		},
	});
}

/**
 * Hook to update a tag
 */
export function useUpdateTag() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateTagInput) =>
			client.mutate<UpdateTagInput, Tag>("space.updateTag", input),
		onSuccess: (data) => {
			queryClient.setQueryData(tagsKeys.detail(data.id), data);
			queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
		},
	});
}

/**
 * Hook to delete a tag
 */
export function useDeleteTag() {
	const client = useAPIClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tagId: string) =>
			client.mutate<{ tagId: string }, { success: boolean }>(
				"space.deleteTag",
				{ tagId },
			),
		onSuccess: (_, tagId) => {
			queryClient.removeQueries({ queryKey: tagsKeys.detail(tagId) });
			queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
			queryClient.invalidateQueries({ queryKey: ["stats"] });
		},
	});
}
