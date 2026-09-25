"use client";

import { useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useMemo } from "react";

import { QueryValue, readQueryValue, updateQueryValue } from "./queryState";

/** List state lives in the URL, including when a history entry is restored. */
export default function useQueryState<T extends QueryValue>(
  key: string,
  defaultValue: T,
  resetPage?: string,
): [T, Dispatch<SetStateAction<T>>] {
  const searchParams = useSearchParams();
  const raw = searchParams.get(key);
  const defaultJson = JSON.stringify(defaultValue);
  const value = useMemo(
    () => readQueryValue(raw, JSON.parse(defaultJson) as T),
    [raw, defaultJson],
  );

  const setValue: Dispatch<SetStateAction<T>> = next => {
    // Read the current URL so consecutive setters do not overwrite each other.
    const current = readQueryValue(
      new URLSearchParams(window.location.search).get(key),
      defaultValue,
    );
    const updated = typeof next === "function" ? next(current) : next;
    if (JSON.stringify(current) === JSON.stringify(updated)) return;
    const href = updateQueryValue(
      window.location.href,
      key,
      updated,
      defaultValue,
      resetPage,
    );
    // Next.js copies its router state and syncs useSearchParams for external writes.
    window.history.replaceState(null, "", href);
  };

  return [value, setValue];
}
