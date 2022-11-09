import intoStream from 'into-stream';
import ffmpeg from 'fluent-ffmpeg';
import { FfprobeStream, FfprobeData } from 'fluent-ffmpeg';
import { isBottom, maybe } from './utils.js';
import { Logger } from '@nestjs/common';
import { imageSize } from 'image-size';

export interface ContentMetadata {
  mimeType: string;
  fileSize: number;

  width?: number;
  height?: number;

  duration?: string;
  dataRate?: { value: number; unit: string };
}

export async function getContentMetadata(
  nftId: number,
  file: any,
): Promise<ContentMetadata> {
  let res = {
    mimeType: file.mimetype,
    fileSize: file.size,
  };
  switch (file.mimetype.split('/')[0]) {
    case 'video':
      try {
        const videoMetadata = await getVideoMetadata(file);
        res = { ...res, ...videoMetadata };
      } catch (err: any) {
        Logger.warn(
          `failed to inspect video metadata for nftId=${nftId}, err: ${err}`,
        );
      }
      break;
    case 'image':
      try {
        const imageMetadata = getImageMetadata(file);
        res = { ...res, ...imageMetadata };
      } catch (err: any) {
        Logger.warn(
          `failed to inspect image metadata for nftId=${nftId}, err: ${err}`,
        );
      }
      break;
  }
  return res;
}

interface VideoMetadata {
  duration?: string;
  width?: number;
  height?: number;
  dataRate?: { value: number; unit: string };
}

function getVideoMetadata(file: any): Promise<VideoMetadata> {
  return new Promise((resolve) => {
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
    (s: FfprobeStream) => s.codec_type === 'video',
  );
  if (typeof videoMetadata === 'undefined') {
    throw new Error('no video stream found');
  }

  const tryGetField = (field: string): any | undefined => {
    const res = videoMetadata[field];
    if (typeof res === 'undefined') {
      Logger.warn(`${field} is missing in ffprobe's video metadata`);
    }
    return res;
  };

  const bitRate = metadata.streams.reduce(
    (rate: number | undefined, s: FfprobeStream) => {
      if (s.bit_rate == null || Number(s.bit_rate) === NaN) {
        return rate;
      }
      return (rate ?? 0) + Number(s.bit_rate);
    },
    undefined,
  );

  const res: VideoMetadata = <VideoMetadata>{
    duration: maybe(tryGetField('duration'), (seconds: string) =>
      durationString(Number(seconds)),
    ),
    width: tryGetField('width'),
    height: tryGetField('height'),
    dataRate: maybe(
      bitRate,
      (rate: number): { value: number; unit: string } | undefined => {
        return {
          value: Math.floor(rate / 1000),
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
  const seconds = Math.ceil(totalSeconds % 60);

  const padded = (n: number): string => {
    return String(n).padStart(2, '0');
  };
  return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
}

interface ImageMetadata {
  width?: number;
  height?: number;
}

function getImageMetadata(file: any): ImageMetadata {
  const dimensions = imageSize(file.buffer);
  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}
