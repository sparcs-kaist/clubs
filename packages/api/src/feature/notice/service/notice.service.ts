import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import axios from "axios";

import type { ApiNtc001ResponseOK } from "@clubs/interface/api/notice/endpoint/apiNtc001";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import logger from "@sparcs-clubs/api/common/util/logger";
import { forEachAsyncSequentially } from "@sparcs-clubs/api/common/util/util";
import { NoticeRepository } from "@sparcs-clubs/api/feature/notice/repository/notice.repository";
import { parseNaverNoticePage } from "@sparcs-clubs/api/feature/notice/util/naver-notice";

const maxAttempts = 10;
const userDisplay = 50;

export interface PostCrawlResult {
  // 네이버 카페에서 공지사항 글을 구분하는 고유한 번호
  articleId: number;
  author: string;
  title: string;
  date: string;
  link: string;
}

const UpdatePeriodEnum = {
  After3Pages: -10,
  Among3Pages: -5,
} as const;

type UpdatePeriodEnum =
  (typeof UpdatePeriodEnum)[keyof typeof UpdatePeriodEnum];

function findArticleId(link: string): number {
  const match = link.match(/(?:articleid=|\/articles\/)([0-9]+)/i);
  return Number(match?.[1] ?? -1);
}
@Injectable()
export class NoticeService {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly noticeRepository: NoticeRepository) {}

  private async tryFetch(pageNum: number) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await axios.get<unknown>(
          "https://apis.naver.com/cafe-web/cafe-boardlist-api/v1/cafes/26985838/menus/1/articles",
          {
            params: {
              page: pageNum,
              pageSize: userDisplay,
              sortBy: "TIME",
              viewType: "L",
            },
            headers: { Referer: "https://cafe.naver.com/" },
            timeout: 5000,
          },
        );
        return parseNaverNoticePage(response.data);
      } catch (error) {
        if (attempt === maxAttempts - 1) throw error;
      }
    }
    throw new Error("Failed to fetch Naver notices");
  }

  async crawlNotices(maxPages: number): Promise<PostCrawlResult[]> {
    try {
      const posts = new Map<number, PostCrawlResult>();
      for (let page = 1; page <= maxPages; page += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await this.tryFetch(page);
        const previousSize = posts.size;
        result.posts.forEach(post => posts.set(post.articleId, post));
        if (posts.size === previousSize) {
          throw new Error(`Notice crawl made no progress on page ${page}`);
        }
        // Naver exposes navigation in blocks of ten pages, not a total count.
        const reachedLastPage = page >= result.lastNavigationPageNumber;
        const hasNext = result.visibleNextButton;
        if (reachedLastPage && !hasNext) break;
      }
      return [...posts.values()];
    } catch (error) {
      logger.error("Error during scraping and saving:", error);
      throw error;
    }
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

    const updates: (PostCrawlResult & { id: number; createdAt: Date })[] = [];
    const inserts: PostCrawlResult[] = [];
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
        createdAt: this.clock.now(),
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
      date: this.clock.now(),
      link: "",
      createdAt: this.clock.now(),
      author: "Notice Cron",
      title: `Notices Last Update TIme(~3)=${this.clock.now()}`,
    });
    if (isAfter3Pages) {
      await this.noticeRepository.create({
        articleId: UpdatePeriodEnum.Among3Pages,
        date: this.clock.now(),
        link: "",
        createdAt: this.clock.now(),
        author: "Notice Cron",
        title: `Notices Last Update TIme(4~)=${this.clock.now()}`,
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
      const time = this.clock.now();
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
