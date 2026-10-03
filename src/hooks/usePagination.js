import { useState } from "react";

// Client-side paging for a list. The page is clamped when the list shrinks
// (for example after filtering), so it never points past the last page.
export default function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return { page: currentPage, pageCount, pageItems, setPage };
}
