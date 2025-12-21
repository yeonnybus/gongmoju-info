
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { IpoModule } from './ipo/ipo.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SubscriberModule } from './subscriber/subscriber.module';

@Module({
  imports: [CrawlerModule, PrismaModule, IpoModule, MailModule, SubscriberModule, SchedulerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
