import { HttpException, HttpStatus } from '@nestjs/common';
import { SUPPORTED_CURRENCIES } from 'kanvas-api-lib';

export function validateRequestedCurrency(currency: string) {
  if (!Object.keys(SUPPORTED_CURRENCIES).includes(currency)) {
    throw new HttpException(
      `currency is not supported`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
