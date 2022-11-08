import { videoMetadataFromFfprobe } from './media';

describe('Media video ffprobe mocked tests', () => {
  for (const tc_ of [
    {
      name: 'basic case',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            width: 400,
            height: 500,
            duration: 405,
            bit_rate: '250000',
          },
        ],
      },
      exp: {
        duration: '00:06:45',
        width: 400,
        height: 500,
        dataRate: {
          value: 250,
          unit: 'kbps',
        },
      },
    },
    {
      name: 'basic case (err can also be undefined)',
      err: undefined,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            width: 400,
            height: 500,
            duration: 405,
            bit_rate: '250000',
          },
        ],
      },
      exp: {
        duration: '00:06:45',
        width: 400,
        height: 500,
        dataRate: {
          value: 250,
          unit: 'kbps',
        },
      },
    },
    {
      name: 'bit rate is downwards rounded to the nearest kbps (case 1)',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            bit_rate: '150001',
          },
        ],
      },
      exp: {
        dataRate: {
          value: 150,
          unit: 'kbps',
        },
      },
    },
    {
      name: 'bit rate is downwards rounded to the nearest kbps (case 2)',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            bit_rate: '149999',
          },
        ],
      },
      exp: {
        dataRate: {
          value: 149,
          unit: 'kbps',
        },
      },
    },
    {
      name: 'if ffprobe errs, expect err output',
      err: 'failed to probe',
      metadata: null,
      expErr: new Error('failed to probe'),
    },
    {
      name: 'if there is no video stream component, expect err',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'image',
          },
        ],
      },
      expErr: new Error('no video stream found'),
    },
    {
      name: 'if there are multiple video streams present, first is taken',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'image',
          },
          {
            codec_type: 'video',
            bit_rate: '149999',
          },
          {
            codec_type: 'video',
            bit_rate: '5000',
          },
          {
            codec_type: 'video',
            bit_rate: '170000',
          },
        ],
      },
      exp: {
        dataRate: {
          value: 149,
          unit: 'kbps',
        },
      },
    },
    {
      name: 'hh:mm:ss format is respected with small duration',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            duration: 1,
          },
        ],
      },
      exp: {
        duration: '00:00:01',
      },
    },
    {
      name: 'hh:mm:ss format is respected with large duration',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            duration: 86399,
          },
        ],
      },
      exp: {
        duration: '23:59:59',
      },
    },
    {
      name: 'hh:mm:ss format can count further than 24h',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            duration: 126500,
          },
        ],
      },
      exp: {
        duration: '35:08:20',
      },
    },
    {
      name: 'hh:mm:ss format can count further than 99h',
      err: null,
      metadata: {
        streams: [
          {
            codec_type: 'video',
            duration: 13346500,
          },
        ],
      },
      exp: {
        duration: '3707:21:40',
      },
    },
  ]) {
    const tc: any = tc_;
    it(`${tc.name}`, () => {
      let got;
      let gotErr;

      try {
        got = videoMetadataFromFfprobe(tc.err, tc.metadata);
      } catch (err: any) {
        gotErr = err;
      }

      if (typeof tc.expErr !== 'undefined' || typeof gotErr !== 'undefined') {
        expect(gotErr).toStrictEqual(tc.expErr);
      } else {
        expect(got).toStrictEqual(tc.exp);
      }
    });
  }
});
