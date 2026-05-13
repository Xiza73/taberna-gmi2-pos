/**
 * Tipos de Caja Registradora — espejo de `backend/docs/modules/pos.md`
 * (sección "Caja", DTOs OpenCashRegisterDto / CloseCashRegisterDto /
 * CreateCashMovementDto y entidades CashRegister / CashMovement).
 * Mantenelo alineado con el back.
 */

export type CashRegisterStatus = 'open' | 'closed';

export type CashMovementType = 'cash_in' | 'cash_out';

export interface OpenCashRegisterInput {
  /** Centavos PEN. */
  initialAmount: number;
}

export interface CloseCashRegisterInput {
  /** Centavos PEN — monto físicamente contado por el cajero. */
  closingAmount: number;
  notes?: string;
}

export interface CreateCashMovementInput {
  type: CashMovementType;
  /** Centavos PEN, siempre positivo. */
  amount: number;
  reason: string;
}

export interface CashMovementResponse {
  id: string;
  cashRegisterId: string;
  staffId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface CashRegisterResponse {
  id: string;
  staffId: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashRegisterStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Desglose del flujo de efectivo en la ventana abierta..cerrada (o
   * abierta..now si la caja sigue abierta). Computado por el back y
   * permite auditar `expectedAmount = initial + cashSales + cashIn − cashOut`.
   * Defaults a 0 cuando no hay actividad o la caja recién se abrió.
   */
  cashSalesAmount: number;
  cashInAmount: number;
  cashOutAmount: number;
  /** Solo presente cuando se carga vía GET /:id (incluye movimientos). */
  movements?: CashMovementResponse[];
}
