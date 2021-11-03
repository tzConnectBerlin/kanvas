"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_decorators_1 = require("@nestjs/typeorm/dist/common/typeorm.decorators");
const typeorm_1 = require("typeorm");
const Repository_1 = require("typeorm/repository/Repository");
const nft_entity_1 = require("../entity/nft.entity");
const category_entity_1 = require("../../category/entity/category.entity");
let NftService = class NftService {
    constructor(nftRepository) {
        this.nftRepository = nftRepository;
    }
    async create(nft) {
        return this.nftRepository.save(nft);
    }
    async edit(nft) {
        const manager = (0, typeorm_1.getManager)();
        let concernedNft = await manager.findOne(nft_entity_1.NftEntity, { where: { id: nft.id } });
        if (!concernedNft) {
            throw new common_1.HttpException('Nft not found.', common_1.HttpStatus.NOT_FOUND);
        }
        concernedNft = nft;
        return this.nftRepository.save(concernedNft);
    }
    async findAll() {
        return this.nftRepository.find();
    }
    async findByCategories(categoryName, skip) {
        const manager = await (0, typeorm_1.getManager)();
        const connection = await (0, typeorm_1.getConnection)();
        const category = await manager.findOne(category_entity_1.CategoryEntity, { where: { name: categoryName } });
        if (!category) {
            throw new common_1.HttpException('Category not found.', common_1.HttpStatus.NOT_FOUND);
        }
        const nfts = await connection
            .createQueryBuilder(nft_entity_1.NftEntity, 'nfts')
            .innerJoinAndSelect('nfts.categories', 'categories')
            .where('categories.name = :categoryName', { categoryName: categoryName })
            .take(12)
            .skip(skip)
            .getMany();
        console.log(nfts);
        if (!nfts) {
            throw new common_1.HttpException('No Nfts for this category.', common_1.HttpStatus.NOT_FOUND);
        }
        return nfts;
    }
};
NftService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_decorators_1.InjectRepository)(nft_entity_1.NftEntity)),
    __metadata("design:paramtypes", [Repository_1.Repository])
], NftService);
exports.NftService = NftService;
//# sourceMappingURL=nft.service.js.map