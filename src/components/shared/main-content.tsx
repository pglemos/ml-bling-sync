import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div className="ml-72 animate-fade-in page-enter" style={{animationDelay: '0.1s'}}>
      <div className="min-h-screen bg-surface">
        {children}
      </div>
    </div>
  );
}
