import { ApiRnt001ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt001";

export const getMaxRental = (
  availableRentals: ApiRnt001ResponseOK,
  itemName: string,
) =>
  availableRentals?.objects.find(item => item.name === itemName)?.maximum ?? 0;
