import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextProps {
  text: string;
  className?: string;
  tooltipClassName?: string;
  maxWidth?: string;
  tooltipPosition?: 'top' | 'bottom';
}

export const TruncatedText = ({ 
  text, 
  className = '',
  tooltipClassName = '',
  maxWidth,
  tooltipPosition = 'bottom'
}: TruncatedTextProps) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };
    
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text]);

  const positionClasses = tooltipPosition === 'top' 
    ? 'bottom-full left-0 mb-2' 
    : 'top-full left-0 mt-2';

  return (
    <span 
      className={`relative group ${className}`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <span 
        ref={textRef} 
        className="truncate block"
      >
        {text}
      </span>
      {isTruncated && (
        <div className={`absolute ${positionClasses} px-3 py-1.5 bg-background-3 text-foreground text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg ${tooltipClassName}`}>
          {text}
        </div>
      )}
    </span>
  );
};