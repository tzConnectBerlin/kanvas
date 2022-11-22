import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

// Source: https://docs.nestjs.com/pipes#class-validator

@Injectable()
export class ParseJSONObjectPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    let object;
    try {
      object = JSON.parse(value);
    } catch {
      // This means the client did not send any stringified filter object
      return value;
    }

    if (typeof object !== 'object') {
      throw new BadRequestException('Validation failed');
    }

    const classInstance = plainToClass(metatype, object);
    const errors = await validate(classInstance);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
