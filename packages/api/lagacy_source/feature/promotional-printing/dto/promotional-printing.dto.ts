import type { ApiPrt001ResponseOk } from "@clubs/interface/api/promotional-printing/endpoint/apiPrt001";
import type {
  ApiPrt002RequestBody,
  ApiPrt002RequestParam,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";
import type { ApiPrt005ResponseOk } from "@clubs/interface/api/promotional-printing/endpoint/apiPrt005";

export type GetStudentPromotionalPrintingsOrdersReturn = Array<
  Pick<
    ApiPrt001ResponseOk["items"][number],
    | "id"
    | "studentName"
    | "status"
    | "desiredPickUpDate"
    | "pickUpTime"
    | "createdAt"
  >
>;

export type FindPromotionalPrintingOrderSizeBypromotionalPrintingOrderIdReturn =
  ApiPrt001ResponseOk["items"][number]["orders"];

export type PostStudentPromotionalPrintingsOrderParam = ApiPrt002RequestParam &
  ApiPrt002RequestBody;

export type GetStudentPromotionalPrintingsOrdersMyReturn = Array<
  Pick<
    ApiPrt005ResponseOk["items"][number],
    | "id"
    | "studentName"
    | "status"
    | "desiredPickUpDate"
    | "pickUpTime"
    | "createdAt"
  >
>;
