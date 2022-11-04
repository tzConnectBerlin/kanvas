import { Buffer } from 'node:buffer';

import { createRequire } from 'module';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import ffmpeg from 'fluent-ffmpeg';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

export interface File {
  originalname: string;
  fieldname: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
  size: number;
}

interface ImageFromVideoParams {
  artifactBuffer: Buffer;
  nftId: number;
  type: 'thumbnail' | 'display';
}

export async function imageFromVideo({
  artifactBuffer,
  nftId,
  type,
}: ImageFromVideoParams): Promise<File | undefined> {
  const fileTypeResult = await fileTypeFromBuffer(artifactBuffer);

  if (fileTypeResult) {
    const tempDir =
      '/Users/joshuapruefer/Desktop/kanvas/admin-api-server/temp/';
    const video = `${nftId}_video.${fileTypeResult.ext}`;
    const image = `${nftId}_${type}.png`;

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // generating screenshots doesn't work with input streams, therefore we write the buffer to a file
    fs.writeFileSync(`${tempDir}${video}`, artifactBuffer);

    await screenshotFromVideo({
      type,
      videoPath: `${tempDir}${video}`,
      pathToSave: tempDir,
      nftId,
    });

    return generateImageFile({ path: `${tempDir}${image}`, type });
  }
}

interface ResizedImgParams {
  buffer: Buffer;
  pathToSave: string;
  size: number;
  type: 'thumbnail' | 'display';
}

export async function resizedImg({
  buffer,
  pathToSave,
  size,
  type,
}: ResizedImgParams): Promise<File | undefined> {
  try {
    const res = await sharp(buffer).resize(size).toFile(pathToSave);
    if (res) {
      return generateImageFile({
        path: pathToSave,
        type,
      });
    }
  } catch (err) {
    throw new Error(`An error occurred during image generation: ${err}`);
  }
}

interface GenerateImageFileParams {
  path: string;
  type: 'thumbnail' | 'display';
}

export async function generateImageFile({
  path,
  type,
}: GenerateImageFileParams): Promise<File | undefined> {
  try {
    const tnBuffer = fs.readFileSync(path);
    const bufferSize = Buffer.byteLength(tnBuffer);
    const fileType = await fileTypeFromBuffer(tnBuffer);

    if (fileType) {
      return <File>{
        fieldname: 'files[]',
        originalname: type,
        encoding: '7bit',
        mimetype: fileType.mime,
        buffer: tnBuffer,
        size: bufferSize,
      };
    }
  } catch (err) {
    throw new Error(`An error occurred during custom file creation: ${err}`);
  }
}

interface ScreenshotFromVideoParams {
  type: 'thumbnail' | 'display';
  videoPath: string;
  pathToSave: string;
  nftId: number;
}

export async function screenshotFromVideo({
  videoPath,
  pathToSave,
  nftId,
  type,
}: ScreenshotFromVideoParams): Promise<void> {
  const size = type === 'display' ? '600x600' : '400x400';
  const filename = `${nftId}_${type}`;
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', function () {
        console.log('screenshot saved');
        resolve();
      })
      .on('error', function (err) {
        return reject(new Error(err));
      })
      .thumbnail(
        {
          count: 1,
          size,
          filename,
        },
        pathToSave,
      );
  });
}
