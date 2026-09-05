import React from 'react';
import { Modal } from './Modal';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = 'This action cannot be undone. Are you sure?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmDeleteModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOutsideClick={!isLoading}>
      <div className="bg-background-1 rounded-3xl p-6 shadow-2xl w-[340px]">
        <h3 className="text-base text-foreground mb-1 font-semibold">{title}</h3>
        {description && (
          <div className="text-sm text-foreground-3 mb-6 leading-relaxed">
            {description}
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-base rounded-full text-foreground-3 hover:text-foreground hover:bg-background-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-base rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
