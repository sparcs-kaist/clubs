import { QueryClient, QueryObserver } from "@tanstack/react-query";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getClubRegistrationRedirectPath } from "./getClubRegistrationRedirectPath.ts";

type RegistrationData = { registrations: { id: number }[] };

describe("getClubRegistrationRedirectPath", () => {
  const cases = [
    { name: "deleted application", cached: [1], fresh: [], path: null },
    {
      name: "newly submitted application",
      cached: [],
      fresh: [2],
      path: "/my/register-club/2",
    },
    { name: "failed refetch", cached: [1], fresh: null, path: null },
    {
      name: "multiple applications",
      cached: [1],
      fresh: [1, 2],
      path: "/my",
    },
  ];

  cases.forEach(({ name, cached, fresh, path }) => {
    it(`uses the fresh result for ${name}`, async t => {
      const client = new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: false } },
      });
      const queryKey = [name];
      client.setQueryData(queryKey, {
        registrations: cached.map(id => ({ id })),
      });
      const request = Promise.withResolvers<RegistrationData>();
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: () => request.promise,
        refetchOnMount: "always",
      });

      assert.equal(
        getClubRegistrationRedirectPath(observer.getCurrentResult()),
        null,
      );
      const unsubscribe = observer.subscribe(() => {});
      t.after(() => {
        unsubscribe();
        client.clear();
      });
      assert.equal(observer.getCurrentResult().isFetching, true);
      assert.equal(
        getClubRegistrationRedirectPath(observer.getCurrentResult()),
        null,
      );

      const settled = observer.refetch({ cancelRefetch: false });
      if (fresh === null) request.reject(new Error("Request failed"));
      else request.resolve({ registrations: fresh.map(id => ({ id })) });
      const result = await settled;

      assert.equal(result.isFetchedAfterMount, true);
      assert.equal(result.isFetching, false);
      assert.equal(result.isError, fresh === null);
      if (fresh === null) {
        assert.deepEqual(result.data, { registrations: [{ id: 1 }] });
      }
      assert.equal(getClubRegistrationRedirectPath(result), path);
    });
  });

  it("waits for a later refetch after a successful mount fetch", async t => {
    const client = new QueryClient();
    let response = Promise.resolve({ registrations: [{ id: 1 }] });
    const observer = new QueryObserver(client, {
      queryKey: ["later refetch"],
      queryFn: () => response,
      refetchOnMount: "always",
    });
    const unsubscribe = observer.subscribe(() => {});
    t.after(() => {
      unsubscribe();
      client.clear();
    });
    await observer.refetch({ cancelRefetch: false });
    assert.equal(
      getClubRegistrationRedirectPath(observer.getCurrentResult()),
      "/my/register-club/1",
    );

    const request = Promise.withResolvers<RegistrationData>();
    response = request.promise;
    const settled = observer.refetch();
    assert.equal(observer.getCurrentResult().isFetchedAfterMount, true);
    assert.equal(observer.getCurrentResult().isFetching, true);
    assert.equal(
      getClubRegistrationRedirectPath(observer.getCurrentResult()),
      null,
    );
    request.resolve({ registrations: [] });
    assert.equal(getClubRegistrationRedirectPath(await settled), null);
  });

  it("redirects pending, approved, and rejected applications alike", () => {
    [1, 2, 3].forEach(registrationStatusEnum => {
      const data = { registrations: [{ id: 1, registrationStatusEnum }] };
      assert.equal(
        getClubRegistrationRedirectPath({
          data,
          isFetchedAfterMount: true,
          isFetching: false,
          isError: false,
        }),
        "/my/register-club/1",
      );
    });
  });
});
