/**
 * Category — espejo del `CategoryResponseDto` del back.
 * Mantenelo alineado con `backend/docs/modules/categories.md`.
 *
 * `GET /categories` (público) devuelve un FLAT array de categorías activas;
 * las top-level se obtienen filtrando `parentId === null`.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
