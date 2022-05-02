"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.NftModule = void 0;
var common_1 = require("@nestjs/common");
var nft_controller_1 = require("./controller/nft.controller");
var nft_service_1 = require("./service/nft.service");
var ipfs_service_1 = require("./service/ipfs.service");
var category_module_1 = require("../category/category.module");
var db_module_1 = require("../db.module");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var mint_service_1 = require("./service/mint.service");
var NftModule = /** @class */ (function () {
    function NftModule() {
    }
    NftModule = __decorate([
        (0, common_1.Module)({
            imports: [db_module_1.DbModule, category_module_1.CategoryModule, kanvas_api_lib_1.CurrencyModule],
            controllers: [nft_controller_1.NftController],
            providers: [nft_service_1.NftService, ipfs_service_1.IpfsService, mint_service_1.MintService],
            exports: [nft_service_1.NftService, ipfs_service_1.IpfsService, mint_service_1.MintService]
        })
    ], NftModule);
    return NftModule;
}());
exports.NftModule = NftModule;
