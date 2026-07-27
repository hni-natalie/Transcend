import React from 'react';
import { DefaultAvatar, IconPlus, IconCheck } from '@shared';

interface UserRowProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
  trailing?: React.ReactNode;
}



export function UserRow({ name, email, avatarUrl, subtitle, selected = false, onClick, trailing }: UserRowProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-1.5 rounded-xl transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${selected ? 'bg-background-2 border border-border' : 'hover:bg-background-2 border border-transparent'}`}
    >
      <div className="relative w-12 h-12 shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <DefaultAvatar name={name} email={email} className="w-full h-full rounded-full" />
        )}

        {!trailing && selected && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-accent-lime/80">
            <IconCheck />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-base truncate transition-colors ${selected ? 'text-accent-lime font-medium' : 'text-foreground'}`}>
          {name}
        </p>

        {subtitle && <p className="text-sm text-foreground-3 truncate">{subtitle}</p>}
      </div>

      {trailing}
    </div>
  );
}

export function RemoveButton({ onClick, label = 'Remove' }: { onClick: () => void; label?: string }) {
  return (
    <button
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 bg-background-3 text-foreground-3 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export function SelectToggle({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
        selected
          ? 'bg-accent-lime-bg text-accent-lime opacity-100'
          : 'bg-background-3 text-foreground-3 opacity-0 group-hover:opacity-100 hover:bg-accent-lime/20'
      }`}
    >
      {selected ? <IconCheck /> : <IconPlus className="w-4 h-4" />}
    </button>
  );
}