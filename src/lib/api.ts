const BASE = "";

async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`;
    const err = new Error(msg) as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => fetchApi<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) =>
    fetchApi<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    fetchApi<T>(url, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => fetchApi<T>(url, { method: "DELETE" }),
};
