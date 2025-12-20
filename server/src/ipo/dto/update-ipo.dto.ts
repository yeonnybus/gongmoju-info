import { PartialType } from '@nestjs/mapped-types';
import { CreateIpoDto } from './create-ipo.dto';

export class UpdateIpoDto extends PartialType(CreateIpoDto) {}
