import { z } from "zod";

const articleSchema = z.object({
  articleId: z.coerce.number().int().positive(),
  cafeId: z.literal(26985838),
  menuId: z.literal(1),
  subject: z.string().trim().min(1),
  headName: z.string().nullish(),
  writerInfo: z.object({ nickName: z.string().trim().min(1).max(30) }),
  writeDateTimestamp: z.coerce
    .number()
    .int()
    .nonnegative()
    .transform(timestamp => new Date(timestamp))
    .pipe(z.date()),
});

const pageSchema = z.object({
  result: z.object({
    articleList: z.array(z.object({ type: z.string(), item: z.unknown() })),
    pageInfo: z.object({
      lastNavigationPageNumber: z.coerce.number().int().positive(),
      visibleNextButton: z.boolean(),
    }),
  }),
});

export function parseNaverNoticePage(data: unknown) {
  const { articleList, pageInfo } = pageSchema.parse(data).result;
  const posts = articleList
    .filter(row => row.type === "ARTICLE")
    .map(row => {
      const article = articleSchema.parse(row.item);
      const title =
        `${article.headName ? `[${article.headName}] ` : ""}${article.subject}`
          .replace(/\s+/g, " ")
          .trim();

      return {
        articleId: article.articleId,
        title: z.string().max(255).parse(title),
        author: article.writerInfo.nickName,
        // Prisma converts this UTC instant to KST before storing the DATE column.
        date: article.writeDateTimestamp.toISOString(),
        link: `https://cafe.naver.com/f-e/cafes/26985838/articles/${article.articleId}`,
      };
    });

  return { posts, ...pageInfo };
}
