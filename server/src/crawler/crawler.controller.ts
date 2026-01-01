import { Controller, ForbiddenException, Get } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('test')
  async triggerCrawl() {
    // Security: Block in production
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is not available in production');
    }
    return this.crawlerService.scrapeIpoList();
  }
}
