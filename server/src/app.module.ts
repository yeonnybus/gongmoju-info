import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { PrismaModule } from './prisma/prisma.module';
import { IpoModule } from './ipo/ipo.module';

@Module({
  imports: [CrawlerModule, PrismaModule, IpoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
