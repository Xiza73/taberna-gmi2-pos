import '@testing-library/jest-dom/vitest';

// Test env: el cliente HTTP exige `VITE_API_BASE_URL` al importar. En
// vitest no se carga .env automáticamente, así que lo seteamos via stub
// (vitest expone `vi.stubEnv` para mutar import.meta.env de forma type-safe).
import { vi } from 'vitest';
if (!import.meta.env.VITE_API_BASE_URL) {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000/api/v1');
}
