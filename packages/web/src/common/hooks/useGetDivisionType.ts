import { getDivisionTagColor } from "@sparcs-clubs/web/constants/tableTagList";
import { StatusDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import useGetDivisions from "../services/getDivisions";

const useGetDivisionType = () => {
  const { data, isLoading, isError } = useGetDivisions();

  const divisionTypeList = data?.divisions;

  const divisionTypeTagList: { [key in number]: StatusDetail } =
    divisionTypeList?.reduce(
      (acc, division) => ({
        ...acc,
        [division.id]: {
          text: division.name,
          color: getDivisionTagColor(division.name),
        },
      }),
      {},
    ) ?? {};

  return {
    data: {
      divisions: data?.divisions,
      divisionTagList: divisionTypeTagList,
    },
    isLoading,
    isError,
  };
};

export default useGetDivisionType;
