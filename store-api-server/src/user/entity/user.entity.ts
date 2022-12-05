import { IsString, IsBoolean } from 'class-validator';

export * from './user.types.js';

export class EmailRegistration {
  @IsString()
  walletAddress: string;
  @IsString()
  email: string;
  @IsBoolean()
  marketingConsent: boolean;
}
