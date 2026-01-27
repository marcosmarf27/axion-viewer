import { cn } from '@/lib/utils';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-gray-400">...</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm',
            p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Proximo
      </button>
    </nav>
  );
}
