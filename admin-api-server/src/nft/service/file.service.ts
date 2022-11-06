import { Injectable, Logger } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import { Buffer } from 'node:buffer';
import { createRequire } from 'module';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import * as path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sharp = require('sharp');
const sizeOf = require('image-size');

export interface File {
  originalname: string;
  fieldname: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
  size: number;
}

type FileType = 'thumbnail' | 'display';

interface ResizedImgParams {
  buffer: Buffer;
  nftId: number;
  imageSize: { width: number; height: number };
  type: FileType;
}

interface ImageFromVideoParams {
  videoBuffer: Buffer;
  nftId: number;
  typeOfImage: FileType;
  imageSize: number;
}

interface GenerateImageFileParams {
  path: string;
  type: FileType;
}

interface ScreenshotFromVideoParams {
  imageSize: number;
  videoPath: string;
  filename: string;
}

interface HandleVideoParams {
  thumbnailMissing: boolean;
  displayMissing: boolean;
  nftId: number;
}

interface HandleImageParams {
  thumbnailMissing: boolean;
  displayMissing: boolean;
  nftId: number;
}

@Injectable()
export class FileService {
  private MEDIA_TEMP_DIR = __dirname + '/temp/';
  private allFiles: File[] = [];
  private artifact: File;

  async addMissingFiles(filesArray: File[], nftId: number): Promise<File[]> {
    this.allFiles = filesArray;
    this.artifact = filesArray.find(
      (file) => file.originalname === 'artifact',
    ) as File; // we always assume that we get an artifact from the client

    const thumbnailMissing = !filesArray.some(
      (file) => file.originalname === 'thumbnail',
    );
    const displayMissing = !filesArray.some(
      (file) => file.originalname === 'display',
    );
    const isVideo = (this.artifact.mimetype.match(/video/g) || []).length > 0;
    const isImage = (this.artifact.mimetype.match(/image/g) || []).length > 0;

    try {
      if (isVideo) {
        this.#createTempDir();
        const addedFiles = await this.#handleVideo({
          nftId,
          thumbnailMissing,
          displayMissing,
        });

        if (addedFiles.length) {
          addedFiles.forEach((file) => {
            this.allFiles.push(file);
          });
        }
      } else if (isImage) {
        this.#createTempDir();
        const addedFiles = await this.#handleImage({
          nftId,
          thumbnailMissing,
          displayMissing,
        });

        if (addedFiles.length) {
          addedFiles.forEach((file) => {
            this.allFiles.push(file);
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

    return this.allFiles;
  }

  async #handleVideo({
    nftId,
    displayMissing,
    thumbnailMissing,
  }: HandleVideoParams): Promise<File[]> {
    let addedFiles: File[] = [];
    if (displayMissing && thumbnailMissing) {
      const generatedDisplay = await this.#imageFromVideo({
        videoBuffer: this.artifact.buffer,
        nftId,
        typeOfImage: 'display',
        imageSize: 350,
      });

      if (generatedDisplay) {
        const thumbnail = await this.#resizedImg({
          buffer: generatedDisplay.buffer,
          imageSize: { width: 250, height: 250 },
          nftId,
          type: 'thumbnail',
        });

        if (thumbnail) {
          addedFiles.push(generatedDisplay);
          addedFiles.push(thumbnail);
        }
      }
    } else if (displayMissing) {
      const generatedDisplay = await this.#imageFromVideo({
        videoBuffer: this.artifact.buffer,
        nftId,
        typeOfImage: 'display',
        imageSize: 350,
      });

      if (generatedDisplay) {
        addedFiles.push(generatedDisplay);
      }
    } else if (thumbnailMissing) {
      const display = this.allFiles.find(
        (file) => file.originalname === 'display',
      ) as File; // we know there is a display at this point in time

      const displayDimensions: { height: number; width: number } = sizeOf(
        display.buffer,
      );

      let thumbnail: File | undefined;
      let width: number;
      let height: number;
      if (displayDimensions.width < 350 && displayDimensions.height < 350) {
        width = displayDimensions.width;
        height = displayDimensions.height;
      } else {
        const thumbnailDimensions = this.scaledDimensions(
          displayDimensions.width,
          displayDimensions.height,
          250,
          250,
        );
        width = thumbnailDimensions.width;
        height = thumbnailDimensions.height;
      }

      thumbnail = await this.#resizedImg({
        buffer: display.buffer,
        nftId,
        imageSize: {
          width,
          height,
        },
        type: 'thumbnail',
      });

      if (thumbnail) {
        addedFiles.push(thumbnail);
      }
    }

    return addedFiles;
  }

  async #handleImage({
    nftId,
    displayMissing,
    thumbnailMissing,
  }: HandleImageParams): Promise<File[]> {
    let addedFiles: File[] = [];
    if (displayMissing && thumbnailMissing) {
      const artifactDimensions: { height: number; width: number } = sizeOf(
        this.artifact.buffer,
      );

      let display: File | undefined;
      let thumbnail: File | undefined;
      if (artifactDimensions.width < 350 && artifactDimensions.height < 350) {
        display = Object.assign({}, this.artifact);
        display.originalname = 'display';

        thumbnail = Object.assign({}, this.artifact);
        thumbnail.originalname = 'thumbnail';
      } else {
        const displayDimensions = this.scaledDimensions(
          artifactDimensions.width,
          artifactDimensions.height,
          350,
          350,
        );
        display = await this.#resizedImg({
          buffer: this.artifact.buffer,
          nftId,
          imageSize: {
            width: displayDimensions.width,
            height: displayDimensions.height,
          },
          type: 'display',
        });

        const thumbnailDimensions = this.scaledDimensions(
          artifactDimensions.width,
          artifactDimensions.height,
          250,
          250,
        );
        thumbnail = await this.#resizedImg({
          buffer: this.artifact.buffer,
          nftId,
          imageSize: {
            width: thumbnailDimensions.width,
            height: thumbnailDimensions.height,
          },
          type: 'thumbnail',
        });
      }

      if (display && thumbnail) {
        addedFiles.push(display);
        addedFiles.push(thumbnail);
      }
    } else if (displayMissing) {
      const artifactDimensions: { height: number; width: number } = sizeOf(
        this.artifact.buffer,
      );
      let display: File | undefined;
      if (artifactDimensions.width < 350 && artifactDimensions.height < 350) {
        display = Object.assign({}, this.artifact);
        display.originalname = 'display';
      } else {
        const displayDimensions = this.scaledDimensions(
          artifactDimensions.width,
          artifactDimensions.height,
          350,
          350,
        );
        display = await this.#resizedImg({
          buffer: this.artifact.buffer,
          nftId,
          imageSize: {
            width: displayDimensions.width,
            height: displayDimensions.height,
          },
          type: 'display',
        });
      }

      if (display) {
        addedFiles.push(display);
      }
    } else if (thumbnailMissing) {
      const display = this.allFiles.find(
        (file) => file.originalname === 'display',
      ) as File;
      const displayDimensions: { height: number; width: number } = sizeOf(
        display.buffer,
      );

      let thumbnail: File | undefined;
      if (displayDimensions.width < 350 && displayDimensions.height < 350) {
        thumbnail = Object.assign({}, display);
        thumbnail.originalname = 'thumbnail';
      } else {
        const displayDimensions: { height: number; width: number } = sizeOf(
          display.buffer,
        );
        const thumbnailDimensions = this.scaledDimensions(
          displayDimensions.width,
          displayDimensions.height,
          250,
          250,
        );
        thumbnail = await this.#resizedImg({
          buffer: display.buffer,
          nftId,
          imageSize: {
            width: thumbnailDimensions.width,
            height: thumbnailDimensions.height,
          },
          type: 'thumbnail',
        });
      }

      if (thumbnail) {
        addedFiles.push(thumbnail);
      }
    }
    return addedFiles;
  }

  async #imageFromVideo({
    videoBuffer,
    nftId,
    typeOfImage,
    imageSize,
  }: ImageFromVideoParams): Promise<File | undefined> {
    const fileTypeResult = await fileTypeFromBuffer(videoBuffer);

    if (fileTypeResult) {
      const video = `${nftId}_video.${fileTypeResult.ext}`;
      const image = `${nftId}_${typeOfImage}.png`;

      // generating screenshots doesn't work with input streams, therefore we write the buffer to a file
      fs.writeFileSync(`${this.MEDIA_TEMP_DIR}${video}`, videoBuffer);

      try {
        await this.#screenshotFromVideo({
          imageSize,
          videoPath: `${this.MEDIA_TEMP_DIR}${video}`,
          filename: `${nftId}_${typeOfImage}`,
        });
      } catch (error) {
        Logger.error('taking screenshot from video failed');
        throw error;
      }

      return this.#generateImageFile({
        path: `${this.MEDIA_TEMP_DIR}${image}`,
        type: typeOfImage,
      });
    }
  }

  async #resizedImg({
    buffer,
    nftId,
    imageSize,
    type,
  }: ResizedImgParams): Promise<File | undefined> {
    const destinationPath = `${this.MEDIA_TEMP_DIR}${nftId}_${type}.png`;
    const res = await sharp(buffer)
      .resize({ width: imageSize.width, height: imageSize.height })
      .toFile(destinationPath);
    if (res) {
      return this.#generateImageFile({
        path: destinationPath,
        type,
      });
    }
  }

  async #generateImageFile({
    path,
    type,
  }: GenerateImageFileParams): Promise<File | undefined> {
    const imageBuffer = fs.readFileSync(path);
    const bufferSize = Buffer.byteLength(imageBuffer);
    const fileType = await fileTypeFromBuffer(imageBuffer);

    if (fileType) {
      return <File>{
        fieldname: 'files[]', // for now, we only get files from this fieldname
        originalname: type,
        encoding: '7bit', // the client returns us this encoding for images
        mimetype: fileType.mime,
        buffer: imageBuffer,
        size: bufferSize,
      };
    }
  }

  async #screenshotFromVideo({
    videoPath,
    imageSize,
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
            size: `${imageSize}x${imageSize}`,
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
