import apiClb011 from "@clubs/interface/api/club/endpoint/apiClb011";
import {
  ClubDelegateChangeRequestStatusEnum as Status,
  ClubDelegateEnum as Role,
} from "@clubs/interface/common/enum/club.enum";

import { ClubDelegateDRepository } from "./club.club-delegate-d.repository";
import ClubDelegateService from "./delegate.service";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const now = new Date("2026-11-23T03:00:00Z");
const clubId = 42;
const old = new Date("2026-11-01T03:00:00Z");
const request = (
  id: number,
  role: Role,
  status: Status,
  deletedAt: Date | null = null,
) => ({
  id,
  clubId,
  prevStudentId: 1,
  studentId: id * 10,
  clubDelegateEnumId: role,
  clubDelegateChangeRequestStatusEnumId: status,
  createdAt: old,
  deletedAt,
});

function fixture() {
  const latest = [
    request(1, Role.Representative, Status.Applied, now),
    request(2, Role.Delegate1, Status.Rejected),
    request(3, Role.Delegate2, Status.Approved),
  ];
  const findMany = jest.fn().mockResolvedValue(latest);
  const delegates = jest.fn().mockResolvedValue([{ studentId: 1 }]);
  const repository = new ClubDelegateDRepository(
    {} as never,
    {
      tx: {
        clubDelegateChangeRequest: { findMany },
        clubDelegateD: { findMany: delegates },
      },
    } as never,
  );
  const contacts = jest.fn().mockResolvedValue(
    [10, 20, 30].map(id => ({
      id,
      number: 20260000 + id,
      name: `학생${id}`,
    })),
  );
  const service = new ClubDelegateService(
    repository,
    { findStudentContacts: contacts } as never,
    {} as never,
    {} as never,
  );
  Object.assign(service, { clock: { now: () => now } });
  const read = () =>
    service.getStudentClubDelegateRequests({ param: { clubId }, studentId: 1 });
  return { repository, findMany, contacts, delegates, read };
}

describe("CLB011 latest request status", () => {
  it("selects the latest request per role including canceled rows before hiding expired pending rows", async () => {
    const { repository, findMany } = fixture();
    findMany.mockResolvedValue([
      request(1, Role.Representative, Status.Applied, now),
      request(2, Role.Delegate1, Status.Applied),
      request(3, Role.Delegate2, Status.Rejected),
    ]);

    expect(
      (await repository.findClubRequests(clubId, now)).map(row => row.id),
    ).toEqual([1, 3]);
    expect(findMany).toHaveBeenCalledWith({
      where: { clubId, clubDelegateEnumId: { in: Object.values(Role) } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      distinct: ["clubDelegateEnumId"],
    });
  });

  it("preserves the stored status and reports cancellation in the serialized contract", async () => {
    const { read } = fixture();

    const response = apiClb011.responseBodyMap[200].parse(
      JSON.parse(JSON.stringify(await read())),
    );

    expect(
      response.requests.map(row => ({
        id: row.id,
        status: row.clubDelegateChangeRequestStatusEnumId,
        isCanceled: row.isCanceled,
      })),
    ).toEqual([
      { id: 1, status: Status.Applied, isCanceled: true },
      { id: 2, status: Status.Rejected, isCanceled: false },
      { id: 3, status: Status.Approved, isCanceled: false },
    ]);
  });

  it("omits a latest request whose student was deleted without reading older requests", async () => {
    const { read, contacts, findMany } = fixture();
    contacts.mockResolvedValue([
      { id: 20, number: 20260020, name: "남은 학생" },
    ]);

    expect((await read()).requests.map(row => row.id)).toEqual([2]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("keeps request history restricted to current club officers", async () => {
    const { read, delegates, findMany } = fixture();
    delegates.mockResolvedValue([]);

    await expect(read()).rejects.toThrow(
      "동아리 임원만 변경 요청을 조회할 수 있습니다.",
    );
    expect(findMany).not.toHaveBeenCalled();
  });
});
