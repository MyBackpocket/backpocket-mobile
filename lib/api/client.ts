/**
 * tRPC API Client for Backpocket Mobile
 *
 * This client makes authenticated requests to the existing Next.js tRPC API.
 * It uses Clerk's getToken() to get a JWT and sends it via Authorization header.
 */

import { API_URL } from "@/lib/constants";

/**
 * tRPC response format
 */
interface TRPCResponse<T = unknown> {
	result?: {
		data: T;
	};
	error?: {
		message: string;
		code: string;
		data?: unknown;
	};
}

/**
 * API error class with structured error info
 */
export class APIError extends Error {
	code: string;
	status: number;
	data?: unknown;

	constructor(message: string, code: string, status: number, data?: unknown) {
		super(message);
		this.name = "APIError";
		this.code = code;
		this.status = status;
		this.data = data;
	}
}

// Debug flag - set to true to see API logs
const DEBUG_API = __DEV__;

function debugLog(...args: unknown[]) {
	if (DEBUG_API) {
		console.log("[API]", ...args);
	}
}

/**
 * Create the API client with authentication
 */
export function createAPIClient(getToken: () => Promise<string | null>) {
	/**
	 * Make an authenticated tRPC query (GET request)
	 */
	async function trpcQuery<TInput, TOutput>(
		procedure: string,
		input?: TInput,
	): Promise<TOutput> {
		const token = await getToken();

		// For GET requests, encode input as query parameter
		const inputParam =
			input !== undefined
				? `?input=${encodeURIComponent(JSON.stringify(input))}`
				: "";
		const url = `${API_URL}/api/trpc/${procedure}${inputParam}`;

		debugLog(`→ GET ${procedure}`, {
			hasToken: !!token,
			tokenPreview: token ? `${token.substring(0, 20)}...` : null,
			input,
		});

		const headers: HeadersInit = {};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, {
				method: "GET",
				headers,
			});

			const data: TRPCResponse<TOutput> = await response.json();

			debugLog(`← GET ${procedure}`, {
				status: response.status,
				ok: response.ok,
				hasResult: !!data.result,
				hasError: !!data.error,
				error: data.error,
			});

			if (!response.ok || data.error) {
				const error = new APIError(
					data.error?.message ||
						`Request failed with status ${response.status}`,
					data.error?.code || "UNKNOWN_ERROR",
					response.status,
					data.error?.data,
				);
				debugLog(`✗ GET ${procedure} ERROR:`, error.message, error.code);
				throw error;
			}

			if (!data.result) {
				const error = new APIError(
					"Invalid response format",
					"INVALID_RESPONSE",
					response.status,
				);
				debugLog(`✗ GET ${procedure} ERROR:`, error.message);
				throw error;
			}

			debugLog(`✓ GET ${procedure} success`);
			return data.result.data;
		} catch (error) {
			if (error instanceof APIError) {
				throw error;
			}

			const apiError = new APIError(
				error instanceof Error ? error.message : "Network request failed",
				"NETWORK_ERROR",
				0,
			);
			debugLog(`✗ GET ${procedure} NETWORK ERROR:`, apiError.message);
			throw apiError;
		}
	}

	/**
	 * Make an authenticated tRPC mutation (POST request)
	 */
	async function trpcMutate<TInput, TOutput>(
		procedure: string,
		input: TInput,
	): Promise<TOutput> {
		const token = await getToken();

		const url = `${API_URL}/api/trpc/${procedure}`;

		debugLog(`→ POST ${procedure}`, {
			hasToken: !!token,
			tokenPreview: token ? `${token.substring(0, 20)}...` : null,
			input,
		});

		const headers: HeadersInit = {
			"Content-Type": "application/json",
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		const bodyString = JSON.stringify(input);

		// Extra debugging for mutations
		if (DEBUG_API) {
			console.log(`[API] ${procedure} mutation body:`, bodyString);
		}

		try {
			const response = await fetch(url, {
				method: "POST",
				headers,
				body: bodyString,
			});

			const data: TRPCResponse<TOutput> = await response.json();

			debugLog(`← POST ${procedure}`, {
				status: response.status,
				ok: response.ok,
				hasResult: !!data.result,
				hasError: !!data.error,
				error: data.error,
			});

			if (!response.ok || data.error) {
				const error = new APIError(
					data.error?.message ||
						`Request failed with status ${response.status}`,
					data.error?.code || "UNKNOWN_ERROR",
					response.status,
					data.error?.data,
				);
				debugLog(`✗ POST ${procedure} ERROR:`, error.message, error.code);
				throw error;
			}

			if (!data.result) {
				const error = new APIError(
					"Invalid response format",
					"INVALID_RESPONSE",
					response.status,
				);
				debugLog(`✗ POST ${procedure} ERROR:`, error.message);
				throw error;
			}

			debugLog(`✓ POST ${procedure} success`);
			return data.result.data;
		} catch (error) {
			if (error instanceof APIError) {
				throw error;
			}

			const apiError = new APIError(
				error instanceof Error ? error.message : "Network request failed",
				"NETWORK_ERROR",
				0,
			);
			debugLog(`✗ POST ${procedure} NETWORK ERROR:`, apiError.message);
			throw apiError;
		}
	}

	return {
		// Query = GET request (for reading data)
		query: <TInput, TOutput>(procedure: string, input?: TInput) =>
			trpcQuery<TInput, TOutput>(procedure, input),

		// Mutate = POST request (for creating/updating/deleting)
		mutate: <TInput, TOutput>(procedure: string, input: TInput) =>
			trpcMutate<TInput, TOutput>(procedure, input),
	};
}

/**
 * Type for the API client
 */
export type APIClient = ReturnType<typeof createAPIClient>;
