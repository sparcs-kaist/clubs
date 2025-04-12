import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@clubs/interface/common/enum/promotionalPrinting.enum";

// 상태 리스트 정의
const statuses = [
  PromotionalPrintingOrderStatusEnum.Applied,
  PromotionalPrintingOrderStatusEnum.Approved,
  PromotionalPrintingOrderStatusEnum.Printed,
  PromotionalPrintingOrderStatusEnum.Received,
];

// Mock 데이터 생성
const items = Array.from({ length: 120 }, (_, index) => ({
  status: statuses[Math.floor(Math.random() * statuses.length)], // 랜덤 상태 선택
  id: index,
  createdAt: new Date(`2024-01-01T00:00:00Z`), // UTC 시간 설정
  studentName: "임가은", // 예시 학생 이름
  clubName: "술박스", // 예시 동아리 이름
  krPhoneNumber: "010-1234-1234", // 예시 연락처
  orders: [
    {
      promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A4, // A4 사이즈
      numberOfPrints: Math.floor(Math.random() * 100) + 1, // 1~100 사이의 랜덤 숫자
    },
    {
      promotionalPrintingSizeEnum: PromotionalPrintingSizeEnum.A3, // A3 사이즈
      numberOfPrints: Math.floor(Math.random() * 100) + 1, // 1~100 사이의 랜덤 숫자
    },
  ],
  desiredPickUpDate: new Date(`2024-01-01T00:00:00Z`), // UTC 시간 설정
}));

// Mock 데이터 객체
const mockupPrint = {
  total: items.length, // 총 아이템 수
  items,
  offset: 0, // 데이터 오프셋
};

export default mockupPrint;
