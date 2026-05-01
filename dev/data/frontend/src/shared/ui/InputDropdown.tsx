import { ChangeEvent } from 'react';

interface InputDropdownProps {
  title: string;
  name: string;
  choices: Array<string>;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  inputStyle?: string;
}

export function InputDropdown({ 
  title, 
  name = '',
  choices = [], 
  value = '', 
  onChange,
  required = false,
  placeholder = 'Select an option',
  error = '',
  disabled = false,
	inputStyle = ''
} : InputDropdownProps) {

  return (
    <div className="flex flex-col gap-y-1">
      {title && (
        <label className="input-label">
          {title}
          {required && <span className="text-xs text-accent-lime"> *</span>}
        </label>
      )}
      <div className={`input-base p-0 pr-2 ${error ? 'input-error' : ''}`}>
        <select
        name={name}
        className={`select-base ${!value ? 'text-white/50' : 'text-white'} ${inputStyle}`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {choices.map((choice, index) => (
          <option key={index} value={choice}>
            {choice}
          </option>
        ))}
      </select>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
