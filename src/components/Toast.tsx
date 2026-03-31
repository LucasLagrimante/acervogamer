import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: number;
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="toast toast-warning">
      <AlertTriangle size={18} className="toast-icon" />
      <span className="toast-text">{toast.text}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}
