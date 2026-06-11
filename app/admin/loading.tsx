export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-charcoal/10" />
          <div className="h-7 w-56 rounded-xl bg-charcoal/10" />
        </div>
        <div className="h-9 w-32 rounded-full bg-charcoal/8" />
      </div>

      {/* Content skeleton — cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-mist h-24" />
        ))}
      </div>

      {/* Table / list skeleton */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        <div className="border-b border-mist px-5 py-4">
          <div className="h-4 w-32 rounded-full bg-charcoal/10" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-mist last:border-0">
            <div className="w-8 h-8 rounded-full bg-charcoal/8 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 rounded-full bg-charcoal/10" />
              <div className="h-2.5 w-28 rounded-full bg-charcoal/6" />
            </div>
            <div className="h-6 w-20 rounded-full bg-charcoal/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
