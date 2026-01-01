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
    fetchDetail(url: string): Promise<{
        lockupRate: string | null;
        circulatingSupply: string | null;
        otcPrice: string | null;
        competition: string | null;
        refundDate: Date | null;
        listDate: Date | null;
    }>;
    private parseSingleDate;
    private parseDateRange;
    private parseDateString;
    private parsePrice;
    private parseBandPrice;
}
