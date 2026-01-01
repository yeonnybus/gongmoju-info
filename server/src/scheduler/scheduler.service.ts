import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // Run every Monday at 09:00 AM
  @Cron('0 9 * * 1')
  async sendWeeklyReportCron() {
    this.logger.log('Starting weekly report distribution...');
    
    // 1. Get confirmed IPOs for this week (Monday to Sunday)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingIpos = await this.prisma.ipo.findMany({
      where: {
        OR: [
          { subStart: { gte: today, lt: nextWeek } },
          { subEnd: { gte: today, lt: nextWeek } }
        ]
      },
      orderBy: { subStart: 'asc' },
    });

    if (upcomingIpos.length === 0) {
      this.logger.log('No upcoming IPOs this week. Skipping report.');
      return;
    }

    // 2. Get active, verified subscribers
    const subscribers = await this.prisma.subscriber.findMany({
      where: { isActive: true, isVerified: true },
    });

    this.logger.log(`Found ${upcomingIpos.length} IPOs and ${subscribers.length} subscribers.`);

    // 3. Send Emails (Simple text for now)
    // In production, use a template engine or formatted HTML
    const reportHtml = `
      <h1>[공모주 알리미] 이번 주 청약 일정</h1>
      <p>이번 주(${today.toLocaleDateString()} ~ ${nextWeek.toLocaleDateString()})에 진행되는 공모주 일정입니다.</p>
      <ul>
        ${upcomingIpos.map(ipo => `
          <li style="margin-bottom: 10px;">
            <strong>${ipo.name}</strong><br/>
            청약일: ${ipo.subStart?.toLocaleDateString()} ~ ${ipo.subEnd?.toLocaleDateString()}<br/>
            공모가: ${ipo.offerPrice ? ipo.offerPrice.toLocaleString() + '원' : '미정'}<br/>
            주간사: ${ipo.underwriter || '미정'}<br/>
            기관경쟁률: ${ipo.competition || '미정'}
          </li>
        `).join('')}
      </ul>
      <p>상세 정보는 홈페이지를 확인하세요.</p>
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
