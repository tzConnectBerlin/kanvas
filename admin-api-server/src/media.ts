import intoStream from 'into-stream';
import ffmpeg from 'fluent-ffmpeg';
import { FfprobeStream } from 'fluent-ffmpeg';
import { isBottom } from './utils.js';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export function getVideoMetadata(file: any): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg(intoStream(file.buffer)).ffprobe((err, metadata) => {
      if (!isBottom(err)) {
        reject(err);
      }

      const videoMetadata: FfprobeStream | undefined = metadata.streams.find(
        (s: any) => s.codec_type === 'video',
      );
      if (typeof videoMetadata === 'undefined') {
        reject(new Error('no video stream found'));
      }

      const assertGetField = (field: string): any => {
        if (typeof videoMetadata![field] === 'undefined') {
          reject(new Error(`field ${field} not found`));
        }
        return videoMetadata![field];
      };

      resolve({
        duration: Number(assertGetField('duration')),
        width: assertGetField('width'),
        height: assertGetField('height'),
      });
    });
  });
}
