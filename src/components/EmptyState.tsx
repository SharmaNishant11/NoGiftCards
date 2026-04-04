interface EmptyStateProps {
  emoji: string;
  message: string;
}

const EmptyState = ({ emoji, message }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 page-enter">
    <span className="text-6xl gold-pulse">{emoji}</span>
    <p className="font-crimson italic text-gold-light text-lg text-center max-w-xs">
      {message}
    </p>
  </div>
);

export default EmptyState;
