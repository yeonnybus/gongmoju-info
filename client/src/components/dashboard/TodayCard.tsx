"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ipo } from "@/lib/api.server";
import { Bell } from "lucide-react";

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
      <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-none text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            오늘의 일정 🌙
          </CardTitle>
          <CardDescription className="text-gray-400">
            오늘은 진행 중인 청약이 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-300">
            주간 일정을 확인하고 미리 준비해보세요!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate D-Day or status
  // For now simple display
  return (
    <Card className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 border-none text-white shadow-xl relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full -translate-y-10 translate-x-10 blur-3xl"></div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white border-none mb-2">
                청약 진행중
            </Badge>
            <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white h-6 w-6">
                <Bell size={16} />
            </Button>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{todayHighlight.name}</CardTitle>
        <CardDescription className="text-gray-300 font-medium">
            확정공모가 {todayHighlight.offerPrice ? `${Number(todayHighlight.offerPrice).toLocaleString()}원` : '미정'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-3">
          <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
              <span className="text-gray-400">경쟁률</span>
              <span className="font-semibold text-accent-foreground text-yellow-400">{todayHighlight.competition || '-'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">주간사</span>
              <span className="truncate max-w-[200px] text-right">{todayHighlight.underwriter}</span>
          </div>
      </CardContent>
    </Card>
  );
}
