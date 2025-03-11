import { useEffect, useState } from "react";

export const useFilteredMembers = <T extends { name: string }>(
  members: T[],
  searchText: string,
): T[] => {
  const [filtered, setFiltered] = useState<T[]>(members);

  useEffect(() => {
    setFiltered(
      members.filter(member =>
        member.name.toLowerCase().startsWith(searchText.toLowerCase()),
      ),
    );
  }, [members, searchText]);

  return filtered;
};
