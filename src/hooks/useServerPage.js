import { useCallback, useEffect, useRef, useState } from "react";

// One page of a list paged on the server, e.g. students.listStudents. `filters` is a
// plain object; the page goes back to 1 whenever a filter changes, and `search` is
// sent as `q` a moment after typing stops. The previous page stays on screen while
// the next one loads (`refreshing`), so the table does not flash.
//
//   const list = useServerPage(listStudents, { status, region_id }, search);
//   list.items, list.total, list.page, list.pageCount, list.setPage, list.reload
export default function useServerPage(fetchPage, filters, search = "", pageSize = 25) {
  const [q, setQ] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const key = JSON.stringify({ ...filters, q });
  const [page, setPageState] = useState({ key, page: 1 });
  // A new filter starts again at page 1
  const current = page.key === key ? page.page : 1;
  const setPage = useCallback((p) => setPageState({ key, page: p }), [key]);

  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [runs, setRuns] = useState(0);
  const latest = useRef(0);
  useEffect(() => {
    const run = ++latest.current;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    fetchPage({ ...JSON.parse(key), page: current, page_size: pageSize }).then(
      (data) => run === latest.current && setState({ data, loading: false, error: "" }),
      (error) => run === latest.current && setState((prev) => ({ ...prev, loading: false, error: error.message }))
    );
  }, [fetchPage, key, current, pageSize, runs]);

  const total = state.data?.total || 0;
  return {
    items: state.data?.students || [],
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    setPage,
    firstLoad: state.loading && !state.data,
    refreshing: state.loading && Boolean(state.data),
    error: state.error,
    reload: useCallback(() => setRuns((n) => n + 1), []),
    query: { ...filters, q },
  };
}

// Every row matching the filters, fetched in pages of 5,000, for a download (which the
// server records in the activity log).
export async function fetchAllPages(fetchPage, filters) {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await fetchPage({ ...filters, page, page_size: 5000, export: true });
    rows.push(...result.students);
    if (rows.length >= result.total || !result.students.length) return rows;
  }
}
