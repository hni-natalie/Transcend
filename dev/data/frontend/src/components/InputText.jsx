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

export default function InputText({ 
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
    <div className="input-group flex flex-col gap-y-1">
      {title && (
        <label className="text-white/60 font-medium input-label">
          {title}
          {required && <span className="text-xs text-brand-lime"> *</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        className={`input-field border border-brand-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-lime text-sm bg-brand-gray-800 p-1 px-2 rounded-lg ${inputStyle} ${error ? 'input-error' : ''}`}
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