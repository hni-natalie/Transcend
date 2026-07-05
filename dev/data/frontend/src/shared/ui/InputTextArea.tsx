// reusable text input
import { ChangeEvent } from 'react';

interface InputTextAreaProps {
	title?: string;
	placeholder?: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	required?: boolean;
	error?: string;
	disabled?: false;
	className?: string;
}

export function InputTextArea({ 
	title, 
	value = '', 
	onChange,
	required = false,
	placeholder = '', 
	error = '',
	disabled = false,
	className
} : InputTextAreaProps) {

	return (
		<div className="flex flex-col gap-y-1">
			{title && (
				<label className="input-label">
					{title}
					{required && <span className="text-xs text-accent-lime"> *</span>}
				</label>
			)}

			<textarea
				value={value}
				onChange={onChange}
				placeholder={placeholder}
        className={`input-base ${error ? 'input-error' : ''} ${className}`}
        required={required}
        disabled={disabled}
			/>

			{error && <span className="error-message">{error}</span>}
		</div>
	);
}
