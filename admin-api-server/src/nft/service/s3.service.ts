import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import aws from 'aws-sdk';
const { S3 } = aws;

const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

@Injectable()
export class S3Service {
  private s3 = new S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_KEY_SECRET,
  });

  async uploadFile(file: any, name: string): Promise<string> {
    if (typeof AWS_S3_BUCKET === 'undefined') {
      throw new HttpException(
        'Unable to upload new file. AWS_S3_BUCKET not defined',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      return resp.Location;
    } catch (err: any) {
      throw new HttpException(
        `Failed to upload file to AWS, err: ${err}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
