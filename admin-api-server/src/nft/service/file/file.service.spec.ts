import { FileService, Dimension } from './file.service';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { getVideoMetadata, File } from '../../../media.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artifactMock = (buffer: Buffer, type: 'video' | 'image') => {
  return {
    fieldname: 'files[]',
    originalname: 'artifact',
    encoding: '7bit',
    mimetype: type === 'video' ? 'video/mov' : 'image/jpeg',
    buffer: buffer,
    size: 15178,
  };
};

const displayMock = async (width: number, height: number) => {
  const smallImageBuffer = fs.readFileSync(__dirname + '/smallimage.spec.jpeg');

  const displayBuffer = await sharp(smallImageBuffer)
    .resize({ width, height })
    .toBuffer();
  const bufferSize = Buffer.byteLength(displayBuffer);

  return {
    fieldname: 'files[]',
    originalname: 'display',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: displayBuffer,
    size: bufferSize,
  };
};

const thumbnailMock = async () => {
  const smallImageBuffer = fs.readFileSync(__dirname + '/smallimage.spec.jpeg');
  const thumbnailBuffer = await sharp(smallImageBuffer)
    .resize({ width: 50, height: 50 })
    .toBuffer();
  const bufferSize = Buffer.byteLength(thumbnailBuffer);

  return {
    fieldname: 'files[]',
    originalname: 'thumbnail',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: thumbnailBuffer,
    size: bufferSize,
  };
};

