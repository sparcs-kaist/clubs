import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import jsdom from "jsdom";

import type { ApiNtc001ResponseOK } from "@sparcs-clubs/interface/api/notice/endpoint/apiNtc001";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { NoticeRepository } from "@sparcs-clubs/api/feature/notice/repository/notice.repository";

const urlPrefix = "https://cafe.naver.com/kaistclubs";
const maxAttempts = 10;
const userDisplay = 50;
export const crawlPeriod = 10 * 60 * 1000; // 10분

export interface PostCrawlResult {
  articleId: number;
  author: string;
  title: string;
  date: string;
  link: string;
}

function findArticleId(link: string): number {
  return Number.parseInt(
    link.match(/articleid=[0-9]+/)[0].replace("articleid=", ""),
  );
}

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepository) {}

  async getAllNotices() {
    return this.noticeRepository.find({
      orderBy: {
        id: OrderByTypeEnum.ASC,
      },
    });
  }

  async getNotices(pageOffset: number, itemCount: number) {
    const notices = await this.noticeRepository.find({
      pagination: {
        offset: pageOffset,
        itemCount,
      },
      orderBy: {
        id: OrderByTypeEnum.ASC,
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
      total: await this.noticeRepository.count({}),
      offset: pageOffset,
    };

    return serviceResponse;
  }

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
          const kstDate = getKSTDate();
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

  private determinePagesToCrawl(_totalCount: number): number[] {
    // const totalPages = Math.ceil(totalCount / userDisplay);
    const result = [];
    // 모든 페이지 크롤링
    // for (let page = 2; page < totalPages; page += 1) {
    for (let page = 2; page < 4; page += 1) {
      result.push(page);
    }
    return result;
  }

  async crawlNotices(): Promise<PostCrawlResult[]> {
    try {
      // 1페이지는 항상 크롤링
      const html = await this.tryFetch(1);
      // 공지가 총 몇 개 있는지
      const totalCount = Number.parseInt(
        html
          .match(/search\.totalCount=[0-9]+(?=&)/)[0]
          .replace("search.totalCount=", ""),
      );

      const posts = this.getPostsFromHTML(html);

      const postOfPages = await Promise.all(
        this.determinePagesToCrawl(totalCount).map(page =>
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

  async updateNotices() {
    const noticesFromDB = (await this.noticeRepository.find({})).map(e => ({
      createdAt: e.createdAt,
      author: e.author,
      title: e.title,
      link: e.link,
      date: e.date,
      id: e.id,
      articleId: findArticleId(e.link),
    }));
    const crawlResults = await this.crawlNotices();

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

    // eslint-disable-next-line no-restricted-syntax
    for await (const post of inserts) {
      await this.noticeRepository.insert({
        title: post.title,
        link: post.link,
        date: new Date(post.date),
        author: post.author,
      });
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const post of updates) {
      await this.noticeRepository.update({
        id: post.id,
        title: post.title,
        link: post.link,
        date: new Date(post.date),
        author: post.author,
        createdAt: post.createdAt,
      });
    }

    // TODO: 쿼리 한번에 처리하기
  }
}
