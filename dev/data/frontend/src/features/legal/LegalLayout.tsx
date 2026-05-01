import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
  lastUpdated?: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ 
  title, 
  children, 
  lastUpdated = "April 29, 2026" 
}) => {
  const navigate = useNavigate();

   return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 text-foreground-2 hover:text-accent-lime transition-colors flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-8 pb-4 border-b border-border">
          <h1 className="text-3xl md:text-4xl font-bold text-accent-lime font-mono mb-2">
            {title}
          </h1>
          <p className="text-foreground-2 text-sm">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
		<div className="text-foreground-3 space-y-8 leading-relaxed">
		  {children}
		</div>
      </div>
    </div>
  );
};