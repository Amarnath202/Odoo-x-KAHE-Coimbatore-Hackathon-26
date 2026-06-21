import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    title: 'Confirm Action',
    onConfirm: null,
    confirmText: 'Confirm',
    confirmColor: 'danger'
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message: options.message || 'Are you sure?',
        title: options.title || 'Confirm Action',
        confirmText: options.confirmText || 'Confirm',
        confirmColor: options.confirmColor || 'danger',
        onConfirm: () => {
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          resolve(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  }, []);

  const { isOpen, message, title, onConfirm, onCancel, confirmText, confirmColor } = confirmState;
  const isDanger = confirmColor === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
        <div className="flex flex-col items-center text-center p-4">
          {isDanger && (
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          )}
          <p className="text-text-secondary">{message}</p>
          <div className="flex gap-3 w-full mt-6">
            <button onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className={`${isDanger ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : 'btn-primary'} btn flex-1`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
