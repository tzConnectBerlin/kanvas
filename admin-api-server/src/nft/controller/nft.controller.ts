import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { MAX_FILE_UPLOADS_PER_CALL } from '../../constants.js';
import { NftEntity, NftUpdate, UrlParams } from '../entities/nft.entity.js';
import { NftService } from '../service/nft.service.js';
import { FileService, File } from '../service/file/file.service.js';
import { CurrentUser } from '../../decoraters/user.decorator.js';
import { UserEntity } from '../../user/entities/user.entity.js';
import { NftFilterParams, NftFilters } from '../params.js';
import { ParseJSONPipe } from '../../pipes/ParseJSONPipe.js';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from '../../utils.js';
import { ContentRestrictions } from 'kanvas-stm-lib';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const filesizeHuman = require('filesize').partial({ standard: 'jedec' });

let getContentRestrictions: (
  attrName: string,
) => ContentRestrictions | undefined;
function contentFilter(req: any, file: any, callback: any) {
  if (typeof getContentRestrictions === 'undefined') {
    return callback(null, true);
  }

  const restrictions = getContentRestrictions(file.originalname);
  if (typeof restrictions === 'undefined') {
    return callback(null, true);
  }

  const mimetypes = restrictions.mimetypes;
  if (
    typeof mimetypes !== 'undefined' &&
    !mimetypes.some((mimeAllowed: string) => file.mimetype === mimeAllowed)
  ) {
    const err = `Invalid file type (${
      file.mimetype
    }), allowed types: ${JSON.stringify(mimetypes)}`;
    req.fileValidationError = err;
    return callback(new HttpException(err, HttpStatus.BAD_REQUEST), false);
  }

  return callback(null, true);
}

@Controller('nft')
export class NftController {
  constructor(
    private readonly nftService: NftService,
    private readonly fileService: FileService,
  ) {
    getContentRestrictions = (
      attrName: string,
    ): ContentRestrictions | undefined => {
      return this.nftService.getContentRestrictions(attrName);
    };
  }
  /**
   * @apiGroup Nft
   * @api {get} /nft/attributes Request nft attributes
   * @apiPermission user
   * @apiSuccessExample Example Success-Response:
   *    {
   *     "name": "string",
   *     "description": "text",
   *     "artifact": "content",
   *     "display": "content",
   *     "thumbnail": "content",
   *     "create_ready": "boolean",
   *     "price": "number",
   *     ...
   *    }
   * @apiName getAttributes
   */
  @Get('/attributes')
  @UseGuards(JwtAuthGuard)
  getAttributes() {
    return this.nftService.getAttributes();
  }

