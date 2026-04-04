const SkeletonCard = () => (
  <div className="rounded-lg p-5 space-y-4 skeleton-gold" style={{ height: 260 }}>
    <div className="h-6 w-16 rounded bg-muted/30" />
    <div className="h-5 w-3/4 rounded bg-muted/30" />
    <div className="h-4 w-full rounded bg-muted/30" />
    <div className="h-4 w-2/3 rounded bg-muted/30" />
    <div className="h-8 w-24 rounded bg-muted/30 mt-auto" />
  </div>
);

export default SkeletonCard;
