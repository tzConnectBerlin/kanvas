import { IsString, IsBoolean, IsOptional } from 'class-validator';

export * from './user.types.js';

export class Recaptcha {
  @IsString()
  @IsOptional()
  recaptchaResponse?: string;
}

export class EmailRegistration {
  @IsString()
  walletAddress: string;
  @IsString()
  email: string;
  @IsBoolean()
  marketingConsent: boolean;
}
