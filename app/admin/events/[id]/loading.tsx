export default function EventTabLoading() {
  return (
    <div className="space-y-5 animate-pulse pt-1">
      {/* Row of action buttons */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-28 rounded-full bg-charcoal/10" />
        <div className="h-8 w-24 rounded-full bg-charcoal/8" />
      </div>

      {/* Main content block */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        <div className="border-b border-mist px-5 py-4 flex items-center justify-between">
          <div className="h-4 w-40 rounded-full bg-charcoal/10" />
          <div className="h-3 w-20 rounded-full bg-charcoal/8" />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-mist last:border-0">
            <div className="w-7 h-7 rounded-full bg-charcoal/8 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-44 rounded-full bg-charcoal/10" />
              <div className="h-2.5 w-24 rounded-full bg-charcoal/6" />
            </div>
            <div className="h-7 w-24 rounded-full bg-charcoal/8" />
          </div>
        ))}
      </div>
    </div>
  );
}