const isImage = (file: File) => {
  return (
    (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') &&
    file.fieldname === 'files[]' &&
    Buffer.isBuffer(file.buffer) &&
    file.encoding === '7bit' &&
    (file.originalname === 'display' || file.originalname === 'thumbnail')
  );
};

const expectedDimensions = (file: File, width: number, height: number) => {
  const dimensions = sizeOf(file.buffer);
  return dimensions.width === width && dimensions.height === height;
};

describe('FileService', () => {
  let fileService: FileService;

  beforeEach(() => {
    fileService = new FileService();
  });

  describe('#addMissingFiles should return artifact, thumbnail and display', () => {
    describe('if the artifact is a video', () => {
      describe('when display and thumbnail are missing', () => {
        describe('and the width OR the height of the video is LARGER than 350', () => {
          it('the display should be created with same dimensions as the video and the thumbnail should be a scaled (to 350) version of the display', async () => {
            const buffer = fs.readFileSync(__dirname + '/shortvideo.spec.mov');
            const artifact = artifactMock(buffer, 'video');
            const { width: artifactWidth, height: artifactHeight } =
              await getVideoMetadata(artifact);
            const filesArray = [artifact];

            const res = await fileService.addMissingFiles({
              filesArray,
              tempDirId: uuidv4(),
              nftId: 123,
            });
            const display = res.find((file) => file.originalname === 'display');
            const thumbnail = res.find(
              (file) => file.originalname === 'thumbnail',
            );

            expect(res.length).toBe(3);
            expect(isImage(display!)).toBe(true);
            expect(isImage(thumbnail!)).toBe(true);

            expect(
              expectedDimensions(display!, artifactWidth!, artifactHeight!),
            ).toBe(true);

            const { width: displayWidth, height: displayHeight } = sizeOf(
              display!.buffer,
            ) as Dimension;
            const thumbnailDimensions = sizeOf(thumbnail!.buffer);
            if (displayWidth > displayHeight) {
              expect(thumbnailDimensions.width).toBe(350);
              expect(thumbnailDimensions.height).toBeLessThan(350);
            }
            if (displayWidth < displayHeight) {
              expect(thumbnailDimensions.height).toBe(350);
              expect(thumbnailDimensions.width).toBeLessThan(350);
            }

            if (displayWidth === displayHeight) {
              expect(expectedDimensions(thumbnail!, 350, 350)).toBe(true);
            }

            const artifactAfterManipulation = res.find(
              (file) => file.originalname === 'artifact',
            );
            expect(artifactAfterManipulation).toStrictEqual(artifact);
          });
        });
        describe('and the width AND the height of the video are each SMALLER than 350', () => {
          it('the display and thumbnail should have the same dimensions as the video', async () => {
            const buffer = fs.readFileSync(
              __dirname + '/shortvideo_small.spec.mov',
            );
            const artifact = artifactMock(buffer, 'video');
            const { width: artifactWidth, height: artifactHeight } =
              await getVideoMetadata(artifact);
            const filesArray = [artifact];

            const res = await fileService.addMissingFiles({
              filesArray,
              tempDirId: uuidv4(),
              nftId: 123,
            });
            const display = res.find((file) => file.originalname === 'display');
            const thumbnail = res.find(
              (file) => file.originalname === 'thumbnail',
            );
            expect(res.length).toBe(3);
            expect(isImage(display!)).toBe(true);
            expect(isImage(thumbnail!)).toBe(true);

            expect(
              expectedDimensions(display!, artifactWidth!, artifactHeight!),
            ).toBe(true);
            expect(
              expectedDimensions(thumbnail!, artifactWidth!, artifactHeight!),
            ).toBe(true);

            const artifactAfterManipulation = res.find(
              (file) => file.originalname === 'artifact',
            );
            expect(artifactAfterManipulation).toStrictEqual(artifact);
          });
        });
      });

      describe('when only thumbnail is missing, thumbnail should be created from display', () => {
        it('with same size, when the display size is smaller than 350', async () => {
          const buffer = fs.readFileSync(__dirname + '/shortvideo.spec.mov');
          const artifact = artifactMock(buffer, 'video');
          const display = await displayMock(300, 320);
          const filesArray = [artifact, display];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(thumbnail!)).toBe(true);

          expect(expectedDimensions(thumbnail!, 300, 320)).toBe(true);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'display',
          );
          expect(afterManipulation).toStrictEqual([artifact, display]);
        });

        it('scaled to size 350, when the displays width or height is larger than 350', async () => {
          const buffer = fs.readFileSync(__dirname + '/shortvideo.spec.mov');
          const artifact = artifactMock(buffer, 'video');
          const display = await displayMock(400, 340);
          const filesArray = [artifact, display];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(thumbnail!)).toBe(true);

          const thumbnailDimensions = sizeOf(thumbnail!.buffer);
          expect(thumbnailDimensions.width).toBe(350);
          expect(thumbnailDimensions.height).toBeLessThan(350);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'display',
          );
          expect(afterManipulation).toStrictEqual([artifact, display]);
        });
      });

      describe('when only display is missing', () => {
        it('the display should be created with same dimensions as the video', async () => {
          const buffer = fs.readFileSync(__dirname + '/shortvideo.spec.mov');
          const artifact = artifactMock(buffer, 'video');
          const thumbnail = await thumbnailMock();
          const { width: artifactWidth, height: artifactHeight } =
            await getVideoMetadata(artifact);
          const filesArray = [artifact, thumbnail];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const display = res.find((file) => file.originalname === 'display');

          expect(res.length).toBe(3);
          expect(isImage(display!)).toBe(true);

          expect(
            expectedDimensions(display!, artifactWidth!, artifactHeight!),
          ).toBe(true);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'thumbnail',
          );
          expect(afterManipulation).toStrictEqual([artifact, thumbnail]);
        });
      });
    });

    describe('if the artifact is an image', () => {
      describe('when display and thumbnail are missing', () => {
        it('and the artifact has a smaller size than 350, display and thumbnail should be copies of the artifact', async () => {
          const smallImageBuffer = fs.readFileSync(
            __dirname + '/smallimage.spec.jpeg',
          );
          const buffer = await sharp(smallImageBuffer)
            .resize({ width: 300, height: 300 })
            .toBuffer();
          const artifact = artifactMock(buffer, 'image');
          const filesArray = [artifact];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const display = res.find((file) => file.originalname === 'display');
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(display!)).toBe(true);
          expect(isImage(thumbnail!)).toBe(true);

          expect(expectedDimensions(display!, 300, 300)).toBe(true);
          expect(expectedDimensions(thumbnail!, 300, 300)).toBe(true);

          const artifactAfterManipulation = res.find(
            (file) => file.originalname === 'artifact',
          );
          expect(artifactAfterManipulation).toStrictEqual(artifact);
        });
        it('and the artifact has a larger size than 350, display should be the same as the artifact and thumbnail a scaled down version with size 350', async () => {
          const smallImageBuffer = fs.readFileSync(
            __dirname + '/smallimage.spec.jpeg',
          );
          const buffer = await sharp(smallImageBuffer)
            .resize({ width: 400, height: 370 })
            .toBuffer();
          const artifact = artifactMock(buffer, 'image');
          const filesArray = [artifact];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const display = res.find((file) => file.originalname === 'display');
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(display!)).toBe(true);
          expect(isImage(thumbnail!)).toBe(true);

          const thumbnailDimensions = sizeOf(thumbnail!.buffer);

          expect(expectedDimensions(display!, 400, 370));
          expect(thumbnailDimensions.width).toBe(350);
          expect(thumbnailDimensions.height).toBeLessThan(350);

          const artifactAfterManipulation = res.find(
            (file) => file.originalname === 'artifact',
          );
          expect(artifactAfterManipulation).toStrictEqual(artifact);
        });
      });

      describe('when only thumbnail is missing', () => {
        it('and the display has a smaller size than 350, thumbnail should be a copy from display', async () => {
          const buffer = fs.readFileSync(__dirname + '/smallimage.spec.jpeg');
          const artifact = artifactMock(buffer, 'image');
          const display = await displayMock(300, 320);
          const filesArray = [artifact, display];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(thumbnail!)).toBe(true);
          expect(expectedDimensions(thumbnail!, 300, 320)).toBe(true);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'display',
          );
          expect(afterManipulation).toStrictEqual([artifact, display]);
        });

        it('and the display has a larger size than 350, thumbnail should be scaled down to size 350', async () => {
          const buffer = fs.readFileSync(__dirname + '/smallimage.spec.jpeg');
          const artifact = artifactMock(buffer, 'image');
          const display = await displayMock(350, 360);
          const filesArray = [artifact, display];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const thumbnail = res.find(
            (file) => file.originalname === 'thumbnail',
          );

          expect(res.length).toBe(3);
          expect(isImage(thumbnail!)).toBe(true);
          const thumbnailDimensions = sizeOf(thumbnail!.buffer);
          expect(thumbnailDimensions.height).toBe(350);
          expect(thumbnailDimensions.width).toBeLessThan(350);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'display',
          );
          expect(afterManipulation).toStrictEqual([artifact, display]);
        });
      });

      describe('when only display is missing', () => {
        it('display should be created as a copy from the artifact', async () => {
          const smallImageBuffer = fs.readFileSync(
            __dirname + '/smallimage.spec.jpeg',
          );
          const buffer = await sharp(smallImageBuffer)
            .resize({ width: 371, height: 173 })
            .toBuffer();
          const artifact = artifactMock(buffer, 'image');
          const thumbnail = await thumbnailMock();
          const filesArray = [artifact, thumbnail];

          const res = await fileService.addMissingFiles({
            filesArray,
            tempDirId: uuidv4(),
            nftId: 123,
          });
          const display = res.find((file) => file.originalname === 'display');

          expect(res.length).toBe(3);
          expect(isImage(display!)).toBe(true);
          expect(expectedDimensions(display!, 371, 173)).toBe(true);

          const afterManipulation = res.filter(
            (file) =>
              file.originalname === 'artifact' ||
              file.originalname === 'thumbnail',
          );
          expect(afterManipulation).toStrictEqual([artifact, thumbnail]);
        });
      });
    });
  });
});
