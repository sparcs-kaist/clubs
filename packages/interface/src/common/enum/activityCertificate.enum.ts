// 발급과 수령을 별개로 관리하는 것이 맞는지 확인해주세요
const ActivityCertificateOrderStatusEnum = {
  Applied: 0, // 신청
  Approved: 1, // 승인
  Rejected: 2, // 반려
  Issued: 3, // 발급
  Received: 4, // 수령
} as const;

type ActivityCertificateOrderStatusEnum =
  (typeof ActivityCertificateOrderStatusEnum)[keyof typeof ActivityCertificateOrderStatusEnum];

export { ActivityCertificateOrderStatusEnum };
