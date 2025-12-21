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
        const nameRawToken = $(el).find('td[height="30"]');
        const nameRaw = nameRawToken.text().trim();
        if (!nameRaw) continue;

        // Extract Link for Detail Page
        const linkHref = nameRawToken.find('a').attr('href'); // e.g., /html/fund/?o=v&no=2248&l=&page=1
        
        const tds = $(el).find('td');
        const scheduleRaw = $(tds[1]).text().trim();
        const offerPriceRaw = $(tds[2]).text().trim();
        const bandPriceRaw = $(tds[3]).text().trim();
        const competitionRaw = $(tds[4]).text().trim();
        const underwriter = $(tds[5]).text().trim();

        const name = nameRaw.replace('(유)', '').replace('(주)', '').trim();
        const [subStart, subEnd] = this.parseDateRange(scheduleRaw);
        const offerPrice = this.parsePrice(offerPriceRaw);
        const { bandLow, bandHigh } = this.parseBandPrice(bandPriceRaw);

        // Fetch Detail Page if link exists
        let detailData: { lockupRate: string | null; circulatingSupply: string | null; otcPrice: string | null; competition: string | null; refundDate: Date | null; listDate: Date | null } = { lockupRate: null, circulatingSupply: null, otcPrice: null, competition: null, refundDate: null, listDate: null };
        if (linkHref) {
            try {
                const detailUrl = `http://www.38.co.kr${linkHref}`;
                detailData = await this.fetchDetail(detailUrl);
            } catch (err) {
                this.logger.warn(`Failed to fetch detail for ${name}: ${err.message}`);
            }
        }

        // Use fallback competition if original is empty
        const finalCompetition = (competitionRaw && competitionRaw !== '-') ? competitionRaw : (detailData.competition || competitionRaw);

        // DB Upsert
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
              competition: finalCompetition,
              underwriter,
              lockupRate: detailData.lockupRate,
              circulatingSupply: detailData.circulatingSupply,
              otcPrice: detailData.otcPrice,
              refundDate: detailData.refundDate,
              listDate: detailData.listDate,
            },
            create: {
              name,
              subStart,
              subEnd,
              offerPrice,
              bandLow,
              bandHigh,
              competition: finalCompetition,
              underwriter,
              lockupRate: detailData.lockupRate,
              circulatingSupply: detailData.circulatingSupply,
              otcPrice: detailData.otcPrice,
              refundDate: detailData.refundDate,
              listDate: detailData.listDate,
            },
          });
          count++;
        } catch (e) {

          this.logger.error(`Failed to upsert ${name}: ${e.message}`);
        }
        
        // Politeness delay
        await new Promise(resolve => setTimeout(resolve, 200)); 
      }

      this.logger.log(`Crawled and processed ${count} items.`);
      return { count, message: 'Crawl successful' };

    } catch (error) {
      this.logger.error('Crawling failed', error);
      throw error;
    }
  }

  async fetchDetail(url: string): Promise<{ lockupRate: string | null, circulatingSupply: string | null, otcPrice: string | null, competition: string | null, refundDate: Date | null, listDate: Date | null }> {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = iconv.decode(Buffer.from(response.data), 'EUC-KR');
      const $ = cheerio.load(html);

      // 1. Lockup Rate (의무보유확약)
      let lockupRate: string | null = null;
      $('td').each((i, el) => {
          if ($(el).text().includes('의무보유확약')) {
              const nextTd = $(el).next('td');
              const val = nextTd.text().trim();
              if (val && val !== '-') {
                  lockupRate = val;
              }
          }
      });
      
      // 1.1 Competition (Fallback if missing in list)
      let competition: string | null = null;
      $('td').each((i, el) => {
          if ($(el).text().includes('기관경쟁률')) {
              const nextTd = $(el).next('td');
              const val = nextTd.text().trim();
              if (val && val !== '-') {
                  competition = val;
              }
          }
      });

      // 1.2 Refund Date (환불일) and Listing Date (상장일)
      let refundDate: Date | null = null;
      let listDate: Date | null = null;
      $('td').each((i, el) => {
          const txt = $(el).text().trim();
          if (txt === '환불일') {
              const nextTd = $(el).next('td');
              const dateStr = nextTd.text().trim();
              refundDate = this.parseSingleDate(dateStr);
          }
          if (txt === '상장일') {
              const nextTd = $(el).next('td');
              const dateStr = nextTd.text().trim();
              listDate = this.parseSingleDate(dateStr);
          }
      });
      
      // 2. Circulating Supply (유통가능물량) - in 억 format
      let circulatingSupply: string | null = null;
      // First, get the confirmed offer price for calculation
      let offerPriceNum: number | null = null;
      $('td').each((i, el) => {
          if ($(el).text().includes('확정공모가')) {
              const nextTd = $(el).next('td');
              const priceText = nextTd.text().replace(/[^\d]/g, '');
              if (priceText) {
                  offerPriceNum = parseInt(priceText, 10);
                  return false;
              }
          }
      });

      const leafTables = $('table:not(:has(table))');
      leafTables.each((i, table) => {
        const text = $(table).text().replace(/\s+/g, ' ');
        // Check for key headers in the table
        if (text.includes('주주명') && text.includes('지분율')) {
            const rows = $(table).find('tr');
            const totalRow = rows.filter((j, r) => {
                const rowText = $(r).text().trim();
                return rowText.includes('계') || rowText.includes('합계') || rowText.includes('소 계');
            }).last();
            
            if (totalRow.length > 0) {
                const tds = totalRow.find('td');
                // Find the circulating supply count (유통가능물량 주식수)
                // Usually it's before the percentage column
                for (let k = tds.length - 1; k >= 0; k--) {
                    const txt = $(tds[k]).text().trim();
                    if (txt.includes('%')) {
                        // Found percentage, now look for the count before it
                        if (k > 0) {
                            const countVal = $(tds[k - 1]).text().trim().replace(/,/g, '');
                            if (/^\d+$/.test(countVal) && offerPriceNum) {
                                const count = parseInt(countVal, 10);
                                const amountInOk = (count * offerPriceNum) / 100000000; // 억 단위
                                circulatingSupply = `${amountInOk.toFixed(0)}억 (${txt})`;
                            } else if (/^\d+$/.test(countVal)) {
                                // No offer price, just show count
                                const countNum = parseInt(countVal, 10);
                                circulatingSupply = `${(countNum / 10000).toFixed(0)}만주 (${txt})`;
                            } else {
                                circulatingSupply = txt;
                            }
                        } else {
                            circulatingSupply = txt;
                        }
                        return false; 
                    }
                }
            }
        }
      });

      // 3. OTC Price (장외가) - "삽니다" Table
      let otcPrice: string | null = null;
      $('td').each((i, el) => {
          const txt = $(el).text().trim();
          if (txt === '삽니다 (가격참고)') {
              const table = $(el).closest('table');
              const rows = table.find('tr');
              if (rows.length > 1) {
                   rows.each((j, row) => {
                       const tds = $(row).find('td');
                       const firstText = $(tds[0]).text().trim();
                       if (firstText.includes('삽니다') || firstText.includes('희망가격')) return;

                       if (tds.length >= 2) {
                           const priceRaw = $(tds[1]).text().trim();
                           // Strict regex: start to end, digits and commas only.
                           // Maybe allow '원' if present? usually not.
                           if (/^[\d,]+$/.test(priceRaw)) {
                               otcPrice = priceRaw;
                               return false; 
                           }
                       }
                   });
              }
              if (otcPrice) return false;
          }
      });
      
      return { lockupRate, circulatingSupply, otcPrice, competition, refundDate, listDate };
  }

  // Helper to parse single date like "2025.12.22"
  private parseSingleDate(raw: string): Date | null {
      const cleaned = raw.trim();
      const match = cleaned.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
      if (match) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const day = parseInt(match[3], 10);
          return new Date(year, month, day);
      }
      return null;
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
