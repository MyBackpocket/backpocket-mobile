/**
 * API Types for Backpocket Mobile
 * Mirrors the types from the web app for type safety
 */

// === Enums ===

export type SpaceVisibility = "public" | "private";
export type SaveVisibility = "private" | "public";
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
	defaultTags?: Tag[];
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
	defaultTags?: string[];
}

export interface UpdateCollectionInput {
	id: string;
	name?: string;
	visibility?: CollectionVisibility;
	defaultTags?: string[];
}

export interface CreateTagInput {
	name: string;
}

export interface UpdateTagInput {
	id: string;
	name: string;
}

// === Domain Types ===

export type DomainStatus =
	| "pending_verification"
	| "verified"
	| "active"
	| "error"
	| "disabled";

export interface DomainMapping {
	id: string;
	domain: string;
	spaceId: string;
	status: DomainStatus;
	verificationToken: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DomainStatusResponse {
	id: string;
	domain: string;
	status: DomainStatus;
	verified: boolean;
	misconfigured: boolean;
	verification?: Array<{
		type: string;
		domain: string;
		value: string;
	}>;
	createdAt: string;
}

export type SlugUnavailableReason =
	| "reserved"
	| "taken"
	| "too_short"
	| "too_long"
	| "invalid_format";

export interface SlugAvailability {
	available: boolean;
	reason: SlugUnavailableReason | null;
}

// === Duplicate Detection Types ===

/**
 * Summary info about an existing save when a duplicate is detected
 */
export interface DuplicateSaveInfo {
	id: string;
	url: string;
	title: string | null;
	imageUrl: string | null;
	siteName: string | null;
	savedAt: string;
}

/**
 * Input for checking if a URL already exists
 */
export interface CheckDuplicateInput {
	url: string;
}

/**
 * Response from checkDuplicate endpoint
 * Returns null if no duplicate, or the existing save info if duplicate found
 */
export type CheckDuplicateResponse = DuplicateSaveInfo | null;

/**
 * Error cause structure for duplicate save errors
 */
export interface DuplicateSaveErrorCause {
	type: "DUPLICATE_SAVE";
	existingSave: DuplicateSaveInfo;
}

/**
 * Structure of the error data from a duplicate save API error
 */
export interface DuplicateSaveErrorData {
	code: "CONFLICT";
	httpStatus: 409;
	path: string;
	cause: DuplicateSaveErrorCause;
}

// === Snapshot Types ===

export interface GetSaveSnapshotInput {
	saveId: string;
	includeContent?: boolean;
}

export interface GetSaveSnapshotResponse {
	snapshot: SaveSnapshot | null;
	content: SnapshotContent | null;
}
