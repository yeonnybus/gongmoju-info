"use client";

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Home, Menu, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
        <Image src="/gi_logo.png" alt="Logo" width={24} height={24} className="rounded-sm" />
        공모주 알리미
      </Link>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>메뉴</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              <Home className="h-4 w-4" />
              홈
            </Link>
            <Link 
              href="#" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors text-muted-foreground"
            >
              <Settings className="h-4 w-4" />
              설정 (준비중)
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
