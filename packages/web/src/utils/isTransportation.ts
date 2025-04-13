import { TransportationEnum as E } from "@clubs/interface/common/enum/funding.enum";

const isParticipantsRequired = (transportation: E | undefined) =>
  transportation === E.Taxi ||
  transportation === E.CharterBus ||
  transportation === E.CallVan ||
  transportation === E.Airplane ||
  transportation === E.Ship ||
  transportation === E.Others;

const isPurposeInfoRequired = (transportation: E | undefined) =>
  transportation === E.Cargo ||
  transportation === E.CallVan ||
  transportation === E.Airplane ||
  transportation === E.Ship ||
  transportation === E.Others;

export { isParticipantsRequired, isPurposeInfoRequired };
