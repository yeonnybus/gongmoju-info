import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="font-bold text-lg tracking-tight">
        공모주 알리미
      </Link>

      <Sheet>
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
          <div className="grid gap-4 py-4">
            <Link href="/" className="text-sm font-medium hover:underline">
              홈
            </Link>
            <Link href="/schedule" className="text-sm font-medium hover:underline">
              일정 목록
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              설정
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
