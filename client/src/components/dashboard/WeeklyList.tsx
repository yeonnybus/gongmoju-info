import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Mock Data Type
interface IpoItem {
  id: string;
  name: string;
  date: string;
  status: 'UPCOMING' | 'OPEN' | 'CLOSED';
}

const WEEKLY_MOCK: IpoItem[] = [
    { id: '1', name: '에이치이엠파마', date: '10.24', status: 'OPEN' },
    { id: '2', name: '탑런토탈솔루션', date: '10.25', status: 'UPCOMING' },
    { id: '3', name: '에이럭스', date: '10.26', status: 'UPCOMING' },
];

export function WeeklyList() {
    // TODO: Fetch data
    const isLoading = false;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {WEEKLY_MOCK.map((item, index) => (
                <div key={item.id}>
                    <div className="flex items-center py-4 px-1 hover:bg-accent/50 rounded-lg transition-colors cursor-pointer">
                        {/* Date Badge */}
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-secondary rounded-xl mr-4 shrink-0">
                            <span className="text-xs font-bold text-gray-500">{item.date.split('.')[0]}월</span>
                            <span className="text-sm font-extrabold">{item.date.split('.')[1]}</span>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1">
                            <h4 className="font-semibold text-base">{item.name}</h4>
                            <span className="text-xs text-muted-foreground">코스닥 | 공모</span>
                        </div>

                        {/* Status */}
                        <div>
                           {item.status === 'OPEN' ? (
                               <Badge variant="default" className="bg-green-600 hover:bg-green-700">청약중</Badge>
                           ) : (
                               <Badge variant="outline" className="text-gray-500">예정</Badge>
                           )}
                        </div>
                    </div>
                    {index < WEEKLY_MOCK.length - 1 && <Separator className="my-1" />}
                </div>
            ))}
        </div>
    );
}
