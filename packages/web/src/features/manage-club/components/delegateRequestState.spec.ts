import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ApiClb008ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb008";
import type { ApiClb011ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb011";
import {
  ClubDelegateChangeRequestStatusEnum as Status,
  ClubDelegateEnum as Role,
} from "@clubs/interface/common/enum/club.enum";

import { getDelegateCandidateItems } from "./delegateCandidates";
import {
  getDelegateRequestNoticeType,
  getDelegateRequestState,
} from "./delegateRequestState";

type DelegateRequest = ApiClb011ResponseOk["requests"][number];

const request = (
  id: number,
  overrides: Partial<DelegateRequest> = {},
): DelegateRequest => ({
  id,
  delegateEnumId: Role.Delegate1,
  studentId: 20,
  studentNumber: 20260020,
  studentName: "홍길동",
  clubDelegateChangeRequestStatusEnumId: Status.Applied,
  isCanceled: false,
  ...overrides,
});

const candidate: ApiClb008ResponseOk["students"][number] = {
  id: 20,
  studentNumber: "20260020",
  name: "홍길동",
  phoneNumber: "010-1234-5678",
  currentRoles: [],
};

describe("delegate request display state", () => {
  it("shows the latest cancellation instead of an older rejection regardless of array order", () => {
    const rejected = request(1, {
      clubDelegateChangeRequestStatusEnumId: Status.Rejected,
    });
    const canceled = request(2, { isCanceled: true });
    [
      [rejected, canceled],
      [canceled, rejected],
    ].forEach(requests => {
      const state = getDelegateRequestState(requests);
      assert.deepEqual(state.latestRequests, [canceled]);
      assert.equal(
        getDelegateRequestNoticeType(state.latestRequests[0]),
        "Canceled",
      );
      assert.deepEqual(state.pendingRequests, []);
      assert.equal(state.pendingStudentIds.size, 0);
    });
  });

  it("allows the canceled candidate to receive a new request", () => {
    const state = getDelegateRequestState([request(1, { isCanceled: true })]);
    const [item] = getDelegateCandidateItems(
      [candidate],
      1,
      Role.Delegate1,
      state.pendingStudentIds,
    );
    assert.equal(item.selectable, true);
  });

  it("shows and blocks a new pending request after cancellation", () => {
    const pending = request(3);
    const state = getDelegateRequestState([
      pending,
      request(1, {
        clubDelegateChangeRequestStatusEnumId: Status.Rejected,
      }),
      request(2, { isCanceled: true }),
    ]);
    assert.deepEqual(state.pendingRequests, [pending]);
    assert.equal(
      getDelegateRequestNoticeType(state.latestRequests[0]),
      "Applied",
    );
    const [item] = getDelegateCandidateItems(
      [candidate],
      1,
      Role.Delegate1,
      state.pendingStudentIds,
    );
    assert.equal(item.selectable, false);
  });

  it("hides an older rejection after the latest request was approved", () => {
    const approved = request(2, {
      clubDelegateChangeRequestStatusEnumId: Status.Approved,
    });
    const state = getDelegateRequestState([
      request(1, {
        clubDelegateChangeRequestStatusEnumId: Status.Rejected,
      }),
      approved,
    ]);
    assert.deepEqual(state.latestRequests, [approved]);
    assert.equal(getDelegateRequestNoticeType(approved), undefined);
    assert.deepEqual(state.pendingRequests, []);
  });

  it("continues to display a latest rejected request without blocking candidates", () => {
    const rejected = request(2, {
      clubDelegateChangeRequestStatusEnumId: Status.Rejected,
    });
    const state = getDelegateRequestState([request(1), rejected]);
    assert.deepEqual(state.latestRequests, [rejected]);
    assert.equal(getDelegateRequestNoticeType(rejected), "Rejected");
    assert.deepEqual(state.pendingRequests, []);
    assert.equal(state.pendingStudentIds.size, 0);
  });

  it("keeps each role's latest state and blocks only its active pending candidate", () => {
    const pending = request(4, {
      delegateEnumId: Role.Representative,
      studentId: 30,
    });
    const canceled = request(5, { isCanceled: true });
    const rejected = request(6, {
      delegateEnumId: Role.Delegate2,
      clubDelegateChangeRequestStatusEnumId: Status.Rejected,
      studentId: 40,
    });
    const state = getDelegateRequestState([
      rejected,
      request(1),
      canceled,
      pending,
    ]);
    assert.equal(state.latestRequests.length, 3);
    assert.deepEqual(state.pendingRequests, [pending]);
    assert.deepEqual([...state.pendingStudentIds], [30]);
    assert.equal(getDelegateRequestNoticeType(canceled), "Canceled");
    assert.equal(getDelegateRequestNoticeType(rejected), "Rejected");
  });

  it("shows no notice or pending candidate when the API omits a role", () => {
    const state = getDelegateRequestState([]);
    assert.deepEqual(state.latestRequests, []);
    assert.deepEqual(state.pendingRequests, []);
    assert.equal(state.pendingStudentIds.size, 0);
    assert.equal(getDelegateRequestNoticeType(undefined), undefined);
  });
});
