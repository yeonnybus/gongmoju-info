import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly TARGET_URL = 'http://www.38.co.kr/html/fund/index.htm?o=k'; // 공모주 청약일정 (o=k)

  async scrapeIpoList() {
    this.logger.log(`Starting crawl from ${this.TARGET_URL}...`);

    try {
      // 1. Fetch HTML (Binary for EUC-KR decoding)
      const response = await axios.get(this.TARGET_URL, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      // 2. Decode EUC-KR
      const html = iconv.decode(Buffer.from(response.data), 'EUC-KR');

      // 3. Load into Cheerio
      const $ = cheerio.load(html);
      const ipoList: any[] = [];

      // 4. Select Table Rows
      // 38.co.kr structure: The main table usually has specific formatting.
      // We look for the table row that contains IPO data. 
      // This selector might need adjustment if site layout changes.
      $('table[summary="공모주 청약일정"] tbody tr').each((i, el) => {
        // Skip header or spacer rows if valid data is missing
        const name = $(el).find('td[height="30"]').text().trim();
        if (!name) return;

        const tds = $(el).find('td');
        
        // Parsing logic for o=k (공모주 청약일정)
        // 0: 종목명, 1: 공모주일정, 2: 확정공모가, 3: 희망공모가, 4: 청약경쟁률, 5: 주간사
        
        const scheduleRaw = $(tds[1]).text().trim(); // "2023.12.19~12.20"
        const offerPrice = $(tds[2]).text().trim();
        const bandPrice = $(tds[3]).text().trim();
        const competition = $(tds[4]).text().trim();
        const underwriter = $(tds[5]).text().trim();

        // Extract Dates
        const [subStart, subEnd] = this.parseDates(scheduleRaw);

        ipoList.push({
          name: name.replace('(유)', '').replace('(주)', '').trim(), // Remove noisy prefixes
          subStart,
          subEnd,
          offerPrice,
          bandPrice,
          competition,
          underwriter,
        });
      });

      this.logger.log(`Crawled ${ipoList.length} items.`);
      return ipoList;

    } catch (error) {
      this.logger.error('Crawling failed', error);
      throw error;
    }
  }

  private parseDates(raw: string): [string | null, string | null] {
    if (!raw.includes('~')) return [null, null];
    
    // Example: "2023.12.19~12.20"
    const parts = raw.split('~');
    const startRaw = parts[0].trim(); // 2023.12.19
    let endRaw = parts[1].trim();     // 12.20 (Year might be missing)

    // Basic ISO format conversion could be added here
    return [startRaw, endRaw];
  }
}
