import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import { Buffer } from 'node:buffer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import * as path from 'path';
import sharp from 'sharp';
import sizeOf from 'image-size';
import { v4 as uuidv4 } from 'uuid';
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
type Dimension = {
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
  imageWidth: number;
  imageHeight: number;
  videoPath: string;
  filename: string;
}

interface HandleMediaParams {
  artifact: File;
  display?: File;
  thumbnail?: File;
}

@Injectable()
export class FileService {
  private MEDIA_TEMP_DIR: string;

  async addMissingFiles(filesArray: File[]): Promise<File[]> {
    this.MEDIA_TEMP_DIR = __dirname + `/${uuidv4()}/`;
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
      if (isVideo) {
        this.#createTempDir();
        const addedFiles = await this.#handleVideo({
          artifact,
          display,
          thumbnail,
        });

        if (addedFiles.length) {
          addedFiles.forEach((file) => {
            filesArray.push(file);
          });
        }
      } else if (isImage) {
        this.#createTempDir();
        const addedFiles = await this.#handleImage({
          artifact,
          display,
          thumbnail,
        });

        if (addedFiles.length) {
          addedFiles.forEach((file) => {
            filesArray.push(file);
          });
        }
      }
    } catch (error) {
      Logger.error(
        `Failed during nft file imgae/video processing. err: ${error}`,
      );
    } finally {
      if (fs.existsSync(this.MEDIA_TEMP_DIR)) {
        this.#deleteTempDir();
      }
    }

    return filesArray;
  }

  async #handleVideo({
    artifact,
    display,
    thumbnail,
  }: HandleMediaParams): Promise<File[]> {
    const artifactResolution = await getVideoMetadata(artifact);
    const addedFiles: Array<File> = [];
    if (!display) {
      const generatedDisplay = await this.#imageFromVideo({
        videoFile: artifact,
        typeOfImage: 'display',
        imageWidth: artifactResolution.width,
        imageHeight: artifactResolution.height,
      });

      if (generatedDisplay) {
        addedFiles.push(generatedDisplay);
      } else {
        Logger.warn('Generating display from video failed');
      }
    }

    if (!thumbnail) {
      const availableDisplay =
        display || addedFiles.find((file) => file.originalname === 'display');

      if (availableDisplay) {
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
      } else {
        Logger.warn(
          "Thumbnail wasn't created as there was no available display",
        );
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
      if (availableDisplay) {
        const displayDimension = sizeOf(availableDisplay.buffer) as Dimension;
        if (displayDimension.width > 350 || displayDimension.height > 350) {
          const thumbnailDimension = this.scaledDimensions(
            displayDimension.width,
            displayDimension.height,
            350,
            350,
          );
          const artifactExtension = mime.getExtension(artifact.mimetype);

          if (artifactExtension) {
            const generatedThumbnail = await this.#resizedImg({
              buffer: availableDisplay.buffer,
              width: thumbnailDimension.width,
              height: thumbnailDimension.height,
              type: 'thumbnail',
              extension: artifactExtension,
            });
            addedFiles.push(generatedThumbnail);
          } else {
            Logger.warn(
              'Thumbnail could not be created because of missing artifact extension',
            );
          }
        } else {
          const generatedThumbnail = Object.assign({}, artifact);
          generatedThumbnail.originalname = 'thumbnail';
          addedFiles.push(generatedThumbnail);
        }
      } else {
        Logger.warn(
          "Thumbnail wasn't created as there was no available display",
        );
      }
    }

    return addedFiles;
  }

  async #imageFromVideo({
    videoFile,
    typeOfImage,
    imageWidth,
    imageHeight,
  }: ImageFromVideoParams): Promise<File | undefined> {
    const videoExtension = mime.getExtension(videoFile.mimetype);
    if (videoExtension) {
      const imagePath = `${this.MEDIA_TEMP_DIR}${typeOfImage}.png`;
      const videoPath = `${this.MEDIA_TEMP_DIR}video.${videoExtension}`;

      // generating screenshots doesn't work with input streams, therefore we write the buffer to a file
      fs.writeFileSync(videoPath, videoFile.buffer);

      try {
        await this.#screenshotFromVideo({
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
          this.MEDIA_TEMP_DIR,
        );
    });
  }

  #createTempDir() {
    fs.mkdirSync(this.MEDIA_TEMP_DIR);
  }

  #deleteTempDir() {
    fs.rmSync(this.MEDIA_TEMP_DIR, {
      recursive: true,
      force: true,
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
