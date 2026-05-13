import {
  createRootRouteWithContext,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { RootLayout } from '@/layouts/RootLayout';
import { PosLayout } from '@/layouts/PosLayout';
import { PublicAuthLayout } from '@/layouts/PublicAuthLayout';
import { NewSalePage } from '@/pages/NewSalePage';
import { SalesPage } from '@/pages/SalesPage';
import { LoginPage } from '@/pages/LoginPage';
import { authKeys } from '@/features/auth';
import { staffAuthApi } from '@/api/staffAuthApi';

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// --- Authed group: POS layout (header + Outlet) ---
//
// `beforeLoad` hace `ensureQueryData(/me)`. Si falla → redirige a /login.
// Si el rol resulta ser `user` (sin permisos para POS), igual entra y la
// NewSalePage muestra el estado "sin permisos" (los endpoints van a devolver
// 403 de cualquier modo).
const posLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'posLayout',
  component: PosLayout,
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: authKeys.me,
        queryFn: staffAuthApi.me,
        staleTime: 30_000,
      });
    } catch {
      throw redirect({ to: '/login' });
    }
  },
});

const newSaleRoute = createRoute({
  getParentRoute: () => posLayoutRoute,
  path: '/',
  component: NewSalePage,
});

const salesRoute = createRoute({
  getParentRoute: () => posLayoutRoute,
  path: '/sales',
  component: SalesPage,
});

// --- Public auth (login) — redirect to / if already authed ---
const publicAuthLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'publicAuth',
  component: PublicAuthLayout,
  beforeLoad: ({ context }) => {
    const cached = context.queryClient.getQueryData(authKeys.me);
    if (cached) throw redirect({ to: '/' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => publicAuthLayoutRoute,
  path: '/login',
  component: LoginPage,
});

export const routeTree = rootRoute.addChildren([
  posLayoutRoute.addChildren([newSaleRoute, salesRoute]),
  publicAuthLayoutRoute.addChildren([loginRoute]),
]);
