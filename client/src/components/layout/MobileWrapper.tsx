import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export function MobileWrapper({ children }: MobileWrapperProps) {
  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-zinc-100 to-zinc-50 px-0 sm:px-4 sm:py-6">
      <div className="relative min-h-screen w-full max-w-[500px] overflow-hidden border-x border-border bg-background shadow-xl sm:min-h-[calc(100vh-3rem)] sm:rounded-3xl sm:border">
        {children}
      </div>
    </div>
  );
}
