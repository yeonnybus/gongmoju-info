import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IpoController } from './ipo.controller';
import { IpoService } from './ipo.service';

@Module({
  imports: [PrismaModule],
  controllers: [IpoController],
  providers: [IpoService],
})
export class IpoModule {}
