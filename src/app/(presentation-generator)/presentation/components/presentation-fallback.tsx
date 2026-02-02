import PptFlowLayout from "../../components/ppt-flow-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function PresentationFallback() {
  return (
    <PptFlowLayout
      topSlot={
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
      }
      contentClassName="gap-4"
      narrow={false}
      wrapperClassName="lg:px-page-x"
    >
      <div className="flex flex-1 relative gap-4">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-[280px] h-[calc(100vh-200px)] rounded-xl border border-bg-200 bg-bg-100 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-video rounded-lg" />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 h-[calc(100vh-200px)] rounded-xl border border-bg-200 bg-bg-100 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full aspect-video rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </PptFlowLayout>
  );
}
