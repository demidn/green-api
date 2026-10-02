import { ApiError } from "./api-error";

interface GreenApiRequestOptions extends RequestInit {
  apiUrl?: string;
}

export async function greenApiFetch<T>(
  path: string,
  { apiUrl, ...options }: GreenApiRequestOptions = {},
): Promise<T> {
  if (!apiUrl) {
    throw new ApiError(0, "API configuration is required");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}${path}`, options);
  } catch (error) {
    // Preserve cancellation so TanStack Query can cancel an obsolete request.
    if (options.signal?.aborted) {
      throw error;
    }
    // Native errors may contain a URL with the API token; expose only a safe message.
    throw new ApiError(0, "Network request failed");
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Not Found"
        : response.status === 500
          ? "Internal Server Error"
          : "Request failed";
    throw new ApiError(response.status, message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, "Invalid API response");
  }
}
