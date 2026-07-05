// reusable text input
import { ChangeEvent } from 'react';

interface InputProps {
  title?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  error?: string;
  disabled?: false;
	className?: string;
}

export function InputText({ 
  title, 
  name = '',
  value = '', 
  onChange,
  required = false,
  placeholder = '', 
  type = 'text',
  error = '',
  disabled = false,
  className = ''
} : InputProps) {

  return (
    <div className="flex flex-col gap-y-1">
      {title && (
        <label className="input-label">
          {title}
          {required && <span className="text-xs text-accent-lime"> *</span>}
        </label>
      )}

      <input
        type={type}
        name={name}
        className={`input-base ${error ? 'input-error' : ''} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      />

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
