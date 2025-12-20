import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly TARGET_URL = 'http://www.38.co.kr/html/fund/index.htm?o=k'; // 공모주 청약일정 (o=k)

  constructor(private readonly prisma: PrismaService) {}

  async scrapeIpoList() {
    this.logger.log(`Starting crawl from ${this.TARGET_URL}...`);

    try {
      const response = await axios.get(this.TARGET_URL, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const html = iconv.decode(Buffer.from(response.data), 'EUC-KR');
      const $ = cheerio.load(html);
      
      let count = 0;

      const rows = $('table[summary="공모주 청약일정"] tbody tr');
      for (let i = 0; i < rows.length; i++) {
        const el = rows[i];
        const nameRaw = $(el).find('td[height="30"]').text().trim();
        if (!nameRaw) continue;

        const tds = $(el).find('td');
        const scheduleRaw = $(tds[1]).text().trim(); // "2023.12.19~12.20"
        const offerPriceRaw = $(tds[2]).text().trim();
        const bandPriceRaw = $(tds[3]).text().trim(); // "2,000~2,500"
        const competitionRaw = $(tds[4]).text().trim();
        const underwriter = $(tds[5]).text().trim();

        // 1. Name Cleaning
        const name = nameRaw.replace('(유)', '').replace('(주)', '').trim();

        // 2. Date Parsing
        const [subStart, subEnd] = this.parseDateRange(scheduleRaw);

        // 3. Price Parsing
        const offerPrice = this.parsePrice(offerPriceRaw);
        const { bandLow, bandHigh } = this.parseBandPrice(bandPriceRaw);

        // 4. DB Upsert
        // Skip if name is empty
        if (!name) continue;

        try {
          await this.prisma.ipo.upsert({
            where: { name },
            update: {
              subStart,
              subEnd,
              offerPrice,
              bandLow,
              bandHigh,
              competition: competitionRaw,
              underwriter,
            },
            create: {
              name,
              subStart,
              subEnd,
              offerPrice,
              bandLow,
              bandHigh,
              competition: competitionRaw,
              underwriter,
            },
          });
          count++;
        } catch (e) {
          this.logger.error(`Failed to upsert ${name}: ${e.message}`);
        }
      }

      this.logger.log(`Crawled and processed ${count} items.`);
      return { count, message: 'Crawl successful' };

    } catch (error) {
      this.logger.error('Crawling failed', error);
      throw error;
    }
  }

  // --- Helper Methods ---

  private parseDateRange(raw: string): [Date | null, Date | null] {
    if (!raw.includes('~')) return [null, null];
    
    // Example: "2023.12.19~12.20" OR "2024.01.20~01.21"
    const parts = raw.split('~');
    const startStr = parts[0].trim(); 
    let endStr = parts[1].trim();

    // Parse Start Date (Expects YYYY.MM.DD)
    const startDate = this.parseDateString(startStr);
    
    // Parse End Date (Might be MM.DD or YYYY.MM.DD)
    let endDate: Date | null = null;
    if (startDate) {
        // If end string is short (e.g. "12.20"), prepend the year from start date
        if (endStr.length <= 5 && !endStr.includes(startDate.getFullYear().toString())) {
             // Handle year rollover (Dec -> Jan)? 
             // Usually 38.co.kr format implies same year unless specified, 
             // but strictly speaking if start is Dec and end is Jan, end year should be next year.
             // For now simple prepend:
             endDate = this.parseDateString(`${startDate.getFullYear()}.${endStr}`);
             
             // Simple rollover check: if end month < start month, add 1 year
             if (endDate && endDate < startDate) {
                 endDate.setFullYear(endDate.getFullYear() + 1);
             }
        } else {
             endDate = this.parseDateString(endStr);
        }
    }

    return [startDate, endDate];
  }

  private parseDateString(str: string): Date | null {
      // Basic parser for YYYY.MM.DD
      const parts = str.split('.');
      if (parts.length < 2) return null;
      
      let year = new Date().getFullYear();
      let month = 0;
      let day = 1;

      if (parts.length === 3) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
      } else if (parts.length === 2) {
           // Assume current year if missing? Or handled by caller.
           month = parseInt(parts[0], 10) - 1;
           day = parseInt(parts[1], 10);
      }

      const date = new Date(year, month, day);
      // Validate
      if (isNaN(date.getTime())) return null;
      return date;
  }

  private parsePrice(raw: string): number | null {
      if (!raw || raw === '-') return null;
      return parseInt(raw.replace(/,/g, ''), 10) || null;
  }

  private parseBandPrice(raw: string): { bandLow: number | null, bandHigh: number | null } {
      if (!raw || !raw.includes('~')) return { bandLow: null, bandHigh: null };
      const parts = raw.split('~');
      return {
          bandLow: this.parsePrice(parts[0]),
          bandHigh: this.parsePrice(parts[1]),
      };
  }
}
