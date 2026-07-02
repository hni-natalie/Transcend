import React from 'react';
import { UserForm } from './components/userForm';

interface FormAddUserProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FormAddUser({ onClose, onSuccess }: FormAddUserProps) {
  return (
    <UserForm 
      mode="create"
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
