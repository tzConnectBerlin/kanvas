import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJSONArrayPipe implements PipeTransform<string, any[]> {
  transform(value: any, metadata: ArgumentMetadata): any[] {
    try {
      if (typeof value === 'object') {
        return value;
      }
      return JSON.parse(value ?? '{}');
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error, 'Validation failed');
    }
  }
}
