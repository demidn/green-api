import { ApiError } from "./api-error";

interface GreenApiRequestOptions extends RequestInit {
  apiUrl?: string;
}

export async function greenApiFetch<T>(
  path: string,
  { apiUrl, ...options }: GreenApiRequestOptions = {},
): Promise<T> {
  if (!apiUrl) {
    throw new ApiError(0, "Требуется конфигурация API");
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
    throw new ApiError(0, "Не удалось выполнить сетевой запрос");
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? "Не найдено"
        : response.status === 500
          ? "Внутренняя ошибка сервера"
          : "Не удалось выполнить запрос";
    throw new ApiError(response.status, message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, "Некорректный ответ API");
  }
}
