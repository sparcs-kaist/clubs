/**
 * @description
 * 물품대여신청에 대한 처리 상태를 표현하기 위한 enum
 * startDate, endTerm 는 각각 대여와 반납이 확정되면 설정되는 값입니다.
 *  Applied: 신청
 *    - 신청이 들어왔으나 확정되지 않은 상태 (대여가능여부 확인중)
 *    - !startDate && (today < desiredStart)
 *  Approved: 승인
 *    - 신청이 승인된 상태
 *    - startDate && (today < desiredStart)
 *  Rented: 대여
 *    - 대여날짜가 지나서, 물품이 대여된 상태
 *    - startDate & !endTerm & (desiredStart < today)
 *  Returned: 반납
 *    - 대여된 물품이 반납된 상태
 *    - endTerm
 *
 *  거절된 상황, 연체 상황은 Invalid 로 정의되어 있음.
 */

// 물품대여신청에 대하 처리 상태를 표현하기 위한 열거형입니다.
enum RentalOrderStatusEnum {
  Applied, // 신청
  Approved, // 승인
  Rented, // 대여
  Returned, // 반납
  Rejected,
  Overdue,
}

export { RentalOrderStatusEnum };
