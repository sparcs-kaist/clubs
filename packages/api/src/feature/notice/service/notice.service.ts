import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import jsdom from "jsdom";

import type { ApiNtc001ResponseOK } from "@clubs/interface/api/notice/endpoint/apiNtc001";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import logger from "@sparcs-clubs/api/common/util/logger";
import { forEachAsyncSequentially } from "@sparcs-clubs/api/common/util/util";
import { NoticeRepository } from "@sparcs-clubs/api/feature/notice/repository/notice.repository";

const urlPrefix = "https://cafe.naver.com/kaistclubs";
const maxAttempts = 10;
const userDisplay = 50;

export interface PostCrawlResult {
  // 네이버 블로그에서 공지사항 글을 구분하는 고유한 번호
  articleId: number;
  author: string;
  title: string;
  date: string;
  link: string;
}

enum UpdatePeriodEnum {
  After3Pages = -10,
  Among3Pages = -5,
}

function findArticleId(link: string): number {
  const match = link.match(/articleid=[0-9]+/i);
  if (match) {
    return Number.parseInt(match[0].replace("articleid=", ""));
  }

  return -1;
}
@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  private async tryFetch(pageNum: number): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await axios.get(
          `https://cafe.naver.com/kaistclubs/ArticleList.nhn?search.clubid=26985838&search.menuid=1&search.boardtype=L&userDisplay=${userDisplay}&search.page=${pageNum}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134",
            },
            timeout: 5000, // 5초 후에 요청 타임아웃
            responseType: "arraybuffer", // Make sure the raw data is returned
            responseEncoding: "arraybuffer",
          },
        );
        const decoder = new TextDecoder("EUC-KR");
        return decoder.decode(response.data);
      } catch (error) {
        if (attempt > maxAttempts) {
          throw error;
        }
      }
    }
    return Promise.reject();
  }

  private getPostsFromHTML(html: string): PostCrawlResult[] {
    const { window } = new jsdom.JSDOM(html);
    const posts: PostCrawlResult[] = [];
    const rows = window.document.querySelectorAll("tr");
    rows.forEach(element => {
      const titleElement = element.querySelector(".article");
      if (titleElement !== null) {
        let title = titleElement.textContent;
        title = title.replace(/\s+/g, " ").trim();
        const link = urlPrefix + titleElement.getAttribute("href");
        const articleId = findArticleId(link);

        let author = element.querySelector(".td_name .p-nick a").textContent;
        author = author.replace(/\s+/g, " ").trim();

        let date = element.querySelector(".td_date").textContent;
        date = date.replace(/\s+/g, " ").trim();

        // 시간만 제공되는 경우 오늘 날짜로 설정
        if (date.includes(":")) {
          const kstDate = new Date();
          const mm = kstDate.getMonth() + 1;
          const dd = kstDate.getDate();
          date = `${kstDate.getFullYear()}.${(mm > 9 ? "" : "0") + mm}.${(dd > 9 ? "" : "0") + dd}.`;
        }
        if (title && author && date && link) {
          if (posts.every(post => post.articleId !== articleId)) {
            posts.unshift({ title, author, date, link, articleId });
          }
        }
      }
    });
    return posts;
  }

  private determinePagesToCrawl(
    totalCount: number,
    maxPages: number,
  ): number[] {
    const totalPages = Math.ceil(totalCount / userDisplay);
    const untilPage = Math.min(totalPages, maxPages);
    const result = [];
    // 모든 페이지 크롤링
    for (let page = 2; page <= untilPage; page += 1) {
      result.push(page);
    }
    return result;
  }

  async crawlNotices(maxPages: number): Promise<PostCrawlResult[]> {
    try {
      let pagenum = 1;
      // 1페이지는 항상 크롤링
      const html = await this.tryFetch(pagenum);
      // 공지가 총 몇 개 있는지
      let totalCount = Number.parseInt(
        html
          .match(/search\.totalCount=[0-9]+(?=&)/)[0]
          .replace("search.totalCount=", ""),
      );
      const posts = this.getPostsFromHTML(html);

      // 1페이지에서는 공지개수가 짤려서 나옴
      // 501개, 1001개처럼 500n+1 형태
      // 마지막 페이지까지 가봐야 함
      while (totalCount % 500 === 1) {
        pagenum += 10;
        if (pagenum > maxPages) {
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        const nextPage = await this.tryFetch(pagenum);
        totalCount = Number.parseInt(
          nextPage
            .match(/search\.totalCount=[0-9]+(?=&)/)[0]
            .replace("search.totalCount=", ""),
        );
      }
      const postOfPages = await Promise.all(
        this.determinePagesToCrawl(totalCount, maxPages).map(page =>
          this.tryFetch(page).then(this.getPostsFromHTML),
        ),
      );

      postOfPages.forEach(postOfPage => {
        const ids = posts.map(post => post.articleId);
        posts.unshift(
          ...postOfPage.filter(post => !ids.includes(post.articleId)),
        );
        // 중복 제거
      });

      return posts;
    } catch (error) {
      logger.error("Error during scraping and saving:", error);
    }
    return [];
  }

  async updateNotices(maxPages: number) {
    const noticesFromDB = (
      await this.noticeRepository.find({ articleId: { gt: 0 } })
    ).map(e => ({
      createdAt: e.createdAt,
      author: e.author,
      title: e.title,
      link: e.link,
      date: e.date,
      id: e.id,
      articleId: findArticleId(e.link),
      articleIdFromDB: e.articleId,
    }));
    const crawlResults = await this.crawlNotices(maxPages);

    const updates = [];
    const inserts = [];
    const deletes = [];

    crawlResults.forEach(crawlResult => {
      const find = noticesFromDB.find(
        e => e.articleId === crawlResult.articleId,
      );
      if (find === undefined) {
        inserts.push(crawlResult);
      } else if (crawlResult.title !== find.title) {
        updates.push({
          ...crawlResult,
          id: find.id,
          createdAt: find.createdAt,
        });
      }
    });

    // 삭제된 글이 있는가?
    if (noticesFromDB.length + inserts.length > crawlResults.length) {
      noticesFromDB.forEach(notice => {
        if (!crawlResults.some(res => res.articleId === notice.articleId)) {
          deletes.push(notice.articleId);
        }
      });
    }

    // articleId가 반영되지 않은 notice가 있다면 patch를 통해 정상화
    // 프로덕션에 올라가거나, DB를 롤백하는 등등 그런 상황을 위해 필요
    const malformedNotices = noticesFromDB.filter(
      notice => notice.articleIdFromDB !== notice.articleId,
    );

    if (malformedNotices.length > 0) {
      await this.noticeRepository.patch(
        {
          id: malformedNotices.map(e => e.id),
        },
        notice => ({
          createdAt: notice.createdAt,
          author: notice.author,
          title: notice.title,
          link: notice.link,
          date: notice.date,
          id: notice.id,
          articleId: findArticleId(notice.link),
        }),
      );
    }

    await forEachAsyncSequentially(inserts, async post => {
      await this.noticeRepository.create({
        title: post.title,
        link: post.link,
        date: new Date(post.date),
        author: post.author,
        articleId: post.articleId,
        createdAt: new Date(),
      });
    });

    await forEachAsyncSequentially(updates, async post => {
      await this.noticeRepository.put({
        id: post.id,
        title: post.title,
        link: post.link,
        date: new Date(post.date),
        author: post.author,
        createdAt: post.createdAt,
        articleId: post.articleId,
      });
    });

    const isAfter3Pages: boolean = maxPages > 3;
    const negativePeriod = isAfter3Pages
      ? UpdatePeriodEnum.After3Pages
      : UpdatePeriodEnum.Among3Pages;

    // articleId를 음수로 해서 로그를 남깁니다.
    await this.noticeRepository.create({
      articleId: negativePeriod,
      date: new Date(),
      link: "",
      createdAt: new Date(),
      author: "Notice Cron",
      title: `Notices Last Update TIme(~3)=${new Date()}`,
    });
    if (isAfter3Pages) {
      await this.noticeRepository.create({
        articleId: UpdatePeriodEnum.Among3Pages,
        date: new Date(),
        link: "",
        createdAt: new Date(),
        author: "Notice Cron",
        title: `Notices Last Update TIme(4~)=${new Date()}`,
      });
    }
  }

  async getLastUpdateTime(pageOffset: number, itemCount: number) {
    const isAfter3Pages: boolean = pageOffset + itemCount > 3 * userDisplay;
    const negativePeriod = isAfter3Pages
      ? UpdatePeriodEnum.After3Pages
      : UpdatePeriodEnum.Among3Pages;
    const lastUpdateRow = await this.noticeRepository.find({
      articleId: negativePeriod,
      orderBy: {
        createdAt: OrderByTypeEnum.DESC,
      },
      pagination: {
        itemCount: 1,
        offset: 1,
      },
    });
    if (lastUpdateRow.length === 0) {
      const time = new Date();
      time.setTime(time.getTime() + 600000 * negativePeriod);
      return time;
    }

    // 그냥 lastUpdateRow[0].date로 하려고 했는데 그러면 날짜만 남고 시간이 짤려서 이렇게 했습니다
    return new Date(lastUpdateRow[0].title.split("=")[1]);
  }

  async getNotices(pageOffset: number, itemCount: number) {
    const notices = await this.noticeRepository.find({
      articleId: { gt: 0 },
      pagination: {
        offset: pageOffset,
        itemCount,
      },
      orderBy: {
        articleId: OrderByTypeEnum.DESC,
      },
    });

    if (!notices) {
      throw new HttpException(
        "[NoticeService] Error occurs while getting notices",
        HttpStatus.NOT_FOUND,
      );
    }

    const serviceResponse: ApiNtc001ResponseOK = {
      notices,
      total: await this.noticeRepository.count({
        articleId: {
          gt: 0,
        },
      }),
      offset: pageOffset,
      lastUpdateTime: await this.getLastUpdateTime(pageOffset, itemCount),
    };

    return serviceResponse;
  }
}
