import type { ApiRnt001ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt001";

const mockupAvailableRental: ApiRnt001ResponseOK = {
  objects: [
    { id: 1, name: "Easel", maximum: 0 },
    { id: 2, name: "Vacuum Corded", maximum: 1 },
    { id: 3, name: "Vacuum Cordless", maximum: 0 },
    { id: 4, name: "Hand Cart Rolltainer", maximum: 10 },
    { id: 5, name: "Hand Cart Large", maximum: 8 },
    { id: 6, name: "Hand Cart Medium", maximum: 15 },
    { id: 7, name: "Hand Cart Small", maximum: 20 },
    { id: 8, name: "Mat", maximum: 25 },
    { id: 9, name: "Power Drill Set", maximum: 7 },
    { id: 10, name: "Driver Set", maximum: 10 },
    { id: 11, name: "Super Glue", maximum: 50 },
    { id: 12, name: "Nipper", maximum: 12 },
    { id: 13, name: "Plier", maximum: 12 },
    { id: 14, name: "Long Nose Plier", maximum: 12 },
  ],
};

export default mockupAvailableRental;
