import { hangulIncludes } from "es-hangul";
import { useEffect, useState } from "react";

export const useFilteredMembers = <T extends { name: string }>(
  members: T[],
  searchText: string,
): T[] => {
  const [filtered, setFiltered] = useState<T[]>(members);

  useEffect(() => {
    setFiltered(
      members.filter(
        member =>
          member.name.toLowerCase().includes(searchText.toLowerCase()) ||
          hangulIncludes(member.name, searchText),
      ),
    );
  }, [members, searchText]);

  return filtered;
};
