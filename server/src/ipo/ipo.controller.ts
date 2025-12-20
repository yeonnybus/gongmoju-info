import { Controller, Get, Param } from '@nestjs/common';
import { IpoService } from './ipo.service';

@Controller('ipo')
export class IpoController {
  constructor(private readonly ipoService: IpoService) {}

  @Get()
  findAll() {
    return this.ipoService.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.ipoService.findOne(name);
  }
}
