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
  inputStyle?: string;
}

export function InputText({ 
  title, 
  placeholder = '', 
  value = '', 
  onChange,
  onBlur,
  onFocus,
  required = false,
  type = 'text',
  error = '',
  disabled = false,
  name = '',
  inputStyle = ''
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
        className={`input-base ${error ? 'input-error' : ''} ${inputStyle}`}
        placeholder={placeholder}
        value={value}
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
