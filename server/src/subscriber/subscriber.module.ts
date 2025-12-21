import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { SubscriberController } from './subscriber.controller';

@Module({
  imports: [PrismaModule, MailModule, SchedulerModule],
  controllers: [SubscriberController],
})
export class SubscriberModule {}
