// reusable text input

// interface InputProps = {
//   title: String;
//   placeholder: String;
//   value: String;
//   onChange: String;
//   required: Boolean;
//   type: String,
//   error,
//   disabled = false,
//   name = '',
// 	inputStyle = ''
// }

export function InputText({ 
  title, 
  placeholder = '', 
  value = '', 
  onChange,
  required = false,
  type = 'text',
  error = '',
  disabled = false,
  name = '',
  inputStyle = ''
}) {
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
        required={required}
        disabled={disabled}
      />

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
