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
let CrawlerService = CrawlerService_1 = class CrawlerService {
    logger = new common_1.Logger(CrawlerService_1.name);
    TARGET_URL = 'http://www.38.co.kr/html/fund/index.htm?o=k';
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
            const ipoList = [];
            $('table[summary="공모주 청약일정"] tbody tr').each((i, el) => {
                const name = $(el).find('td[height="30"]').text().trim();
                if (!name)
                    return;
                const tds = $(el).find('td');
                const scheduleRaw = $(tds[1]).text().trim();
                const offerPrice = $(tds[2]).text().trim();
                const bandPrice = $(tds[3]).text().trim();
                const competition = $(tds[4]).text().trim();
                const underwriter = $(tds[5]).text().trim();
                const [subStart, subEnd] = this.parseDates(scheduleRaw);
                ipoList.push({
                    name: name.replace('(유)', '').replace('(주)', '').trim(),
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
        }
        catch (error) {
            this.logger.error('Crawling failed', error);
            throw error;
        }
    }
    parseDates(raw) {
        if (!raw.includes('~'))
            return [null, null];
        const parts = raw.split('~');
        const startRaw = parts[0].trim();
        let endRaw = parts[1].trim();
        return [startRaw, endRaw];
    }
};
exports.CrawlerService = CrawlerService;
exports.CrawlerService = CrawlerService = CrawlerService_1 = __decorate([
    (0, common_1.Injectable)()
], CrawlerService);
//# sourceMappingURL=crawler.service.js.map