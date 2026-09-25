import { useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";

import { CategoryProps } from "../components/MultiFilter/types/FilterCategories";
import { readQueryValue, updateQueryValue } from "./queryState";

/** Only selections are stored; labels and available options come from live data. */
export default function useQueryCategories(
  defaults: CategoryProps[],
  keys: string[],
  resetPage?: string,
): [CategoryProps[], Dispatch<SetStateAction<CategoryProps[]>>] {
  const searchParams = useSearchParams();
  const defaultsJson = JSON.stringify(defaults);
  const keysJson = JSON.stringify(keys);
  const stableDefaults: CategoryProps[] = useMemo(
    () => JSON.parse(defaultsJson),
    [defaultsJson],
  );
  const stableKeys: string[] = useMemo(() => JSON.parse(keysJson), [keysJson]);
  const readCategories = useCallback(
    (params: { get: (key: string) => string | null }) =>
      stableDefaults.map((category, index) => ({
        ...category,
        selectedContent: readQueryValue(
          params.get(stableKeys[index]),
          category.selectedContent,
        ).filter(value => category.content.includes(value)),
      })),
    [stableDefaults, stableKeys],
  );
  const categories = useMemo(
    () => readCategories(searchParams),
    [readCategories, searchParams],
  );

  const setCategories: Dispatch<SetStateAction<CategoryProps[]>> = next => {
    const current = readCategories(new URLSearchParams(window.location.search));
    const updated = typeof next === "function" ? next(current) : next;
    let { href } = window.location;
    updated.forEach((category, index) => {
      if (
        JSON.stringify(category.selectedContent) !==
        JSON.stringify(current[index].selectedContent)
      ) {
        href = new URL(
          updateQueryValue(
            href,
            keys[index],
            category.selectedContent,
            defaults[index].selectedContent,
            resetPage,
          ),
          href,
        ).href;
      }
    });
    if (href !== window.location.href) {
      window.history.replaceState(null, "", href);
    }
  };

  return [categories, setCategories];
}
