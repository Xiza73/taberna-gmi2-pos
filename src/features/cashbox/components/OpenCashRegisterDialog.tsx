import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOpenCashRegister } from '../hooks/useOpenCashRegister';
import { computeAmountHint, parseCurrencyInput } from '../lib/formatters';

const OFFLINE_TOOLTIP = 'Requiere conexión a internet';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal para abrir caja registradora. Pide monto inicial en efectivo
 * (centavos PEN). Acepta separador decimal con punto o coma. El submit
 * dispara `POST /admin/pos/cash-register/open` y, si todo va bien, el
 * dialog se cierra automáticamente.
 */
export function OpenCashRegisterDialog({ open, onOpenChange }: Props) {
  const openMutation = useOpenCashRegister();
  const isOnline = useOnlineStatus();
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAmountInput('');
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (openMutation.isPending) return;
    onOpenChange(next);
    if (!next) {
      // pequeño delay para que la animación de cerrado no flashee el reset
      setTimeout(reset, 200);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = amountInput.trim();
    if (!trimmed) {
      setError('Ingresá el monto inicial.');
      return;
    }

    const cents = parseCurrencyInput(trimmed);
    if (Number.isNaN(cents)) {
      setError('Monto inválido. Usá números (ej: 150.00).');
      return;
    }

    try {
      await openMutation.mutateAsync({ initialAmount: cents });
      reset();
      onOpenChange(false);
    } catch {
      // El toast de error lo maneja el hook; reseteamos solo el flag local
      // para permitir reintento.
    }
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        title="Abrir caja"
        description="Iniciá tu turno con el monto en efectivo que tenés en caja."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Monto inicial en caja (en soles)"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            disabled={openMutation.isPending}
            hint={computeAmountHint(
              amountInput,
              'Cantidad en efectivo que tenés en caja al empezar el turno',
            )}
            autoFocus
            required
          />

          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleOpenChange(false)}
              disabled={openMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="md"
              loading={openMutation.isPending}
              disabled={openMutation.isPending || !isOnline}
              title={isOnline ? undefined : OFFLINE_TOOLTIP}
            >
              {openMutation.isPending ? 'Abriendo…' : 'Abrir caja'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
