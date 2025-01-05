import { FundingDto } from "./funding.dto.model";

export class FundingTransportation {
  transportationEnumId?: number;

  origin?: string;

  destination?: string;

  purposeOfTransportation?: string;

  placeValidity?: string;

  transportationPassengers: Array<{
    name: string;
    studentNumber: string;
  }>;

  constructor(data: FundingDto) {
    Object.assign(this, {
      transportationEnumId: data.transportationEnumId,
      origin: data.origin,
      destination: data.destination,
      purposeOfTransportation: data.purposeOfTransportation,
      placeValidity: data.placeValidity,
      transportationPassengers: data.transportationPassengers,
    });
  }
}
