import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Modal — Dialog de Radix centrado en pantalla.
 *
 * Uso:
 *   <Modal open={isOpen} onOpenChange={set}>
 *     <ModalContent title="Mi título">
 *       ...
 *     </ModalContent>
 *   </Modal>
 */

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

interface ModalContentProps {
  /** Título obligatorio (se renderiza visualmente y a la vez es accessible). */
  title: string;
  description?: string;
  children: ReactNode;
  /** Tailwind max-width override (default `max-w-lg`). */
  maxWidth?: string;
  className?: string;
  /** Si es true, el botón de cerrar (X) se oculta. */
  hideCloseButton?: boolean;
}

export function ModalContent({
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
  hideCloseButton = false,
}: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        )}
      />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)]',
          maxWidth,
          'max-h-[calc(100vh-2rem)] overflow-y-auto',
          '-translate-x-1/2 -translate-y-1/2',
          'bg-card border border-border rounded-md shadow-2xl',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <Dialog.Title
              className="text-xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {description}
              </Dialog.Description>
            )}
          </div>
          {!hideCloseButton && (
            <Dialog.Close
              aria-label="Cerrar"
              className="p-1.5 -m-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </Dialog.Close>
          )}
        </div>
        <div className="px-5 py-4">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
