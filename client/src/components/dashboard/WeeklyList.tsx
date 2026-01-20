"use client";

import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getIpoList } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type SortOption = 'latest' | 'oldest' | 'name';

const ITEMS_PER_PAGE = 10;

export function WeeklyList() {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>('latest');

    const { data: ipoList, isLoading } = useQuery({
        queryKey: ['ipoList'],
        queryFn: getIpoList,
    });

    // Sort and paginate data
    const { sortedList, totalPages, paginatedList } = useMemo(() => {
        if (!ipoList || ipoList.length === 0) {
            return { sortedList: [], totalPages: 0, paginatedList: [] };
        }

        // Sort
        const sorted = [...ipoList].sort((a: any, b: any) => {
            switch (sortBy) {
                case 'latest':
                    return new Date(b.subStart || 0).getTime() - new Date(a.subStart || 0).getTime();
                case 'oldest':
                    return new Date(a.subStart || 0).getTime() - new Date(b.subStart || 0).getTime();
                case 'name':
                    return (a.name || '').localeCompare(b.name || '', 'ko');
                default:
                    return 0;
            }
        });

        // Calculate pagination
        const total = Math.ceil(sorted.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { sortedList: sorted, totalPages: total, paginatedList: paginated };
    }, [ipoList, sortBy, currentPage]);

    // Reset to page 1 when sort changes
    const handleSortChange = (value: SortOption) => {
        setSortBy(value);
        setCurrentPage(1);
    };

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

    return (
        <div className="space-y-4">
            {/* Sort Control */}
            <div className="flex justify-end">
                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="정렬" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="latest">최신순</SelectItem>
                        <SelectItem value="oldest">오래된순</SelectItem>
                        <SelectItem value="name">이름순</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            <div className="space-y-1">
                {paginatedList.map((item: any, index: number) => {
                    // Simple status logic
                    const today = new Date();
                    const startDate = item.subStart ? new Date(item.subStart) : null;
                    const endDate = item.subEnd ? new Date(item.subEnd) : null;

                    let status = 'UPCOMING';
                    if (startDate && endDate) {
                        if (today >= startDate && today <= endDate) status = 'OPEN';
                        else if (today > endDate) status = 'CLOSED';
                    }

                    // Format Date
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
                            <Link href={`/ipo/${item.id}`}>
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
                            </Link>
                            {index < paginatedList.length - 1 && <Separator className="my-1" />}
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination className="mt-6">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                                }}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentPage(page);
                                    }}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                }}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
