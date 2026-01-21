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
    <main className="p-4 space-y-8 pb-20">
      
      {/* 1. Today's Briefing */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold px-1">오늘의 브리핑</h2>
        <TodayCard ipoList={ipoList} />
      </section>

      {/* 2. Upcoming Schedule */}
      <section className="space-y-3">
        <div className="flex justify-between items-end px-1">
            <h2 className="text-xl font-bold">다가오는 일정</h2>
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
