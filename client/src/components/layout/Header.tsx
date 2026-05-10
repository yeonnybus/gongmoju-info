"use client";

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Home, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-200/70 bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <Link href="/" className="flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.02em] text-zinc-900">
        <Image src="/gi_logo.png" alt="공모주 알리미" width={24} height={24} className="rounded-md" />
        공모주 알리미
      </Link>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 active:scale-95">
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
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              <Home className="h-4 w-4" />
              홈
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
