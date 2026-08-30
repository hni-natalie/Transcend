import { IconClose } from "@shared"
import React, { ComponentType } from 'react';

interface HeaderProps {
	icon?: ComponentType<{ className?: string }>;
  // icon?: React.ReactElement;
	iconClassName?: string;
	onClose: () => void;
	title: string;
	titleClassName?: string;
}

export const ModalHeader = ({
	icon: Icon,
	iconClassName,
	onClose,
	title,
	titleClassName = ''
} : HeaderProps) => {
	return (
		<div className="flex justify-between items-start">
			<div className="w-5" />
			<div className='flex flex-col gap-y-2 items-center justify-center text-center text-4xl'>
        {Icon && <Icon className={iconClassName} />}
				<h2 className={`text-2xl font-semibold text-accent-lime ${titleClassName}`}>{title}</h2>
			</div>

			<button 
				type="button" 
				onClick={onClose} 
				className="text-foreground-3 hover:text-white transition-colors cursor-pointer"
			>
				<IconClose className="w-8 h-8"/>
			</button>
		</div>
	)
}