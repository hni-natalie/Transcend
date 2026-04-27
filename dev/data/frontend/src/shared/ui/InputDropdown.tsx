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
    <div className="dropdown-group flex flex-col gap-y-1">
      {title && (
        <label className="text-white/60 font-medium dropdown-label">
          {title}
          {required && <span className="text-xs text-brand-lime"> *</span>}
        </label>
      )}
      <div className='border border-brand-gray-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-brand-lime text-sm bg-brand-gray-800 p-1 pr-2 rounded-lg' >
      <select
        name={name}
        className={`dropdown-field w-full
                   ${!value ? 'text-white/50' : 'text-white'} ${inputStyle} ${error ? 'input-error' : ''}`}
        style={{ outline : 'none' }}
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
