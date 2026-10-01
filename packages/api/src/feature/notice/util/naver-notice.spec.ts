import { parseNaverNoticePage } from "./naver-notice";

const article = {
  articleId: 34676,
  cafeId: 26985838,
  menuId: 1,
  subject: "2026 가을학기 회원 등록 안내",
  headName: "사무국",
  writerInfo: { nickName: "작성자" },
  writeDateTimestamp: Date.parse("2026-09-15T04:48:40.183Z"),
};

const page = (item: unknown = article) => ({
  result: {
    articleList: [
      { type: "AD", item: {} },
      { type: "ARTICLE", item },
    ],
    pageInfo: { lastNavigationPageNumber: 10, visibleNextButton: true },
  },
});

describe("parseNaverNoticePage", () => {
  it("reads articles, headings and navigation while ignoring ads", () => {
    expect(parseNaverNoticePage(page())).toEqual({
      posts: [
        {
          articleId: 34676,
          title: "[사무국] 2026 가을학기 회원 등록 안내",
          author: "작성자",
          date: "2026-09-15T04:48:40.183Z",
          link: "https://cafe.naver.com/f-e/cafes/26985838/articles/34676",
        },
      ],
      lastNavigationPageNumber: 10,
      visibleNextButton: true,
    });
  });

  it.each([undefined, null, ""])("handles an absent heading: %s", headName => {
    const { posts } = parseNaverNoticePage(
      page({ ...article, headName, subject: "  공지\n  제목  " }),
    );
    expect(posts[0].title).toBe("공지 제목");
  });

  it.each(["2026-09-14T14:59:59.000Z", "2026-09-14T15:00:00.000Z"])(
    "preserves the UTC instant at the KST date boundary: %s",
    timestamp => {
      const { posts } = parseNaverNoticePage(
        page({ ...article, writeDateTimestamp: Date.parse(timestamp) }),
      );
      expect(posts[0].date).toBe(timestamp);
    },
  );

  it.each([
    { articleId: -1 },
    { articleId: 1.5 },
    { cafeId: 1 },
    { menuId: 2 },
    { subject: " " },
    { subject: "a".repeat(255) },
    { writerInfo: { nickName: "" } },
    { writerInfo: { nickName: "a".repeat(31) } },
    { writeDateTimestamp: "2026-09-15" },
    { writeDateTimestamp: -1 },
    { writeDateTimestamp: 1e20 },
  ])("rejects an invalid article rather than skipping it: %j", invalid => {
    expect(() =>
      parseNaverNoticePage(page({ ...article, ...invalid })),
    ).toThrow();
  });

  it.each([
    "<script>top.location.replace('/f-e/cafes/26985838/menus/1')</script>",
    { error: { message: "Access denied" } },
    { result: { articleList: [] } },
    {
      result: {
        articleList: [],
        pageInfo: { lastNavigationPageNumber: 0, visibleNextButton: false },
      },
    },
  ])("rejects a non-list response: %j", response => {
    expect(() => parseNaverNoticePage(response)).toThrow();
  });
});
