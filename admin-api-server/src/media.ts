import intoStream from 'into-stream';
import ffmpeg from 'fluent-ffmpeg';
import { FfprobeStream, FfprobeData } from 'fluent-ffmpeg';
import { isBottom, maybe } from './utils.js';
import { Logger } from '@nestjs/common';
import { imageSize } from 'image-size';

export interface VideoMetadata {
  duration?: string;
  width?: number;
  height?: number;
  dataRate?: { value: number; unit: string };
}

export function getVideoMetadata(file: any): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg(intoStream(file.buffer)).ffprobe((err, metadata) => {
      resolve(videoMetadataFromFfprobe(err, metadata));
    });
  });
}

export function videoMetadataFromFfprobe(err: any, metadata: FfprobeData) {
  if (!isBottom(err)) {
    throw new Error(err);
  }

  const videoMetadata: FfprobeStream | undefined = metadata.streams.find(
    (s: any) => s.codec_type === 'video',
  );
  if (typeof videoMetadata === 'undefined') {
    throw new Error('no video stream found');
  }

  const tryGetField = (field: string): any | undefined => {
    const res = videoMetadata![field];
    if (typeof res === 'undefined') {
      Logger.warn(`${field} is missing in ffprobe's video metadata`);
    }
    return res;
  };

  const res: VideoMetadata = <VideoMetadata>{
    duration: maybe(tryGetField('duration'), (seconds: string) =>
      durationString(Number(seconds)),
    ),
    width: tryGetField('width'),
    height: tryGetField('height'),
    dataRate: maybe(
      tryGetField('bit_rate'),
      (bitRateStr: string): { value: number; unit: string } | undefined => {
        const bitRate = Number(bitRateStr);
        if (bitRate === NaN) {
          Logger.warn(
            `bit_rate field is NaN in ffprobe's video metadata (value is ${bitRateStr}`,
          );
          return undefined;
        }
        return {
          value: Math.floor(bitRate / 1000),
          unit: 'kbps',
        };
      },
    ),
  };
  Object.keys(res).forEach((key: string) => {
    if (isBottom(res[key as keyof VideoMetadata])) {
      delete res[key as keyof VideoMetadata];
    }
  });
  return res;
}

function durationString(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const padded = (n: number): string => {
    return String(n).padStart(2, '0');
  };
  return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
}

export interface ImageMetadata {
  width?: number;
  height?: number;
}

export function getImageMetadata(file: any): ImageMetadata {
  const dimensions = imageSize(file.buffer);
  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}
