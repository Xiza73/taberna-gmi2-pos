import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary global. Atrapa crashes de render para no dejar al cajero
 * con pantalla blanca. Errores de eventos / promesas NO se capturan — esos
 * se manejan en cada feature (toast + retry).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
            <AlertCircle size={26} className="text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1
              className="text-lg"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              Algo salió mal
            </h1>
            <p className="text-sm text-muted-foreground">
              Ocurrió un error inesperado. Recargá la app para continuar.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground/70 mt-2 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
