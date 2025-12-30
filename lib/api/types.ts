/**
 * API Types for Backpocket Mobile
 * Mirrors the types from the web app for type safety
 */

// === Enums ===

export type SpaceVisibility = "public" | "private";
export type SaveVisibility = "private" | "public" | "unlisted";
export type CollectionVisibility = "private" | "public";
export type PublicLayout = "list" | "grid";
export type SnapshotStatus =
	| "pending"
	| "processing"
	| "ready"
	| "blocked"
	| "failed";

// === Core Models ===

export interface Space {
	id: string;
	type: "personal" | "org";
	slug: string;
	name: string;
	bio: string | null;
	avatarUrl: string | null;
	visibility: SpaceVisibility;
	publicLayout: PublicLayout;
	defaultSaveVisibility: SaveVisibility;
	createdAt: string;
	updatedAt: string;
}

export interface Save {
	id: string;
	spaceId: string;
	url: string;
	title: string | null;
	description: string | null;
	siteName: string | null;
	imageUrl: string | null;
	contentType: string | null;
	visibility: SaveVisibility;
	isArchived: boolean;
	isFavorite: boolean;
	createdBy: string;
	savedAt: string;
	createdAt: string;
	updatedAt: string;
	tags?: Tag[];
	collections?: Collection[];
}

export interface Tag {
	id: string;
	spaceId: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	_count?: {
		saves: number;
	};
}

export interface Collection {
	id: string;
	spaceId: string;
	name: string;
	visibility: CollectionVisibility;
	createdAt: string;
	updatedAt: string;
	_count?: {
		saves: number;
	};
}

export interface SaveSnapshot {
	saveId: string;
	status: SnapshotStatus;
	title: string | null;
	byline: string | null;
	excerpt: string | null;
	wordCount: number | null;
	language: string | null;
}

export interface SnapshotContent {
	title: string;
	byline: string | null;
	content: string; // Sanitized HTML
	textContent: string; // Plain text
	excerpt: string;
	siteName: string | null;
	length: number;
	language: string | null;
}

// === API Input Types ===

export interface CreateSaveInput {
	url: string;
	title?: string;
	visibility?: SaveVisibility;
	collectionIds?: string[];
	tagNames?: string[];
	note?: string;
}

export interface UpdateSaveInput {
	id: string;
	title?: string;
	description?: string;
	visibility?: SaveVisibility;
	collectionIds?: string[];
	tagNames?: string[];
}

export interface ListSavesInput {
	query?: string;
	visibility?: SaveVisibility;
	isArchived?: boolean;
	isFavorite?: boolean;
	collectionId?: string;
	tagId?: string;
	cursor?: string;
	limit?: number;
}

export interface SpaceSettingsInput {
	name?: string;
	bio?: string;
	visibility?: SpaceVisibility;
	publicLayout?: PublicLayout;
	defaultSaveVisibility?: SaveVisibility;
}

// === API Response Types ===

export interface ListSavesResponse {
	items: Save[];
	nextCursor: string | null;
}

export interface StatsResponse {
	totalSaves: number;
	favoriteSaves: number;
	publicSaves: number;
	archivedSaves: number;
	totalTags: number;
	totalCollections: number;
}

export interface DashboardData {
	stats: StatsResponse;
	recentSaves: Save[];
	space: Space;
}

// === Collection/Tag Input Types ===

export interface CreateCollectionInput {
	name: string;
	visibility?: CollectionVisibility;
}

export interface UpdateCollectionInput {
	id: string;
	name?: string;
	visibility?: CollectionVisibility;
}

export interface CreateTagInput {
	name: string;
}

export interface UpdateTagInput {
	id: string;
	name: string;
}
