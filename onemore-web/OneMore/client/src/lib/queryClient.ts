import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  status: number;
  errors?: Array<{ path: string[]; message: string }>;
  
  constructor(status: number, message: string, errors?: Array<{ path: string[]; message: string }>) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiError";
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      const text = await res.text();
      errorData = text ? JSON.parse(text) : { message: res.statusText };
    } catch {
      errorData = { message: res.statusText };
    }

    // Extract Zod validation errors if present
    const errors = errorData.errors || undefined;
    const message = errorData.message || `Request failed with status ${res.status}`;
    
    throw new ApiError(res.status, message, errors);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
