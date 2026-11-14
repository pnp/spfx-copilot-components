import { useEffect, useRef, useState } from "react"

export interface IDataQueryState<T> {
  data: T | undefined
  loading: boolean
  error: Error | undefined
}

/**
 * Runs an async query on mount and whenever `deps` changes, guarding against
 * setting state from a stale/out-of-order response (e.g. rapid filter edits).
 */
export function useDataQuery<T>(queryFn: () => Promise<T>, deps: ReadonlyArray<unknown>): IDataQueryState<T> {
  const [state, setState] = useState<IDataQueryState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  })
  const requestId = useRef(0)

  useEffect(() => {
    const currentRequestId = ++requestId.current
    setState((prev) => ({ ...prev, loading: true, error: undefined }))

    queryFn()
      .then((data) => {
        if (requestId.current === currentRequestId) {
          setState({ data, loading: false, error: undefined })
        }
      })
      .catch((err: unknown) => {
        if (requestId.current === currentRequestId) {
          setState({
            data: undefined,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      })
  }, deps)

  return state
}
