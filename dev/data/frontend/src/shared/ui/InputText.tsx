interface InputTextProps {
  title?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  error?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  min?: any;
  max?: any;
}

export function InputText({ 
  title, 
  name = '',
  value = '', 
  onChange,
  onBlur,
  onFocus,
  required = false,
  placeholder = '', 
  type = 'text',
  error = '',
  disabled = false,
  className = '',
  min = '',
  max = ''
}: InputTextProps) {
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
        min={min}
        max={max}
        onChange={onChange}
		    onBlur={onBlur}
        onFocus={onFocus} 
        required={required}
        disabled={disabled}
      />

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
