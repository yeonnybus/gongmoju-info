import { CrawlerService } from './crawler.service';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    triggerCrawl(): Promise<{
        count: number;
        message: string;
    }>;
}
