import { CircleAlert, SearchX } from 'lucide-react';

export function ErrorState({ message = 'We could not load this right now.', onRetry }) {
  return (
    <div className="state" role="alert">
      <CircleAlert aria-hidden="true" />
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state">
      <SearchX aria-hidden="true" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
