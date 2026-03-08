import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ── Dashboard Skeleton ──
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-section-alt">
    {/* Header */}
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Skeleton className="h-7 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </header>

    <main className="container mx-auto space-y-8 px-4 py-8 lg:px-8">
      {/* Welcome + Membership */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card className="border-border">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Policies */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Claims + Payments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between rounded-2xl bg-section-alt p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-5 w-20 rounded-full ml-auto" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <Skeleton className="h-6 w-28 mb-4" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 flex flex-col items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  </div>
);

// ── List Page Skeleton (Quotations / Policies) ──
export const ListPageSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// ── Profile Skeleton ──
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-section-alt">
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </header>

    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
      {/* Hero card */}
      <Card className="overflow-hidden border-border">
        <Skeleton className="h-36 w-full rounded-none" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Skeleton className="h-24 w-24 rounded-[1.75rem]" />
            <div className="flex-1 space-y-2 pb-1">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Personal Info */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader><Skeleton className="h-6 w-44" /></CardHeader>
            <CardContent className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-section-alt p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Security + Documents */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-full" />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><Skeleton className="h-6 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-section-alt p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  </div>
);
