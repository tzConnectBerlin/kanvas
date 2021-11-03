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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftEntity = void 0;
const typeorm_1 = require("typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../../category/entity/category.entity");
const category_dto_1 = require("../../category/dto/category.dto");
let NftEntity = class NftEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NftEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NftEntity.prototype, "ipfsHash", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], NftEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftEntity.prototype, "dataUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftEntity.prototype, "contract", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftEntity.prototype, "tokenId", void 0);
__decorate([
    (0, typeorm_2.JoinTable)({ name: 'categories_nfts' }),
    (0, typeorm_2.ManyToMany)(() => category_entity_1.CategoryEntity, category => category.nfts),
    __metadata("design:type", Array)
], NftEntity.prototype, "categories", void 0);
NftEntity = __decorate([
    (0, typeorm_1.Entity)('nfts')
], NftEntity);
exports.NftEntity = NftEntity;
//# sourceMappingURL=nft.entity.js.map