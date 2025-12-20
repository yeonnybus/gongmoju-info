"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getIpoList } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function WeeklyList() {
    const { data: ipoList, isLoading } = useQuery({
        queryKey: ['ipoList'],
        queryFn: getIpoList,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        )
    }

    if (!ipoList || ipoList.length === 0) {
        return <div className="text-center py-10 text-gray-500">예정된 일정이 없습니다.</div>;
    }

    // Filter or slice if needed (e.g., show only next 7 days)
    // For now, showing all fetched items.
    
    return (
        <div className="space-y-1">
            {ipoList.map((item: any, index: number) => {
                 // Simple status logic (Update this based on real dates)
                 const today = new Date();
                 const startDate = item.subStart ? new Date(item.subStart) : null;
                 const endDate = item.subEnd ? new Date(item.subEnd) : null;
                 
                 let status = 'UPCOMING';
                 if (startDate && endDate) {
                     if (today >= startDate && today <= endDate) status = 'OPEN';
                     else if (today > endDate) status = 'CLOSED';
                 }

                 // Format Date (e.g., 2024-10-24T... -> 10.24)
                 let month = '-';
                 let day = '-';
                 if (startDate) {
                     const dateStr = startDate.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.');
                     const parts = dateStr.slice(0, 5).split('.');
                     if (parts.length >= 2) {
                        month = parts[0];
                        day = parts[1];
                     }
                 }

                 return (
                <div key={item.id || index}>
                    <div className="flex items-center py-4 px-1 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer">
                        {/* Date Badge */}
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-secondary rounded-xl mr-4 shrink-0">
                            <span className="text-xs font-bold text-gray-500">{month}월</span>
                            <span className="text-sm font-extrabold">{day}</span>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                            <h4 className="font-semibold text-base">{item.name}</h4>
                            <span className="text-xs text-muted-foreground">코스닥 | {item.offerPrice ? `${Number(item.offerPrice).toLocaleString()}원` : '미정'}</span>
                        </div>

                        {/* Status */}
                        <div>
                           {status === 'OPEN' ? (
                               <Badge variant="default" className="bg-green-600 hover:bg-green-700">청약중</Badge>
                           ) : status === 'CLOSED' ? (
                               <Badge variant="secondary" className="text-gray-400">마감</Badge>
                           ) : (
                               <Badge variant="outline" className="text-gray-500">예정</Badge>
                           )}
                        </div>
                    </div>
                    {index < ipoList.length - 1 && <Separator className="my-1" />}
                </div>
            )})}
        </div>
    );
}
