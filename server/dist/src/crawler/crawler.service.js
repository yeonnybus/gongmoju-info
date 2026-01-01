"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CrawlerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const prisma_service_1 = require("../prisma/prisma.service");
let CrawlerService = CrawlerService_1 = class CrawlerService {
    prisma;
    logger = new common_1.Logger(CrawlerService_1.name);
    TARGET_URL = 'http://www.38.co.kr/html/fund/index.htm?o=k';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scrapeIpoList() {
        this.logger.log(`Starting crawl from ${this.TARGET_URL}...`);
        try {
            const response = await axios_1.default.get(this.TARGET_URL, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            });
            const html = iconv_lite_1.default.decode(Buffer.from(response.data), 'EUC-KR');
            const $ = cheerio.load(html);
            let count = 0;
            const rows = $('table[summary="공모주 청약일정"] tbody tr');
            for (let i = 0; i < rows.length; i++) {
                const el = rows[i];
                const nameRawToken = $(el).find('td[height="30"]');
                const nameRaw = nameRawToken.text().trim();
                if (!nameRaw)
                    continue;
                const linkHref = nameRawToken.find('a').attr('href');
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
                let detailData = { lockupRate: null, circulatingSupply: null, otcPrice: null, competition: null, refundDate: null, listDate: null };
                if (linkHref) {
                    try {
                        const detailUrl = `http://www.38.co.kr${linkHref}`;
                        detailData = await this.fetchDetail(detailUrl);
                    }
                    catch (err) {
                        this.logger.warn(`Failed to fetch detail for ${name}: ${err.message}`);
                    }
                }
                const finalCompetition = (competitionRaw && competitionRaw !== '-') ? competitionRaw : (detailData.competition || competitionRaw);
                if (!name)
                    continue;
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
                }
                catch (e) {
                    this.logger.error(`Failed to upsert ${name}: ${e.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            this.logger.log(`Crawled and processed ${count} items.`);
            return { count, message: 'Crawl successful' };
        }
        catch (error) {
            this.logger.error('Crawling failed', error);
            throw error;
        }
    }
    async fetchDetail(url) {
        const response = await axios_1.default.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        const html = iconv_lite_1.default.decode(Buffer.from(response.data), 'EUC-KR');
        const $ = cheerio.load(html);
        let lockupRate = null;
        $('td').each((i, el) => {
            if ($(el).text().includes('의무보유확약')) {
                const nextTd = $(el).next('td');
                const val = nextTd.text().trim();
                if (val && val !== '-') {
                    lockupRate = val;
                }
            }
        });
        let competition = null;
        $('td').each((i, el) => {
            if ($(el).text().includes('기관경쟁률')) {
                const nextTd = $(el).next('td');
                const val = nextTd.text().trim();
                if (val && val !== '-') {
                    competition = val;
                }
            }
        });
        let refundDate = null;
        let listDate = null;
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
        let circulatingSupply = null;
        let offerPriceNum = null;
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
            if (text.includes('주주명') && text.includes('지분율')) {
                const rows = $(table).find('tr');
                const totalRow = rows.filter((j, r) => {
                    const rowText = $(r).text().trim();
                    return rowText.includes('계') || rowText.includes('합계') || rowText.includes('소 계');
                }).last();
                if (totalRow.length > 0) {
                    const tds = totalRow.find('td');
                    for (let k = tds.length - 1; k >= 0; k--) {
                        const txt = $(tds[k]).text().trim();
                        if (txt.includes('%')) {
                            if (k > 0) {
                                const countVal = $(tds[k - 1]).text().trim().replace(/,/g, '');
                                if (/^\d+$/.test(countVal) && offerPriceNum) {
                                    const count = parseInt(countVal, 10);
                                    const amountInOk = (count * offerPriceNum) / 100000000;
                                    circulatingSupply = `${amountInOk.toFixed(0)}억 (${txt})`;
                                }
                                else if (/^\d+$/.test(countVal)) {
                                    const countNum = parseInt(countVal, 10);
                                    circulatingSupply = `${(countNum / 10000).toFixed(0)}만주 (${txt})`;
                                }
                                else {
                                    circulatingSupply = txt;
                                }
                            }
                            else {
                                circulatingSupply = txt;
                            }
                            return false;
                        }
                    }
                }
            }
        });
        let otcPrice = null;
        $('td').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt === '삽니다 (가격참고)') {
                const table = $(el).closest('table');
                const rows = table.find('tr');
                if (rows.length > 1) {
                    rows.each((j, row) => {
                        const tds = $(row).find('td');
                        const firstText = $(tds[0]).text().trim();
                        if (firstText.includes('삽니다') || firstText.includes('희망가격'))
                            return;
                        if (tds.length >= 2) {
                            const priceRaw = $(tds[1]).text().trim();
                            if (/^[\d,]+$/.test(priceRaw)) {
                                otcPrice = priceRaw;
                                return false;
                            }
                        }
                    });
                }
                if (otcPrice)
                    return false;
            }
        });
        return { lockupRate, circulatingSupply, otcPrice, competition, refundDate, listDate };
    }
    parseSingleDate(raw) {
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
    parseDateRange(raw) {
        if (!raw.includes('~'))
            return [null, null];
        const parts = raw.split('~');
        const startStr = parts[0].trim();
        let endStr = parts[1].trim();
        const startDate = this.parseDateString(startStr);
        let endDate = null;
        if (startDate) {
            if (endStr.length <= 5 && !endStr.includes(startDate.getFullYear().toString())) {
                endDate = this.parseDateString(`${startDate.getFullYear()}.${endStr}`);
                if (endDate && endDate < startDate) {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                }
            }
            else {
                endDate = this.parseDateString(endStr);
            }
        }
        return [startDate, endDate];
    }
    parseDateString(str) {
        const parts = str.split('.');
        if (parts.length < 2)
            return null;
        let year = new Date().getFullYear();
        let month = 0;
        let day = 1;
        if (parts.length === 3) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        }
        else if (parts.length === 2) {
            month = parseInt(parts[0], 10) - 1;
            day = parseInt(parts[1], 10);
        }
        const date = new Date(year, month, day);
        if (isNaN(date.getTime()))
            return null;
        return date;
    }
    parsePrice(raw) {
        if (!raw || raw === '-')
            return null;
        return parseInt(raw.replace(/,/g, ''), 10) || null;
    }
    parseBandPrice(raw) {
        if (!raw || !raw.includes('~'))
            return { bandLow: null, bandHigh: null };
        const parts = raw.split('~');
        return {
            bandLow: this.parsePrice(parts[0]),
            bandHigh: this.parsePrice(parts[1]),
        };
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map