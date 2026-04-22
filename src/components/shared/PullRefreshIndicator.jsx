export default function PullRefreshIndicator({ refreshing }) {
  if (!refreshing) return null;
  return (
    <div className="flex justify-center py-3">
      <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}