  // TODO: are we using these filters somewhere already? As I can not find any use case.
  /**
   * @apiGroup Nft
   * @api {get} /nft Request all nfts
   * @apiPermission user
   * @apiQuery {Object="nftIds: number[]","nftStates: string[]"} [filter] URL-decoded example: filter: { "nftIds": [] }
   * @apiQuery {String[]="name","id","edition_size"} [sort] URL-decoded examples: sort: [$value,"desc"] or sort: [$value,"asc"]
   * @apiQuery {Number[]="[number, number] e.g. [10, 25]"} [range] URL-decoded example: range: [10, 25] results in 25 records from the 10th record on
   * @apiSuccessExample Example Success-Response:
   *    {
   *        "id": 5,
   *        "state": "finish",
   *        "createdBy": 7,
   *        "createdAt": 1645708224,
   *        "updatedAt": 1645709306,
   *        "attributes": {
   *            "name": "scotland",
   *            "price": 30,
   *            "artifact": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *            "proposed": true,
   *            "thumbnail": "https://kanvas-admin-files.s3.eu-central-1.amazonaws.com/NFT_FILE__5_thumbnail.png",
   *            "categories": [
   *                10
   *            ],
   *            "description": "Thumbnail probably has nothing to do with Scotland. Maybe the guy is scottish. Who knows",
   *            "onsale_from": 1647342000000,
   *            "edition_size": 10,
   *            "proposal_accept": [
   *                1
   *            ],
   *            "prototype_accept": [
   *                1
   *            ]
   *        }
   *    }
   * @apiName findAll
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() filters: NftFilters,
    @Query('sort', new ParseJSONPipe())
    sort?: string[],
    @Query('range', new ParseJSONPipe())
    range?: number[],
  ) {
    const params = this.#queryParamsToFilterParams(filters, sort, range);

    validatePaginationParams(params, this.nftService.getSortableFields());

    return await this.nftService.findAll(params);
  }

  /**
   * @apiGroup Nft
   * @api {get} /nft/:id Request a single nft
   * @apiPermission user
   * @apiParam {Number} id Unique ID of nft
   * @apiSuccessExample Example Success-Response:
   *   {
   *     "id": 2,
   *     "state": "creation",
   *     "createdBy": 1,
   *     "createdAt": 1644410619,
   *     "updatedAt": 1644410673,
   *     "attributes": {
   *         "name": "name",
   *         "artifact": "https://kanvas-admin-files.s3.eu-central-1.amazonaws.com/NFT_FILE__2_image.png",
   *         "description": "this is a description"
   *     },
   *     "allowedActions": {},
   *     "stateInfo": {
   *         "setup_nft": [
   *             "nft.artifact.uri.length > 0"
   *         ]
   *     }
   *   }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/nft/5
   * @apiName findOne
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @CurrentUser() user: UserEntity) {
    return await this.nftService.getNft(user, id);
  }

  /**
   * @apiGroup Nft
   * @api {patch} /nft/:id Update a single nft
   * @apiPermission user
   * @apiParam {Number} [id] Unique ID of nft. When not set, it will create a nft
   * @apiBody {Object} nftUpdatesBody e.g. { description: "nft description" } or { name: "nft name" }
   * @apiBody {Any[]} [files[]] Binaries like artifact, display or thumbnail
   *
   * @apiSuccessExample Example Success-Response:
   *   {
   *     allowedActions: {}
   *     attributes: {name: "qqrftg", price: "300",…}
   *     createdAt: 1668524759
   *     createdBy: 1
   *     id: 381
   *     state: "proposed"
   *     stateInfo: {setup_nft: ["nft.proposal_vote.no.length == 1"], prototype: ["nft.proposal_vote.yes.length >= 1"]}
   *     prototype: ["nft.proposal_vote.yes.length >= 1"]
   *     setup_nft: ["nft.proposal_vote.no.length == 1"]
   *     updatedAt: 1668525092
   *   }
   *
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/nft/5
   *
   * @apiName update
   */
  @UseInterceptors(
    FilesInterceptor('files[]', MAX_FILE_UPLOADS_PER_CALL, {
      fileFilter: contentFilter,
    }),
  )
  @UseGuards(JwtAuthGuard)
  @Patch(':id?')
  async update(
    @Body() nftUpdatesBody: Record<string, unknown>,
    @CurrentUser() user: UserEntity,
    @Param() urlParams: UrlParams,
    @UploadedFiles() filesArray?: File[],
  ): Promise<NftEntity> {
    let nftId = urlParams.id;

    if (typeof nftId === 'undefined') {
      nftId = (await this.nftService.createNft(user)).id;
    }

    if (filesArray?.length) {
      filesArray = await this.fileService.addMissingFiles(filesArray);
    }

    const nftUpdates = this.#transformFormDataToNftUpdates(
      nftUpdatesBody,
      filesArray,
    );

    return await this.nftService.applyNftUpdates(user, nftId, nftUpdates);
  }

  /**
   * @apiGroup Nft
   * @api {delete} /nft/:id Delete a single nft
   * @apiPermission user
   * @apiParam {Number} id Unique ID of nft
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/nft/5
   *
   * @apiName delete
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@CurrentUser() user: UserEntity, @Param('id') nftId: number) {
    return await this.nftService.deleteNft(user, nftId);
  }

  #transformFormDataToNftUpdates(
    nftUpdatesBody: Record<string, unknown>,
    filesArray?: any[],
  ) {
    const res: NftUpdate[] = [];

    for (const attr of Object.keys(nftUpdatesBody)) {
      res.push(<NftUpdate>{
        attribute: attr,
        value: nftUpdatesBody[attr],
      });
    }

    if (typeof filesArray === 'undefined') {
      return res;
    }

    for (const file of filesArray) {
      const attrName = file.originalname;

      const restrictions = this.nftService.getContentRestrictions(attrName);
      if (
        typeof restrictions?.maxBytes !== 'undefined' &&
        file.size > restrictions.maxBytes
      ) {
        throw new HttpException(
          `${attrName} too big (file size=${filesizeHuman(
            file.size,
          )}), max allowed size is ${filesizeHuman(restrictions.maxBytes)}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      res.push(<NftUpdate>{
        attribute: file.originalname,
        file: file,
      });
    }

    return res;
  }

  #queryParamsToFilterParams(
    filters?: NftFilters,
    sort?: string[],
    range?: number[],
  ): NftFilterParams {
    return {
      ...new NftFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters,
    };
  }
}
