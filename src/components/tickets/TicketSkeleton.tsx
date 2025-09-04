import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketSkeletonProps {
  compact?: boolean;
}

export const TicketSkeleton = ({ compact = false }: TicketSkeletonProps) => {
  if (compact) {
    return (
      <Card className="animate-pulse border-l-4 border-l-muted">
        <CardContent className="p-2">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-6 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-pulse border-l-4 border-l-muted">
      <CardContent className="p-4 space-y-3 pr-16">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded ml-2" />
        </div>
        
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        <div className="flex gap-1">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};