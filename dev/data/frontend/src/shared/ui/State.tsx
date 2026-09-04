import React from 'react';

// types
export interface StateContainerProps {
  children: React.ReactNode;
  size?: 'full' | 'medium' | 'small' | 'none';
  className?: string;
}

export interface StateTextProps {
  children: React.ReactNode;
  variant?: 'loading' | 'empty' | 'error';
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  size?: 'full' | 'medium' | 'small' | 'none';
  className?: string;
  msgClassName?: string;
}

export interface EmptyStateProps {
  message?: string;
  size?: 'full' | 'medium' | 'small';
  className?: string;
}

export interface ErrorStateProps {
  error: string | null;
  onRetry?: () => void;
  size?: 'full' | 'medium' | 'small';
  className?: string;
}


// container
export const StateContainer = ({ 
  children, 
  size = 'full', 
  className = '' 
}: StateContainerProps) => {
  const sizes = {
    full: 'min-h-[400px]',
    medium: 'min-h-[200px]',
    small: 'min-h-[100px]',
    none: '',
  };

  return (
    <div className={`flex items-center justify-center ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
};


// text
export const StateText = ({ 
  children, 
  variant = 'empty', 
  className = '' 
}: StateTextProps) => {
  const variants = {
    loading: 'text-foreground-3 font-mono text-base animate-pulse',
    empty: 'text-foreground-3 font-mono text-sm',
    error: 'text-danger',
  };

  return <div className={`${variants[variant]} ${className}`}>{children}</div>;
};


// LOADING STATE
export const LoadingState = ({ 
  message = 'Loading...', 
  size = 'full',
  className = '',
  msgClassName = ''
}: LoadingStateProps) => {
  return (
    <StateContainer size={size} className={className}>
      <StateText variant="loading" className={msgClassName}>{message}</StateText>
    </StateContainer>
  );
};


// EMPTY STATE
export const EmptyState = ({ 
  message = 'No data available', 
  size = 'full',
  className = ''
}: EmptyStateProps) => {
  return (
    <StateContainer size={size} className={className}>
      <StateText variant="empty">{message}</StateText>
    </StateContainer>
  );
};


// ERROR STATE
export const ErrorState = ({ 
  error, 
  onRetry, 
  size = 'medium',
  className = ''
}: ErrorStateProps) => {
  return (
    <StateContainer size={size} className={className}>
      <div className="flex flex-col items-center gap-4">
        <StateText variant="error">{error || 'Something went wrong'}</StateText>
        {onRetry && (
          <button onClick={onRetry} className="btn-lime">
            Retry
          </button>
        )}
      </div>
    </StateContainer>
  );
};