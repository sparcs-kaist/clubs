import axios from "axios";
import jsdom from "jsdom";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";

const urlPrefix = "https://cafe.naver.com/kaistclubs";

interface PostCrawlResult {
  author: string;
  title: string;
  date: string;
  link: string;
}

export default async function scrapeAndSave(): Promise<PostCrawlResult[]> {
  try {
    const response = await axios.get(
      "https://cafe.naver.com/kaistclubs/ArticleList.nhn?search.clubid=26985838&search.menuid=1&search.boardtype=L&userDisplay=50",
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

    // Convert from EUC-KR to UTF-8
    const decoder = new TextDecoder("EUC-KR");

    const html = decoder.decode(response.data);
    const { window } = new jsdom.JSDOM(html);

    // const $ = cheerio.load(html);
    // let x = new xml();
    // x.innerHTML
    // const body = document.createElement("body");

    // console.log(html.match(/class="article"/g));

    const posts = [];
    const rows = window.document.querySelectorAll("tr");
    for (let i = 0; i < rows.length; i += 1) {
      const element = rows[i];

      const titleElement = element.querySelector(".article");
      if (titleElement !== null) {
        let title = titleElement.textContent;
        title = title.replace(/\s+/g, " ").trim();
        const link = urlPrefix + titleElement.getAttribute("href");

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
        } else {
          // 연도만 추출
          // const year = date.split(".")[0];
          // 2023년 이전의 데이터를 건너뛰기 -> ???
          // if (Number.parseInt(year) < 2023) {
          //   continue;
          // }
        }
        if (title && author && date && link) {
          posts.push({ title, author, date, link });
        }
      }
    }
    return posts;
  } catch (error) {
    logger.error("Error during scraping and saving:", error);
  }
  return [];
}
