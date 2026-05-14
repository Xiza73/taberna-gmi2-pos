import { CloudOff } from 'lucide-react';

interface Props {
  /** Mensaje principal mostrado al usuario. */
  message: string;
  /** Texto secundario opcional (ej. instrucción). */
  hint?: string;
}

/**
 * Estado vacío para pantallas o secciones que requieren conexión a
 * internet. Centrado, ícono + mensaje + hint opcional.
 */
export function OfflineNotice({ message, hint }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
        <CloudOff size={22} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>
        {message}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{hint}</p>
      )}
    </div>
  );
}
