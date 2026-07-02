import React from 'react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  action?: ReactNode;  // action button (eg "Add User")
}

export const PageHeader = ({ icon, title, action }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between h-10 mb-8">
      <div className="flex items-center gap-3 font-mono h-full">
        <span className="w-6 h-6 text-accent-lime flex items-center justify-center shrink-0">
          {icon}
        </span>
        <h1 className="text-2xl text-foreground tracking-tight font-normal leading-none">
          {title}
        </h1>
      </div>
      {action && <div className="flex items-center h-full">{action}</div>}
    </div>
  );
};