import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJSONArrayPipe implements PipeTransform<string, any[]> {
  transform(value: string, metadata: ArgumentMetadata): any[] {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new BadRequestException(error, 'Validation failed');
    }
  }
}
