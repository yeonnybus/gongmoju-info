import { BadRequestException, Body, Controller, ForbiddenException, Get, Logger, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { RequestVerificationDto, VerifyCodeDto } from './dto/subscriber.dto';

@Controller('subscribers')
export class SubscriberController {
  private readonly logger = new Logger(SubscriberController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly schedulerService: SchedulerService,
  ) {}

  // Rate limit: 3 requests per minute for email sending
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post()
  async requestVerification(@Body() dto: RequestVerificationDto) {
    const { email } = dto;

    // 1. Generate 6-digit code & Unsubscribe Token if not exists
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const unsubscribeToken = uuidv4();

    // 2. Upsert Subscriber
    // If user already exists, keep existing token if present
    const existing = await this.prisma.subscriber.findUnique({ where: { email } });
    const finalUnsubscribeToken = existing?.unsubscribeToken || unsubscribeToken;

    await this.prisma.subscriber.upsert({
      where: { email },
      update: { verificationCode, codeExpiresAt, unsubscribeToken: finalUnsubscribeToken } as any,
      create: { 
        email, 
        verificationCode, 
        codeExpiresAt, 
        isActive: true,
        unsubscribeToken: finalUnsubscribeToken 
      } as any,
    });

    // 3. Send Email
    await this.mailService.sendVerificationCode(email, verificationCode);

    this.logger.log(`Verification code sent to ${email.substring(0, 3)}***`);
    return { message: 'Verification code sent' };
  }

  // ... verifyCode method remains same ...
  // Rate limit: 5 attempts per minute for code verification
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify')
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const { email, code } = dto;
    
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      throw new BadRequestException('등록되지 않은 이메일입니다');
    }

    // Check if code is expired
    const codeExpiresAt = (subscriber as any).codeExpiresAt;
    if (codeExpiresAt && new Date(codeExpiresAt) < new Date()) {
      throw new BadRequestException('인증 코드가 만료되었습니다. 다시 요청해주세요');
    }

    if ((subscriber as any).verificationCode !== code) {
      throw new BadRequestException('인증 코드가 올바르지 않습니다');
    }

    // Verify and clear code
    await this.prisma.subscriber.update({
      where: { email },
      data: { isVerified: true, verificationCode: null, codeExpiresAt: null } as any,
    });

    this.logger.log(`Subscription verified for ${email.substring(0, 3)}***`);
    return { message: 'Subscription verified' };
  }

  @Get('unsubscribe')
  async unsubscribe(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    const subscriber = await this.prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new BadRequestException('Invalid token');
    }

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false } as any,
    });

    this.logger.log(`Unsubscribed user ${subscriber.email.substring(0, 3)}***`);
    
    // Simple HTML response
    return `
      <div style="text-align: center; font-family: sans-serif; padding-top: 50px;">
        <h1>구독이 취소되었습니다</h1>
        <p>더 이상 주간 리포트가 발송되지 않습니다.</p>
        <p>언제든지 웹사이트에서 다시 구독하실 수 있습니다.</p>
      </div>
    `;
  }

  @Post('test-report')
  async triggerTestReport() {
    // Security: Block in production
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('This endpoint is not available in production');
    }
    await this.schedulerService.sendWeeklyReportCron();
    return { message: 'Weekly report triggered' };
  }
}
