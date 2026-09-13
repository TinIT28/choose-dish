import { IsIn, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  timezone!: string;

  @IsIn([7, 30, 90, 365])
  historyRetentionDays!: number;
}
