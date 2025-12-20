import { PrismaService } from '../prisma/prisma.service';
export declare class CrawlerService {
    private readonly prisma;
    private readonly logger;
    private readonly TARGET_URL;
    constructor(prisma: PrismaService);
    scrapeIpoList(): Promise<{
        count: number;
        message: string;
    }>;
    private parseDateRange;
    private parseDateString;
    private parsePrice;
    private parseBandPrice;
}
