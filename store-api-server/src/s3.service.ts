import { Injectable } from '@nestjs/common';
import { Result, Err, Ok } from 'ts-results';
import { S3 } from 'aws-sdk';

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

@Injectable()
export class S3Service {
  private s3 = new S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  async uploadFile(file: any, name: string): Promise<Result<string, string>> {
    if (typeof AWS_S3_BUCKET === 'undefined') {
      return Err('failed to upload file to AWS, AWS_S3_BUCKET env var not set');
    }

    const params = {
      Bucket: AWS_S3_BUCKET,
      Key: name,
      ACL: 'public-read',
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'eu-central-1',
      },
    };

    try {
      const resp = await this.s3.upload(params).promise();
      return Ok(resp.Location);
    } catch (err: any) {
      return Err(`failed to upload file to AWS, err: ${err}`);
    }
  }
}
