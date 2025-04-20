import type { ApiUsr001ResponseOK } from "@clubs/interface/api/user/endpoint/apiUsr001";

const mockupUserProfile: ApiUsr001ResponseOK = {
  id: 1234,
  name: "넙죽이",
  studentNumber: 23456789,
  clubs: [
    { id: 1, nameKr: "술박스", nameEn: "술박스" },
    { id: 2, nameKr: "동연", nameEn: "동연" },
    { id: 3, nameKr: "총학", nameEn: "총학" },
  ],
  email: "clubsfighting@sparcs.org",
  department: "SoC",
  phoneNumber: "010-1234-8765",
};

export default mockupUserProfile;
