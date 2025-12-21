import { Controller, Get, Param } from '@nestjs/common';
import { IpoService } from './ipo.service';

@Controller('ipo')
export class IpoController {
  constructor(private readonly ipoService: IpoService) {}

  @Get()
  findAll() {
    return this.ipoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ipoService.findOne(id);
  }
}
