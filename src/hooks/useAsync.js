import { useCallback, useEffect, useState } from "react";

// Runs an async loader and tracks its result. Pass a memoized loader
// (useCallback) so it re-runs only when its inputs change:
//
//   const { data, loading, error, reload } = useAsync(
//     useCallback(() => listRegionDistricts(regionId), [regionId])
//   );
//
// `error` is the thrown error's message; `reload()` runs the loader again.
export default function useAsync(loader) {
  const [state, setState] = useState({ data: undefined, loading: true, error: "" });
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    let current = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    loader().then(
      (data) => current && setState({ data, loading: false, error: "" }),
      (error) => current && setState({ data: undefined, loading: false, error: error.message })
    );
    // Ignore results from a run that a newer run has replaced
    return () => {
      current = false;
    };
  }, [loader, runCount]);

  const reload = useCallback(() => setRunCount((count) => count + 1), []);
  return { ...state, reload };
}
