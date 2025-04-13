import { ApiCms002ResponseOK } from "@clubs/interface/api/common-space/endpoint/apiCms002";

export const mockUsageOrders: ApiCms002ResponseOK = {
  usageOrders: [
    {
      orderId: 1, // An integer greater than 0
      clubId: 25, // An integer representing a club ID
      chargeStudentName: "John Doe", // A string, less than 255 characters
      startTerm: new Date("2024-11-09T15:00:00Z"), // Start term as a date object
      endTerm: new Date("2024-11-16T15:00:00Z"), // End term as a date object
    },
    {
      orderId: 2, // Another example entry
      clubId: 30,
      chargeStudentName: "Jane Smith",
      startTerm: new Date("2024-11-17T15:00:00Z"),
      endTerm: new Date("2024-11-18T15:00:00Z"),
    },
  ],
};
