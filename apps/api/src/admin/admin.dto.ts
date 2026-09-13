import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateDishDto } from '../dishes/dishes.dto';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class CreateSharedDishDto extends CreateDishDto {}
