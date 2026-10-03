// Numbered page buttons for usePagination; hidden when there is only one page.
// Shows at most 7 page numbers around the current page.
export default function TablePagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const start = Math.max(1, Math.min(page - 3, pageCount - 6));
  const pages = Array.from({ length: Math.min(7, pageCount) }, (_, i) => start + i);
  return (
    <nav className="ui-pager" aria-label="Pagination">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="ui-pager-pages">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          <i className="bi bi-chevron-left" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={p === page ? "active" : ""}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button type="button" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Next page">
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </nav>
  );
}
