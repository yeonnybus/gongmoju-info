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
import type { Ipo } from "@/lib/api.server";
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

type SortOption = 'latest' | 'oldest' | 'name';

const ITEMS_PER_PAGE = 10;
const SCROLL_KEY = 'home:list:scrollY';

const SORT_OPTIONS: SortOption[] = ['latest', 'oldest', 'name'];

interface WeeklyListProps {
    ipoList: Ipo[];
}

export function WeeklyList({ ipoList }: WeeklyListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sortParam = searchParams.get('sort');
    const sortBy: SortOption = SORT_OPTIONS.includes(sortParam as SortOption)
        ? (sortParam as SortOption)
        : 'latest';

    const currentPageParam = Number(searchParams.get('page'));
    const requestedPage = Number.isInteger(currentPageParam) && currentPageParam > 0 ? currentPageParam : 1;

    const buildUrl = useCallback((page: number, sort: SortOption) => {
        const params = new URLSearchParams(searchParams.toString());

        if (page <= 1) {
            params.delete('page');
        } else {
            params.set('page', String(page));
        }

        if (sort === 'latest') {
            params.delete('sort');
        } else {
            params.set('sort', sort);
        }

        const query = params.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [pathname, searchParams]);

    // Sort and paginate data
    const { totalPages, paginatedList, currentPage } = useMemo(() => {
        if (!ipoList || ipoList.length === 0) {
            return { totalPages: 0, paginatedList: [], currentPage: 1 };
        }

        // Sort
        const sorted = [...ipoList].sort((a, b) => {
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
        const page = Math.min(Math.max(requestedPage, 1), Math.max(total, 1));
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { totalPages: total, paginatedList: paginated, currentPage: page };
    }, [ipoList, sortBy, requestedPage]);

    useEffect(() => {
        const savedScroll = sessionStorage.getItem(SCROLL_KEY);
        if (!savedScroll) {
            return;
        }

        const scrollY = Number(savedScroll);
        if (Number.isFinite(scrollY)) {
            requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, behavior: 'auto' });
            });
        }
        sessionStorage.removeItem(SCROLL_KEY);
    }, []);

    useEffect(() => {
        if (currentPage !== requestedPage) {
            router.replace(buildUrl(currentPage, sortBy), { scroll: false });
        }
    }, [buildUrl, currentPage, requestedPage, router, sortBy]);

    const handleSortChange = (value: SortOption) => {
        router.replace(buildUrl(1, value), { scroll: false });
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) {
            return;
        }
        router.replace(buildUrl(page, sortBy), { scroll: false });
    };

    const saveScrollPosition = () => {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };

    if (!ipoList || ipoList.length === 0) {
        return <div className="text-center py-10 text-gray-500">예정된 일정이 없습니다.</div>;
    }

    return (
        <div className="space-y-5">
            {/* Sort Control */}
            <div className="flex justify-end">
                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[148px] rounded-xl border-zinc-200 bg-white text-zinc-700" aria-label="정렬 기준">
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
            <div className="space-y-2">
                {paginatedList.map((item, index: number) => {
                    // Simple status logic
                    const today = new Date();
                    const startDate = item.subStart ? new Date(item.subStart) : null;
                    // Set endDate to end of day (23:59:59) to include the entire last day
                    const endDate = item.subEnd ? new Date(item.subEnd) : null;
                    if (endDate) {
                        endDate.setHours(23, 59, 59, 999);
                    }

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
                            <Link
                                href={`/ipo/${item.id}?page=${currentPage}&sort=${sortBy}`}
                                onClick={saveScrollPosition}
                                className="block rounded-2xl border border-zinc-200 bg-white px-3 py-3.5 transition hover:bg-zinc-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <div className="flex items-center">
                                    {/* Date Badge */}
                                    <div className="mr-4 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-zinc-100">
                                        <span className="text-xs font-bold text-zinc-500">{month}월</span>
                                        <span className="text-sm font-extrabold text-zinc-900">{day}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h4 className="text-base font-bold text-zinc-900">{item.name}</h4>
                                        <span className="text-xs text-zinc-500">{item.market || '시장 미정'} | {item.offerPrice ? `${Number(item.offerPrice).toLocaleString()}원` : '미정'}</span>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        {status === 'OPEN' ? (
                                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600">청약중</Badge>
                                        ) : status === 'CLOSED' ? (
                                            <Badge variant="outline" className="border-zinc-200 bg-zinc-100 text-zinc-500">마감</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600">예정</Badge>
                                        )}
                                    </div>
                                </div>
                            </Link>
                            {index < paginatedList.length - 1 && <div className="h-0.5" />}
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination className="mt-8">
                    <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                href={buildUrl(Math.max(currentPage - 1, 1), sortBy)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(currentPage - 1);
                                }}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    href={buildUrl(page, sortBy)}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(page);
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
                                href={buildUrl(Math.min(currentPage + 1, totalPages), sortBy)}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(currentPage + 1);
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
