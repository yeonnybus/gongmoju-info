import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export function TodayCard() {
  // TODO: Fetch real data from API
  const todayIpo = null; // Mock: null means no event today

  if (!todayIpo) {
    return (
      <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-800 border-none text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            오늘의 일정 🌙
          </CardTitle>
          <CardDescription className="text-gray-400">
            오늘은 예정된 공모주 일정이 없습니다.
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

  return (
    <Card className="w-full bg-gradient-to-br from-indigo-900 to-slate-900 border-none text-white shadow-xl relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full -translate-y-10 translate-x-10 blur-3xl"></div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white border-none mb-2">
                청약 마감 D-Day
            </Badge>
            <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white h-6 w-6">
                <Bell size={16} />
            </Button>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">테크코퍼레이션</CardTitle>
        <CardDescription className="text-gray-300 font-medium">
            확정공모가 15,000원
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-3">
          <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
              <span className="text-gray-400">경쟁률</span>
              <span className="font-semibold text-accent-foreground text-yellow-400">1,240 : 1</span>
          </div>
          <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">주간사</span>
              <span>한국투자증권, KB증권</span>
          </div>
      </CardContent>
    </Card>
  );
}
