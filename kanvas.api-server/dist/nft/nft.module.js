"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nft_controller_1 = require("./controller/nft.controller");
const nft_entity_1 = require("./entity/nft.entity");
const nft_service_1 = require("./service/nft.service");
const category_entity_1 = require("../category/entity/category.entity");
let NftModule = class NftModule {
};
NftModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                nft_entity_1.NftEntity,
                category_entity_1.CategoryEntity
            ])
        ],
        controllers: [nft_controller_1.NftController],
        providers: [nft_service_1.NftService]
    })
], NftModule);
exports.NftModule = NftModule;
//# sourceMappingURL=nft.module.js.map