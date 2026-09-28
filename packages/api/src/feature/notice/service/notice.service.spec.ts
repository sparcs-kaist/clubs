import axios from "axios";

import { NoticeService } from "./notice.service";

jest.mock("axios");
jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

const get = jest.mocked(axios.get);
const publishedAt = "2026-09-21T15:00:00.000Z";
const now = new Date("2026-09-22T03:00:00.000Z");
const link = (id: number) =>
  `https://cafe.naver.com/f-e/cafes/26985838/articles/${id}`;

function page(ids = [123], lastPage = 1, hasNext = false) {
  return {
    data: {
      result: {
        articleList: ids.map(articleId => ({
          type: "ARTICLE",
          item: {
            cafeId: 26985838,
            menuId: 1,
            articleId,
            subject: `공지 ${articleId}`,
            writerInfo: { nickName: "사무국" },
            writeDateTimestamp: Date.parse(publishedAt),
          },
        })),
        pageInfo: {
          lastNavigationPageNumber: lastPage,
          visibleNextButton: hasNext,
        },
      },
    },
  };
}

function createContext() {
  const repository = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue([]),
    put: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue([]),
  };
  const service = new NoticeService(repository as never);
  Object.assign(service, { clock: { now: () => new Date(now) } });
  return { service, repository };
}

describe("NoticeService Naver synchronization", () => {
  beforeEach(() => jest.resetAllMocks());

  it("requests the modern API and preserves the publication timestamp", async () => {
    get.mockResolvedValue(page());
    const { service } = createContext();

    await expect(service.crawlNotices(3)).resolves.toEqual([
      {
        articleId: 123,
        author: "사무국",
        title: "공지 123",
        date: publishedAt,
        link: link(123),
      },
    ]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      "https://apis.naver.com/cafe-web/cafe-boardlist-api/v1/cafes/26985838/menus/1/articles",
      expect.objectContaining({
        params: { page: 1, pageSize: 50, sortBy: "TIME", viewType: "L" },
      }),
    );
  });

  it.each([3, Infinity])(
    "follows navigation ranges up to %s pages",
    async maxPages => {
      get.mockImplementation(async (_url, config) => {
        const current = config!.params.page as number;
        return page([1000 - current], current <= 10 ? 10 : 19, current <= 10);
      });
      const { service } = createContext();
      const count = Math.min(maxPages, 19);

      await expect(service.crawlNotices(maxPages)).resolves.toHaveLength(count);
      expect(get.mock.calls.map(([, config]) => config!.params.page)).toEqual(
        Array.from({ length: count }, (_, index) => index + 1),
      );
    },
  );

  it("deduplicates overlapping articles between pages", async () => {
    get.mockResolvedValueOnce(page([123, 124], 2));
    get.mockResolvedValueOnce(page([124, 125], 2));
    const { service } = createContext();

    const posts = await service.crawlNotices(Infinity);
    expect(posts.map(post => post.articleId).sort()).toEqual([123, 124, 125]);
  });

  it("retries a transient HTTP failure", async () => {
    get.mockRejectedValueOnce(new Error("timeout")).mockResolvedValue(page());
    const { service } = createContext();
    await expect(service.crawlNotices(3)).resolves.toHaveLength(1);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("does not write notices or success markers after all HTTP retries fail", async () => {
    get.mockRejectedValue(new Error("unavailable"));
    const { service, repository } = createContext();

    await expect(service.updateNotices(3)).rejects.toThrow();
    expect(get).toHaveBeenCalledTimes(10);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.put).not.toHaveBeenCalled();
    expect(repository.patch).not.toHaveBeenCalled();
  });

  it.each([
    [
      "redirect HTML",
      "<script>top.location.replace('/f-e/cafes/26985838')</script>",
    ],
    ["invalid response", { result: {} }],
    ["empty articles", page([]).data],
  ])("does not record success for %s", async (_name, data) => {
    get.mockResolvedValue({ data });
    const { service, repository } = createContext();

    await expect(service.updateNotices(3)).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.put).not.toHaveBeenCalled();
    expect(repository.patch).not.toHaveBeenCalled();
  });

  it.each([{ ids: [] }, { ids: [123] }])(
    "does not save a partial crawl when page two adds no articles: %j",
    async ({ ids }) => {
      get.mockResolvedValueOnce(page([123], 2));
      get.mockResolvedValueOnce(page(ids, 2));
      const { service, repository } = createContext();

      await expect(service.updateNotices(Infinity)).rejects.toThrow();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.put).not.toHaveBeenCalled();
      expect(repository.patch).not.toHaveBeenCalled();
    },
  );

  it.each([
    "https://cafe.naver.com/ArticleRead.nhn?clubid=26985838&articleid=123",
    link(123),
  ])("recognizes existing articles linked as %s", async existingLink => {
    get.mockResolvedValue(page());
    const { service, repository } = createContext();
    repository.find.mockResolvedValue([
      {
        id: 1,
        articleId: 123,
        title: "공지 123",
        link: existingLink,
        createdAt: now,
      },
    ]);

    await service.updateNotices(3);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: -5 }),
    );
    expect(repository.put).not.toHaveBeenCalled();
    expect(repository.patch).not.toHaveBeenCalled();
  });

  it("records both full-sync markers only after storing articles", async () => {
    get.mockResolvedValue(page());
    const { service, repository } = createContext();

    await service.updateNotices(Infinity);
    expect(
      repository.create.mock.calls.map(([post]) => post.articleId),
    ).toEqual([123, -10, -5]);
    expect(repository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ date: new Date(publishedAt), link: link(123) }),
    );
  });

  it("does not record success when storing an article fails", async () => {
    get.mockResolvedValue(page());
    const { service, repository } = createContext();
    repository.create.mockRejectedValueOnce(new Error("write failed"));

    await expect(service.updateNotices(3)).rejects.toThrow("write failed");
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: 123 }),
    );
  });
});
