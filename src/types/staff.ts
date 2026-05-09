/**
 * Staff entity como llega del back. Espejo del shape de
 * `backoffice-frontend/src/types/staff.ts` — el POS usa los mismos
 * endpoints `/staff/auth/*`. Mantenelo alineado con
 * `backend/docs/modules/staff.md`.
 *
 * El POS solo permite Admin y SuperAdmin (ver
 * `backend/docs/modules/pos.md` — `@RequireStaffRole(SUPER_ADMIN, ADMIN)`).
 * Si un user con rol `user` intenta loguear, los endpoints `/admin/pos/*`
 * van a devolver 403; el front debe mostrar mensaje "Sin permisos".
 */
export type StaffRole = 'super_admin' | 'admin' | 'user';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  invitedBy: string | null;
  createdAt: string;
}
