import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
  TransportationEnum,
} from "@clubs/interface/common/enum/funding.enum";

const transportationEnumMap = (enumValue?: TransportationEnum): string => {
  if (enumValue === TransportationEnum.CityBus) {
    return "시내/마을버스";
  }
  if (enumValue === TransportationEnum.IntercityBus) {
    return "고속/시외버스";
  }
  if (enumValue === TransportationEnum.Rail) {
    return "철도";
  }
  if (enumValue === TransportationEnum.Taxi) {
    return "택시";
  }
  if (enumValue === TransportationEnum.CharterBus) {
    return "전세버스";
  }
  if (enumValue === TransportationEnum.Cargo) {
    return "화물 운반";
  }
  if (enumValue === TransportationEnum.CallVan) {
    return "콜밴";
  }
  if (enumValue === TransportationEnum.Airplane) {
    return "비행기";
  }
  if (enumValue === TransportationEnum.Ship) {
    return "선박";
  }
  if (enumValue === TransportationEnum.Others) {
    return "기타";
  }
  return "";
};

const evidenceEnumMap = (enumValue?: FixtureEvidenceEnum): string => {
  if (enumValue === FixtureEvidenceEnum.Management) {
    return "관리";
  }
  if (enumValue === FixtureEvidenceEnum.Purchase) {
    return "구매";
  }
  return "";
};

const classEnumMap = (enumValue?: FixtureClassEnum): string => {
  if (enumValue === FixtureClassEnum.Furniture) {
    return "가구";
  }
  if (enumValue === FixtureClassEnum.Software) {
    return "소프트웨어";
  }
  if (enumValue === FixtureClassEnum.Electronics) {
    return "전자기기";
  }
  if (enumValue === FixtureClassEnum.MusicalInstruments) {
    return "악기";
  }
  if (enumValue === FixtureClassEnum.Others) {
    return "기타";
  }
  return "";
};

export { transportationEnumMap, evidenceEnumMap, classEnumMap };
