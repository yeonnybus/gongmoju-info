import { EmailSubscription } from "@/components/dashboard/EmailSubscription";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { WeeklyList } from "@/components/dashboard/WeeklyList";
import { getIpoListServer } from "@/lib/api.server";

// Force dynamic rendering to avoid build-time API calls
// ISR behavior is handled by fetch cache in api.server.ts
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Server-side data fetching with caching (revalidates every 60 seconds)
  const ipoList = await getIpoListServer();

  return (
    <main className="mx-auto w-full max-w-[720px] space-y-10 px-4 pb-24 pt-5">
      
      {/* 1. Today's Briefing */}
      <section className="space-y-3">
        <h2 className="px-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">오늘의 브리핑</h2>
        <TodayCard ipoList={ipoList} />
      </section>

      {/* 2. Upcoming Schedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-zinc-900">다가오는 일정</h2>
        </div>
        <WeeklyList ipoList={ipoList} />
      </section>

      {/* 3. Subscription */}
      <section>
        <EmailSubscription />
      </section>

    </main>
  );
}
