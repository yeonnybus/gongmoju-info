import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationCode(email: string, code: string) {
    try {
      const data = await this.resend.emails.send({
        from: 'Gongmoju <onboarding@resend.dev>', // Note: This only works for 'onboarding@resend.dev' or verified domains
        to: [email],
        subject: '[공모주 알리미] 이메일 인증번호',
        html: `
          <h1>이메일 인증</h1>
          <p>아래 인증번호를 입력하여 구독을 완료해주세요.</p>
          <h2 style="color: #4F46E5; letter-spacing: 5px;">${code}</h2>
          <p>본 메일은 발신 전용입니다.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendWeeklyReport(email: string, content: string) {
    try {
      const data = await this.resend.emails.send({
        from: 'Gongmoju <onboarding@resend.dev>',
        to: [email],
        subject: '[공모주 알리미] 이번 주 청약 일정 리포트',
        html: content,
      });
      this.logger.log(`Weekly report sent to ${email}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to send weekly report to ${email}`, error);
      // Don't throw to allow batch processing to continue
    }
  }
}
