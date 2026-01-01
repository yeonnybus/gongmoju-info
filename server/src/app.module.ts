
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { IpoModule } from './ipo/ipo.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SubscriberModule } from './subscriber/subscriber.module';

@Module({
  imports: [
    // Rate Limiting: 1분당 20회 요청 제한 (글로벌)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 20,
    }]),
    CrawlerModule,
    PrismaModule,
    IpoModule,
    MailModule,
    SubscriberModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
