"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ipo } from "@/lib/api.server";
import Link from "next/link";

interface TodayCardProps {
  ipoList: Ipo[];
}

export function TodayCard({ ipoList }: TodayCardProps) {
  // Find "Today's" highlight
  // Prioritize: Open for Subscription > Listing Today
  const today = new Date();
  
  const todayHighlight = ipoList?.find((item) => {
      if (!item.subStart || !item.subEnd) return false;
      const start = new Date(item.subStart);
      const end = new Date(item.subEnd);
      // Set end to end of day (23:59:59) to include the entire last day
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
  });

  if (!todayHighlight) {
    return (
      <Card className="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            오늘의 일정
          </CardTitle>
          <CardDescription className="text-zinc-500">
            오늘은 진행 중인 청약이 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-600">
            주간 일정을 확인하고 미리 준비해보세요!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate D-Day or status
  // For now simple display
  return (
    <Link href={`/ipo/${todayHighlight.id}`} className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Card className="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-card shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="mb-2 border border-orange-200 bg-orange-50 text-orange-600">
              청약 진행중
            </Badge>
          </div>
          <CardTitle className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">{todayHighlight.name}</CardTitle>
          <CardDescription className="text-sm font-medium text-zinc-500">
            확정공모가 {todayHighlight.offerPrice ? `${Number(todayHighlight.offerPrice).toLocaleString()}원` : '미정'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-0">
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-sm">
            <span className="text-zinc-500">기관경쟁률</span>
            <span className="font-semibold text-zinc-900">{todayHighlight.competition || '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">주간사</span>
            <span className="max-w-[220px] truncate text-right font-medium text-zinc-800">{todayHighlight.underwriter || '-'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
