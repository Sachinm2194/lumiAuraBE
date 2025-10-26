import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDTO } from './createUserDTO.dto';

export class UpdateUserDTO extends PartialType(CreateUserDTO) {}