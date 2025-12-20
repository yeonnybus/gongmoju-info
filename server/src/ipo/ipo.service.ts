import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IpoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // 날짜순 정렬 (청약 시작일 기준)
    return this.prisma.ipo.findMany({
      orderBy: {
        subStart: 'desc',
      },
    });
  }

  async findOne(name: string) {
    return this.prisma.ipo.findUnique({
      where: { name },
    });
  }
}
