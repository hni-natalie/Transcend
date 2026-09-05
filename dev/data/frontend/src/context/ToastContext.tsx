import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ToastContextType {
  showToast: (type: 'success' | 'error', message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToasts(prev => {
      const alreadyExists = prev.some(t => t.type === type && t.message === message);
      if (alreadyExists) return prev;

      const id = Date.now();
      
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, 3000);

      return [...prev, { id, type, message }];
    });
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const styles = {
    success: 'bg-accent-lime-bg border border-accent-lime text-accent-lime',
    error: 'bg-background-2 border border-danger text-danger',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed top-6 right-8 z-9999 flex flex-col gap-2 items-end">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`rounded-xl p-4 flex items-center gap-3 shadow-xl min-w-[300px] max-w-[500px] animate-in fade-in slide-in-from-right-2 duration-200 ${styles[toast.type]}`}
            >
              {icons[toast.type]}
              <span className="flex-1 text-base">{toast.message}</span>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};