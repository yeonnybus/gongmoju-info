import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export function MobileWrapper({ children }: MobileWrapperProps) {
  return (
    <div className="flex min-h-screen justify-center bg-gray-100 dark:bg-black">
      <div className="w-full max-w-[480px] min-h-screen bg-background border-x border-border shadow-2xl overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
