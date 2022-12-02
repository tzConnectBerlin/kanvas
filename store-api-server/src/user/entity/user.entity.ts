import { IsString, IsOptional, IsBoolean } from 'class-validator';

export * from './user.types.js';

export class EmailRegistration {
  @IsString()
  walletAddress: string;
  @IsString()
  email: string;
  @IsBoolean()
  marketingConsent: boolean;
  @IsString()
  walletProvider: string;

  @IsString()
  @IsOptional()
  ssoId?: string;
  @IsString()
  @IsOptional()
  ssoType?: string;
  @IsString()
  @IsOptional()
  ssoEmail?: string;
}
