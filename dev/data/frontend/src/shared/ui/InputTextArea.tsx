// reusable text input
import { ChangeEvent, forwardRef } from 'react';

interface InputTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	title?: string;
	placeholder?: string;
	// value?: string;
	onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	required?: boolean;
	error?: string;
	disabled?: boolean;
	className?: string;
}

export const InputTextArea = forwardRef<HTMLTextAreaElement, InputTextAreaProps>(
	({
		title,
		// value = '', 
		onChange,
		required = false,
		placeholder = '', 
		error = '',
		disabled = false,
		className,
		...props // pass the rest (value, other props directly inherit from original textarea elem)
	} : InputTextAreaProps
	, ref) => {

	return (
		<div className="flex flex-col gap-y-1 flex-1">
			{title && (
				<label className="input-label">
					{title}
					{required && <span className="text-xs text-accent-lime"> *</span>}
				</label>
			)}

			<textarea
				ref={ref}
				// value={value}
				onChange={onChange}
				placeholder={placeholder}
        className={`input-base ${error ? 'input-error' : ''} ${className}`}
        required={required}
        disabled={disabled}
				{...props}
			/>

			{error && <span className="error-message">{error}</span>}
		</div>
	);
})
