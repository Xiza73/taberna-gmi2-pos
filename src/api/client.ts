/**
 * HTTP client. Adapta el del backoffice/ecommerce con `refreshPath`
 * apuntando a `/staff/auth/refresh` (POS es staff-facing).
 *
 * Si tocás algo acá, ver `docs/SHARED-FILES.md` en la raíz del workspace
 * y replicar al backoffice/ecommerce cuando tenga sentido.
 */

import type { BaseResponse } from '@/types/api';
import type { AuthTokens } from '@/types/auth';
import { ApiError, statusToCode } from './errors';
import {
  clearTokens,
  emitAuthExpired,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokens';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined. Copy .env.example to .env.');
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  query?: Record<string, QueryValue> | object;
  body?: unknown;
  skipAuth?: boolean;
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

interface ApiClientConfig {
  refreshPath: string;
}

export interface ApiClient {
  get: <T>(path: string, opts?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) => Promise<T>;
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) => Promise<T>;
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) => Promise<T>;
  delete: <T>(path: string, opts?: RequestOptions) => Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  let refreshPromise: Promise<string> | null = null;

  async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  async function performRefresh(): Promise<string> {
    const refresh = getRefreshToken();
    if (!refresh) throw new ApiError(401, 'UNAUTHORIZED', 'No refresh token');

    const res = await fetch(`${buildBase()}${config.refreshPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
      credentials: 'omit',
    });

    const body = (await res.json().catch(() => null)) as BaseResponse<AuthTokens> | null;
    if (!res.ok || !body || !body.success) {
      const msg = body && !body.success ? body.message : 'Refresh failed';
      throw new ApiError(401, 'UNAUTHORIZED', msg);
    }

    setTokens(body.data);
    return body.data.accessToken;
  }

  async function attempt(
    method: string,
    url: string,
    opts: RequestOptions,
    token: string | null,
  ): Promise<Response> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let body: BodyInit | undefined;
    if (opts.body !== undefined) {
      if (opts.body instanceof FormData) {
        body = opts.body;
      } else {
        body = JSON.stringify(opts.body);
        headers['Content-Type'] = 'application/json';
      }
    }

    return fetch(url, {
      method,
      headers,
      body,
      signal: opts.signal,
      credentials: 'omit',
    });
  }

  async function request<T>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const url = buildUrl(path, opts.query);
    const initialToken = opts.skipAuth ? null : getAccessToken();

    let res: Response;
    try {
      res = await attempt(method, url, opts, initialToken);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new ApiError(0, 'NETWORK_ERROR', (e as Error).message || 'Network error');
    }

    const shouldRefresh =
      res.status === 401 &&
      !opts.skipAuth &&
      !opts.skipRefresh &&
      Boolean(getRefreshToken());

    if (shouldRefresh) {
      try {
        const newToken = await refreshAccessToken();
        res = await attempt(method, url, opts, newToken);
      } catch {
        clearTokens();
        emitAuthExpired();
        throw new ApiError(401, 'UNAUTHORIZED', 'Session expired');
      }
    }

    return parseResponse<T>(res);
  }

  return {
    get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
    post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
      request<T>('POST', path, { ...opts, body }),
    patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
      request<T>('PATCH', path, { ...opts, body }),
    put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) =>
      request<T>('PUT', path, { ...opts, body }),
    delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  let body: BaseResponse<T> | null = null;
  try {
    body = (await res.json()) as BaseResponse<T>;
  } catch {
    throw new ApiError(res.status, statusToCode(res.status), `HTTP ${res.status}`);
  }

  if (!body || typeof body !== 'object' || !('success' in body)) {
    throw new ApiError(res.status, statusToCode(res.status), 'Invalid response shape');
  }

  if (!body.success) {
    throw new ApiError(res.status, statusToCode(res.status), body.message);
  }

  return body.data;
}

function buildBase(): string {
  return BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const url = `${buildBase()}${suffix}`;

  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value as QueryValue));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Cliente HTTP del POS — apunta al endpoint de refresh staff.
 */
export const apiClient = createApiClient({ refreshPath: '/staff/auth/refresh' });
