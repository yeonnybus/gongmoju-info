"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getIpoDetail } from '@/lib/api';
import { calculateIpoScore } from '@/lib/ipo-calculator';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, Calendar, ChevronLeft, TrendingUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function IpoDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: ipo, isLoading, isError } = useQuery({
        queryKey: ['ipo', id],
        queryFn: () => getIpoDetail(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="container max-w-md mx-auto p-4 space-y-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (isError || !ipo) {
        return (
            <div className="container max-w-md mx-auto p-4 flex flex-col items-center justify-center h-[50vh]">
                <p className="text-muted-foreground mb-4">데이터를 불러올 수 없습니다.</p>
                <Button onClick={() => router.back()}>뒤로가기</Button>
            </div>
        );
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '미정';
        return new Date(dateStr).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.');
    };

    // Status Determination
    const today = new Date();
    const startDate = ipo.subStart ? new Date(ipo.subStart) : null;
    // Set endDate to end of day (23:59:59) to include the entire last day
    const endDate = ipo.subEnd ? new Date(ipo.subEnd) : null;
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }
    
    let status = '예정';
    let statusColor = "bg-gray-500";

    if (startDate && endDate) {
        if (today >= startDate && today <= endDate) {
            status = '청약중';
            statusColor = "bg-orange-500";
        } else if (today > endDate) {
            status = '마감';
            statusColor = "bg-slate-500";
        }
    }

    return (
        <div className="container max-w-md mx-auto p-4 pb-20 fade-in select-none">
            {/* Header */}
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold ml-2">상세 정보</h1>
            </div>

            {/* Title Section */}
            <div className="mb-8">
                <Badge className={`mb-2 hover:${statusColor} ${statusColor} text-white border-0`}>{status}</Badge>
                <h2 className="text-3xl font-extrabold tracking-tight">{ipo.name}</h2>
                <div className="flex items-center text-muted-foreground mt-1 text-sm">
                    <span>{ipo.market || '시장 미정'}</span>
                    <Separator orientation="vertical" className="h-3 mx-2" />
                    <span>{ipo.code || '코드 미정'}</span>
                </div>
            </div>

            {/* Price Info */}
            <Card className="mb-6 border-none shadow-sm bg-secondary/30">
                <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground mb-1">확정공모가</span>
                        <span className="text-2xl font-bold text-primary">
                            {ipo.offerPrice ? `${Number(ipo.offerPrice).toLocaleString()}원` : '미정'}
                        </span>
                    </div>
                    <div className="text-right">
                         <span className="text-xs text-muted-foreground block mb-1">희망공모가 밴드</span>
                         <span className="text-sm font-medium">
                            {ipo.bandLow && ipo.bandHigh 
                              ? `${Number(ipo.bandLow).toLocaleString()} ~ ${Number(ipo.bandHigh).toLocaleString()}` 
                              : '-'}
                         </span>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Score Card */}
            {(() => {
                // Inline calculation or use memo if expensive, but it's cheap here
                const scoreResult = calculateIpoScore(ipo);
                return (
                    <div className="mt-8 mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            AI 예상 수익률 분석
                        </h3>
                        <Card className={`border-none shadow-sm ${scoreResult.bgClass}`}>
                            <CardContent className="p-4 py-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className={`text-2xl font-extrabold ${scoreResult.colorClass}`}>
                                            {scoreResult.grade}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 opacity-80">{scoreResult.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })()}

            {/* Schedule Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    청약 일정
                </h3>
                <Card>
                    <CardContent className="p-0">
                         <div className="grid grid-cols-2 divide-x">
                            <div className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-sm text-muted-foreground mb-1">청약일</span>
                                <span className="font-semibold">
                                    {ipo.subStart ? formatDate(ipo.subStart).slice(3) : '-'} ~ {ipo.subEnd ? formatDate(ipo.subEnd).slice(3) : '-'}
                                </span>
                            </div>
                            <div className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-sm text-muted-foreground mb-1">상장일</span>
                                <span className="font-semibold text-blue-600">
                                    {formatDate(ipo.listDate) === '미정' ? '-' : formatDate(ipo.listDate).slice(3)}
                                </span>
                            </div>
                         </div>
                         <Separator />
                         <div className="p-4 flex justify-between items-center bg-gray-50/50">
                            <span className="text-sm text-gray-500">환불일</span>
                            <span className="font-medium">{formatDate(ipo.refundDate)}</span>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <Card>
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                             <BarChart3 className="w-4 h-4" /> 기관경쟁률
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">
                            {ipo.competition || '-'}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                             <Building2 className="w-4 h-4" /> 주간사
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-sm font-medium break-keep leading-snug">
                            {ipo.underwriter || '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                             🔒 의무보유확약비율
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">
                            {ipo.lockupRate || '-'}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                             📊 유통물량
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold break-all">
                            {ipo.circulatingSupply || '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                             💰 장외가
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">
                            {ipo.otcPrice ? `${ipo.otcPrice}원` : '-'}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Bottom Action Area (Placeholder for Subscription Link) */}
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t hidden">
                 <Button className="w-full max-w-md mx-auto h-12 text-lg font-bold">
                     청약 바로가기 (준비중)
                 </Button>
             </div>
        </div>
    );
}
