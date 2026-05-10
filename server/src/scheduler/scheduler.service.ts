import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly crawlerService: CrawlerService,
  ) {}

  // Run every day at 08:29 AM, 09:30 AM, 03:00 PM, and 06:00 PM KST
  @Cron('29 8 * * *', { timeZone: 'Asia/Seoul' })
  @Cron('30 9 * * *', { timeZone: 'Asia/Seoul' })
  @Cron('0 15 * * *', { timeZone: 'Asia/Seoul' })
  @Cron('0 18 * * *', { timeZone: 'Asia/Seoul' })
  async runDailyCrawling() {
    this.logger.log('Starting daily IPO crawling...');
    try {
      const result = await this.crawlerService.scrapeIpoList();
      this.logger.log(`Daily crawling completed. Processed ${result.count} items.`);
    } catch (error) {
      this.logger.error('Daily crawling failed:', error);
    }
  }

  // Run every Monday at 08:30 AM KST
  @Cron('30 8 * * 1', { timeZone: 'Asia/Seoul' })
  async sendWeeklyReportCron() {
    this.logger.log('Starting weekly report distribution...');
    
    // 1. Get confirmed IPOs for this week (Monday to Sunday)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Queries
    const upcomingIpos = await this.prisma.ipo.findMany({
      where: {
        OR: [
          { subStart: { gte: today, lt: nextWeek } },
          { subEnd: { gte: today, lt: nextWeek } }
        ]
      },
      orderBy: { subStart: 'asc' },
    });

    const upcomingListings = await this.prisma.ipo.findMany({
        where: {
             listDate: { gte: today, lt: nextWeek }
        },
        orderBy: { listDate: 'asc' },
    });

    if (upcomingIpos.length === 0 && upcomingListings.length === 0) {
      this.logger.log('No upcoming IPOs or Listings this week. Skipping report.');
      return;
    }

    // 2. Get active, verified subscribers
    const subscribers = await this.prisma.subscriber.findMany({
      where: { isActive: true, isVerified: true },
    });

    this.logger.log(`Found ${upcomingIpos.length} Subscriptions, ${upcomingListings.length} Listings, and ${subscribers.length} subscribers.`);

    // 3. Send Emails
    const reportHtml = `
      <h1>[공모주 알리미] 이번 주 일정 안내</h1>
      <p>이번 주(${today.toLocaleDateString()} ~ ${nextWeek.toLocaleDateString()}) 예정된 공모주 일정입니다.</p>
      
      ${upcomingIpos.length > 0 ? `
      <h2>📅 청약 일정</h2>
      <ul>
        ${upcomingIpos.map(ipo => `
          <li style="margin-bottom: 5px;">
            <strong>${ipo.name}</strong> (${ipo.subStart?.toLocaleDateString()} ~ ${ipo.subEnd?.toLocaleDateString()})
          </li>
        `).join('')}
      </ul>
      ` : '<p>이번 주 청약 예정인 종목이 없습니다.</p>'}

      ${upcomingListings.length > 0 ? `
      <h2>🔔 상장 일정</h2>
      <ul>
        ${upcomingListings.map(ipo => `
          <li style="margin-bottom: 5px;">
            <strong>${ipo.name}</strong> (상장일: ${ipo.listDate?.toLocaleDateString()})
          </li>
        `).join('')}
      </ul>
      ` : ''}

      <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; text-align: center; border-radius: 8px;">
        <p style="margin-bottom: 10px;">더 자세한 정보와 분석은 홈페이지에서 확인하세요!</p>
        <a href="https://gongmoju-info-client.vercel.app/" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
          자세히 보기
        </a>
      </div>
    `;

    // Process in batches (Resend has rate limits)
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    
    for (const sub of subscribers) {
        try {
            // Append Unsubscribe Link to the report
            const unsubscribeLink = `${apiUrl}/subscribers/unsubscribe?token=${sub.unsubscribeToken}`;
            const personalizedReport = `
              ${reportHtml}
              <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
              <div style="text-align: center; font-size: 12px; color: #888;">
                <p>본 메일은 주간 리포트 구독 신청에 의해 발송되었습니다.</p>
                <a href="${unsubscribeLink}" style="color: #888; text-decoration: underline;">수신 거부 (Unsubscribe)</a>
              </div>
            `;

            await this.mailService.sendWeeklyReport(sub.email, personalizedReport);
            // Small delay to be polite
            await new Promise(r => setTimeout(r, 100)); 
        } catch (e) {
            this.logger.error(`Failed to send report to ${sub.email}`, e);
        }
    }
    
    this.logger.log('Weekly report distribution completed.');
  }

  // Debug Trigger
  async triggerReportManually() {
      return this.sendWeeklyReportCron();
  }
}
