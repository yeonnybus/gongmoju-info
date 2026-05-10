"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getIpoDetail } from '@/lib/api';
import { calculateIpoScore } from '@/lib/ipo-calculator';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Building2, Calendar, ChevronLeft, CircleDollarSign, Lock, Package, TrendingUp } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function IpoDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params.id as string;

    const getReturnPath = () => {
        const page = searchParams.get('page');
        const sort = searchParams.get('sort');
        const query = new URLSearchParams();

        if (page) query.set('page', page);
        if (sort) query.set('sort', sort);

        const queryString = query.toString();
        return queryString ? `/?${queryString}` : '/';
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.push(getReturnPath());
    };

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
                <Button onClick={handleBack}>뒤로가기</Button>
            </div>
        );
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '미정';
        return new Date(dateStr).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.');
    };

    const formatMonthDay = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '월 ').replace('.', '일');
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
    let statusTone = 'border-zinc-300 bg-zinc-100 text-zinc-700';

    if (startDate && endDate) {
        if (today >= startDate && today <= endDate) {
            status = '청약중';
            statusTone = 'border-orange-200 bg-orange-50 text-orange-600';
        } else if (today > endDate) {
            status = '마감';
            statusTone = 'border-zinc-200 bg-zinc-100 text-zinc-500';
        }
    }

    return (
        <div className="container mx-auto max-w-[430px] space-y-3.5 px-4 pb-20 pt-2">
            <header className="sticky top-0 z-20 -mx-4 mb-2 flex h-12 items-center border-b border-zinc-200/70 bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
                <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2 rounded-full" aria-label="뒤로가기">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="ml-2 text-[17px] font-semibold tracking-tight text-zinc-800">상세 정보</h1>
            </header>

            <Card className="gap-0 rounded-3xl border border-zinc-200/80 bg-white py-0 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
                <CardContent className="px-5 py-4">
                    <div className="mb-2 flex items-center justify-between">
                        <Badge className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone}`}>{status}</Badge>
                    </div>
                    <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.03em] text-zinc-900">{ipo.name}</h2>
                    <div className="mt-1.5 flex items-center text-[13px] text-zinc-500">
                        <span>{ipo.market || '시장 미정'}</span>
                        <Separator orientation="vertical" className="mx-2 h-3" />
                        <span>{ipo.code || '코드 미정'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3 rounded-2xl bg-zinc-50 px-3.5 py-3">
                        <div>
                            <p className="text-[11px] font-medium text-zinc-500">확정공모가</p>
                            <p className="mt-1 text-[42px] font-extrabold leading-none tracking-[-0.03em] text-zinc-950">
                                {ipo.offerPrice ? `${Number(ipo.offerPrice).toLocaleString()}원` : '미정'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right">
                            <p className="text-[10px] font-medium text-zinc-500">희망공모가 밴드</p>
                            <p className="mt-1 text-base font-bold text-zinc-700">
                                {ipo.bandLow && ipo.bandHigh
                                    ? `${Number(ipo.bandLow).toLocaleString()} ~ ${Number(ipo.bandHigh).toLocaleString()}원`
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white py-0 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-3.5 py-2.5">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            청약 일정
                        </p>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-zinc-200">
                        <div className="px-3.5 py-3.5 text-center">
                            <p className="text-[11px] text-zinc-500">청약일</p>
                            <p className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em] text-zinc-900">
                                {formatMonthDay(ipo.subStart)}
                            </p>
                            <p className="text-sm font-semibold text-zinc-600">~ {formatMonthDay(ipo.subEnd)}</p>
                        </div>
                        <div className="px-3.5 py-3.5 text-center">
                            <p className="text-[11px] text-zinc-500">상장일</p>
                            <p className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em] text-blue-600">
                                {formatMonthDay(ipo.listDate)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
                        <span className="text-sm text-zinc-500">환불일</span>
                        <span className="text-sm font-semibold text-zinc-700">{formatDate(ipo.refundDate)}</span>
                    </div>
                </CardContent>
            </Card>

            {(() => {
                const scoreResult = calculateIpoScore(ipo);
                return (
                    <Card className={`gap-0 rounded-2xl border-0 py-0 shadow-sm ${scoreResult.bgClass}`}>
                        <CardContent className="p-4">
                            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                                <TrendingUp className="h-4 w-4" /> AI 예상 수익률 분석
                            </p>
                            <p className={`text-[34px] font-extrabold leading-tight tracking-[-0.03em] ${scoreResult.colorClass}`}>
                                {scoreResult.grade}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600">{scoreResult.description}</p>
                        </CardContent>
                    </Card>
                );
            })()}

            <section className="grid grid-cols-2 gap-2.5">
                <Card className="col-span-2 gap-0 rounded-2xl border border-zinc-200/80 bg-white py-0">
                    <CardContent className="p-3.5">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <BarChart3 className="h-3.5 w-3.5" /> 기관경쟁률
                        </p>
                        <p className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">{ipo.competition || '-'}</p>
                    </CardContent>
                </Card>

                <Card className="gap-0 rounded-2xl border border-zinc-200/80 bg-white py-0">
                    <CardContent className="p-3.5">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <Building2 className="h-3.5 w-3.5" /> 주간사
                        </p>
                        <p className="text-base font-bold leading-snug text-zinc-900 break-keep">{ipo.underwriter || '-'}</p>
                    </CardContent>
                </Card>

                <Card className="gap-0 rounded-2xl border border-zinc-200/80 bg-white py-0">
                    <CardContent className="p-3.5">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <Lock className="h-3.5 w-3.5" /> 의무보유확약비율
                        </p>
                        <p className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">{ipo.lockupRate || '-'}</p>
                    </CardContent>
                </Card>

                <Card className="col-span-2 gap-0 rounded-2xl border border-zinc-200/80 bg-white py-0">
                    <CardContent className="p-3.5">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <Package className="h-3.5 w-3.5" /> 유통물량
                        </p>
                        <p className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900 break-all">{ipo.circulatingSupply || '-'}</p>
                    </CardContent>
                </Card>

                <Card className="col-span-2 gap-0 rounded-2xl border border-zinc-200/80 bg-white py-0">
                    <CardContent className="p-3.5">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                            <CircleDollarSign className="h-3.5 w-3.5" /> 장외가
                        </p>
                        <p className="text-[34px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">
                            {ipo.otcPrice ? `${ipo.otcPrice}원` : '-'}
                        </p>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
