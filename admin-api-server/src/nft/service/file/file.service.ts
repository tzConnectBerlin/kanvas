import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import { Buffer } from 'node:buffer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import * as path from 'path';
import sharp from 'sharp';
import sizeOf from 'image-size';
import mime from 'mime';
import { getVideoMetadata } from '../../../media.js';

mime.define(
  {
    'video/mov': ['mov'],
    'video/quicktime': ['qt'],
  },
  true,
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface File {
  originalname: string;
  fieldname: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
  size: number;
}

type FileType = 'thumbnail' | 'display';
type Path = string;
export type Dimension = {
  width: number;
  height: number;
};

interface ResizedImgParams {
  buffer: Buffer;
  width: number;
  height: number;
  type: FileType;
  extension: string;
}

interface ImageFromVideoParams {
  tempDir: string;
  videoFile: File;
  typeOfImage: FileType;
  imageWidth: number;
  imageHeight: number;
}

interface GenerateImageFileParams {
  source: Path | Buffer;
  type: FileType;
  extension: string;
}

interface ScreenshotFromVideoParams {
  tempDir: string;
  imageWidth: number;
  imageHeight: number;
  videoPath: string;
  filename: string;
}

interface HandleMediaParams {
  tempDir: string;
  artifact: File;
  display?: File;
  thumbnail?: File;
}
@Injectable()
export class FileService {
  async addMissingFiles(
    filesArray: File[],
    tempDirId: string,
  ): Promise<File[]> {
    const MEDIA_TEMP_DIR = __dirname + `/${tempDirId}/`;
    const artifact = filesArray.find(
      (file) => file.originalname === 'artifact',
    ) as File; // we always assume that we get an artifact from the client

    const display = filesArray.find((file) => file.originalname === 'display');
    const thumbnail = filesArray.find(
      (file) => file.originalname === 'thumbnail',
    );

    const isVideo = (artifact.mimetype.match(/video/g) || []).length > 0;
    const isImage = (artifact.mimetype.match(/image/g) || []).length > 0;

    try {
      let addedFiles: File[] = [];
      if (isVideo) {
        fs.mkdirSync(MEDIA_TEMP_DIR);
        addedFiles = await this.#handleVideo({
          tempDir: MEDIA_TEMP_DIR,
          artifact,
          display,
          thumbnail,
        });
      } else if (isImage) {
        fs.mkdirSync(MEDIA_TEMP_DIR);
        addedFiles = await this.#handleImage({
          tempDir: MEDIA_TEMP_DIR,
          artifact,
          display,
          thumbnail,
        });
      }

      if (addedFiles.length) {
        addedFiles.forEach((file) => {
          filesArray.push(file);
        });
      }
    } catch (error) {
      Logger.error(
        `Failed during nft file imgae/video processing. err: ${error}`,
      );
    } finally {
      if (fs.existsSync(MEDIA_TEMP_DIR)) {
        fs.rmSync(MEDIA_TEMP_DIR, {
          recursive: true,
          force: true,
        });
      }
    }

    return filesArray;
  }

  async #handleVideo({
    tempDir,
    artifact,
    display,
    thumbnail,
  }: HandleMediaParams): Promise<File[]> {
    const { width: artifactWidth, height: artifactHeight } =
      await getVideoMetadata(artifact);
    const addedFiles: Array<File> = [];
    if (!display) {
      const generatedDisplay = await this.#imageFromVideo({
        tempDir,
        videoFile: artifact,
        typeOfImage: 'display',
        imageWidth: artifactWidth,
        imageHeight: artifactHeight,
      });

      if (!generatedDisplay) {
        Logger.warn('Generating display from video failed');
        return addedFiles;
      }

      addedFiles.push(generatedDisplay);
    }

    if (!thumbnail) {
      const availableDisplay =
        display || addedFiles.find((file) => file.originalname === 'display');

      if (!availableDisplay) {
        Logger.warn(
          "Thumbnail wasn't created as there was no available display",
        );
        return addedFiles;
      }

      const displayDimension = sizeOf(availableDisplay.buffer) as Dimension;
      if (displayDimension.width > 350 || displayDimension.height > 350) {
        const thumbnailDimension = this.scaledDimensions(
          displayDimension.width,
          displayDimension.height,
          350,
          350,
        );
        const generatedThumbnail = await this.#resizedImg({
          buffer: availableDisplay.buffer,
          width: thumbnailDimension.width,
          height: thumbnailDimension.height,
          type: 'thumbnail',
          extension: 'png',
        });
        addedFiles.push(generatedThumbnail);
      } else {
        const generatedThumbnail = Object.assign({}, availableDisplay);
        generatedThumbnail.originalname = 'thumbnail';
        addedFiles.push(generatedThumbnail);
      }
    }

    return addedFiles;
  }

  async #handleImage({
    artifact,
    display,
    thumbnail,
  }: HandleMediaParams): Promise<File[]> {
    const addedFiles: Array<File> = [];
    if (!display) {
      const generatedDisplay = Object.assign({}, artifact);
      generatedDisplay.originalname = 'display';
      addedFiles.push(generatedDisplay);
    }

    if (!thumbnail) {
      const availableDisplay =
        display || addedFiles.find((file) => file.originalname === 'display');

      if (!availableDisplay) {
        Logger.warn(
          "Thumbnail wasn't created as there was no available display",
        );
        return addedFiles;
      }

      const displayDimension = sizeOf(availableDisplay.buffer) as Dimension;
      if (displayDimension.width > 350 || displayDimension.height > 350) {
        const thumbnailDimension = this.scaledDimensions(
          displayDimension.width,
          displayDimension.height,
          350,
          350,
        );
        const displayExtension = mime.getExtension(availableDisplay.mimetype);

        if (!displayExtension) {
          Logger.warn(
            'Thumbnail could not be created because of missing display extension',
          );
          return addedFiles;
        }

        const generatedThumbnail = await this.#resizedImg({
          buffer: availableDisplay.buffer,
          width: thumbnailDimension.width,
          height: thumbnailDimension.height,
          type: 'thumbnail',
          extension: displayExtension,
        });
        addedFiles.push(generatedThumbnail);
      } else {
        const generatedThumbnail = Object.assign({}, availableDisplay);
        generatedThumbnail.originalname = 'thumbnail';
        addedFiles.push(generatedThumbnail);
      }
    }

    return addedFiles;
  }

  async #imageFromVideo({
    tempDir,
    videoFile,
    typeOfImage,
    imageWidth,
    imageHeight,
  }: ImageFromVideoParams): Promise<File | undefined> {
    const videoExtension = mime.getExtension(videoFile.mimetype);

    if (!videoExtension) {
      Logger.warn(
        'Could not create image from video as the extension from the video is missing but it is needed to fulfill this procedure.',
      );
      return;
    }
    const imagePath = `${tempDir}${typeOfImage}.png`;
    const videoPath = `${tempDir}video.${videoExtension}`;

    // generating screenshots doesn't work with input streams, therefore we write the buffer to a file
    fs.writeFileSync(videoPath, videoFile.buffer);

    try {
      await this.#screenshotFromVideo({
        tempDir,
        imageWidth,
        imageHeight,
        videoPath: videoPath,
        filename: `${typeOfImage}`,
      });
    } catch (error) {
      Logger.error('taking screenshot from video failed');
      throw error;
    }

    return this.#generateImageFile({
      source: imagePath,
      type: typeOfImage,
      extension: 'png',
    });
  }

  async #resizedImg({
    buffer,
    width,
    height,
    type,
    extension,
  }: ResizedImgParams): Promise<File> {
    const resizedImgBuffer = await sharp(buffer)
      .resize({ width, height })
      .toBuffer();
    return this.#generateImageFile({
      source: resizedImgBuffer,
      type,
      extension,
    });
  }

  #generateImageFile({
    source,
    type,
    extension,
  }: GenerateImageFileParams): File {
    const imageBuffer = Buffer.isBuffer(source)
      ? source
      : fs.readFileSync(source as Path);
    const bufferSize = Buffer.byteLength(imageBuffer);

    return <File>{
      fieldname: 'files[]', // for now, we only get files from this fieldname
      originalname: type,
      encoding: '7bit', // the client returns us this encoding for images
      mimetype: `image/${extension}`,
      buffer: imageBuffer,
      size: bufferSize,
    };
  }

  async #screenshotFromVideo({
    tempDir,
    videoPath,
    imageWidth,
    imageHeight,
    filename,
  }: ScreenshotFromVideoParams): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', function () {
          resolve();
        })
        .on('error', function (err) {
          return reject(new Error(err));
        })
        .thumbnail(
          {
            count: 1,
            size: `${imageWidth}x${imageHeight}`,
            filename,
          },
          tempDir,
        );
    });
  }

  scaledDimensions(
    srcWidth: number,
    srcHeight: number,
    maxWidth: number,
    maxHeight: number,
  ) {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
      width: Math.round(srcWidth * ratio),
      height: Math.round(srcHeight * ratio),
    };
  }
}
