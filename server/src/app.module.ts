import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './crawler/crawler.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [CrawlerModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
