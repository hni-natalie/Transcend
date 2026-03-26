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

export default function InputDropdown({ 
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
    <div className="dropdown-group flex flex-col gap-y-1">
      {title && (
        <label className="text-white/60 font-medium dropdown-label">
          {title}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <select
        name={name}
        className={`dropdown-field appearance-none border border-brand-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-lime text-sm bg-brand-gray-800 p-1 px-2 rounded-lg ${inputStyle} ${error ? 'input-error' : ''}`}
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
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}