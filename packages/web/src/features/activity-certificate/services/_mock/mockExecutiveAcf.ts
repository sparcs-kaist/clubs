import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

const mockExecutiveAcf = {
  items: [
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Received,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Issued,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "동아리 대표자 반려 사유: 어쩌구저쩌구",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(`2024-03-11T12:00:00Z`),
      clubName: "술박스",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "동아리 연합회 반려 사유: 어쩌구저쩌구",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Applied,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Received,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Approved,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Issued,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "동아리 대표자 반려 사유: 어쩌구저쩌구",
    },
    {
      statusEnum: ActivityCertificateOrderStatusEnum.Rejected,
      createdAt: new Date(`2024-03-12T12:00:00Z`),
      clubName: "술박스2",
      studentName: "이지윤",
      studentPhoneNumber: "010-9612-4975",
      issuedNumber: 2,
      note: "동아리 연합회 반려 사유: 어쩌구저쩌구",
    },
  ],
  total: 20,
  offset: 10,
};

export { mockExecutiveAcf };
