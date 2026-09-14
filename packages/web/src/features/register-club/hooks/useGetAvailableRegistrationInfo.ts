import useGetRegistrationAvailableClubs from "../services/useGetRegistrationAvailableClubs";

const useGetAvailableRegistrationInfo = () => {
  const query = useGetRegistrationAvailableClubs();
  const { data } = query;

  return {
    ...query,
    data: {
      ...data,
      noManageClub: data?.club === null,
      haveAvailableRegistration:
        data?.club && data.club.availableRegistrationTypeEnums.length > 0,
      availableRegistrations: data?.club?.availableRegistrationTypeEnums ?? [],
    },
  };
};

export default useGetAvailableRegistrationInfo;
