import { BadRequestException, Body, Controller, Logger, Post } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';

@Controller('subscribers')
export class SubscriberController {
  private readonly logger = new Logger(SubscriberController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly schedulerService: SchedulerService,
  ) {}

  @Post()
  async requestVerification(@Body('email') email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email address');
    }

    // 1. Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Upsert Subscriber
    await this.prisma.subscriber.upsert({
      where: { email },
      update: { verificationCode } as any,
      create: { email, verificationCode, isActive: true } as any,
    });

    // 3. Send Email
    await this.mailService.sendVerificationCode(email, verificationCode);

    return { message: 'Verification code sent' };
  }

  @Post('verify')
  async verifyCode(@Body('email') email: string, @Body('code') code: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { email },
    });

    if (!subscriber || (subscriber as any).verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Verify
    await this.prisma.subscriber.update({
      where: { email },
      data: { isVerified: true, verificationCode: null } as any,
    });

    return { message: 'Subscription verified' };
  }

  @Post('test-report')
  async triggerTestReport() {
    await this.schedulerService.sendWeeklyReportCron();
    return { message: 'Weekly report triggered' };
  }
}
