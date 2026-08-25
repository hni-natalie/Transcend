import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { DropdownChoice } from '@shared/types/ui.types';
import { IconDown } from './Icons';

// export interface DropdownChoice {
//   id: string;
//   name: string;
// }

interface InputDropdownProps {
  title?: string;
  name?: string;
  choices: Array<DropdownChoice | string>;
  value: string;
  onChange: (e: any) => void; 
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showPlaceholder?: boolean;
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
	className = '',
  showPlaceholder = false
} : InputDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedChoices: DropdownChoice[] = choices.map(choice => {
    if (typeof choice === 'string') {
      return { id: choice, name: choice };
    }
    if (choice && typeof choice === 'object') {
      const raw = choice as any;
      return {
        id: String(raw.id ?? raw.value ?? raw.code ?? ''),
        name: String(raw.name ?? raw.label ?? raw.text ?? '')
      };
    }
    return { id: '', name: '' };
  });

  const selectedChoice = normalizedChoices.find(c => c.id === value);
  const displayLabel = selectedChoice ? selectedChoice.name : placeholder;

  const handleSelect = (id: string) => {
    if (disabled) return;
    
    onChange({
      target: {
        name,
        value: id
      }
    });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-y-1.5 w-full relative text-left" ref={containerRef}>
      {title && (
        <label className="input-label">
          {title}
          {required && <span className="text-xs text-accent-lime ml-1">*</span>}
        </label>
      )}

      <div className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full 
            border-background-2
 			      border-1
            rounded-lg
            px-4 py-2
            text-sm
            text-left
            flex justify-between items-center
            transition-all
            cursor-pointer
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${isOpen ? 'border-accent-lime ring-1 ring-accent-lime' : 'border-[#333333]'}
            ${!value ? 'text-foreground-3' : 'text-white'}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
        >
          <span className="truncate flex-1 text-left">
            {displayLabel}
          </span>
          
          <div className={`flex-shrink-0 ml-2 transform transition-transform duration-200 text-white/40 ${isOpen ? 'rotate-180' : ''}`}>
            <IconDown className='w-4 h-4'/>
          </div>
        </button>

        {/* Dropdown choices */}
        {isOpen && normalizedChoices.length > 0 && (
          <ul className="absolute left-0 right-0 mt-2 bg-background-1 border border-background-4 rounded-xl shadow-2xl overflow-y-auto max-h-32 z-50 py-1.5 custom-scrollbar">
            {normalizedChoices.map((choice, idx) => (
              <li
                key={`${choice.id}-${idx}`}
                onClick={() => handleSelect(choice.id)}
                className={`
                  px-4 py-2.5 
                  text-sm 
                  text-center 
                  cursor-pointer 
                  transition-colors
                  ${value === choice.id ? 'text-accent-lime bg-accent-lime/5 font-semibold' : 'text-white hover:bg-white/5'}
                `}
              >
                {choice.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {error && <span className="text-danger  text-xs mt-1">{error}</span>}
    </div>
  );
}
