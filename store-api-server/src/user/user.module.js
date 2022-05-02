"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.UserModule = void 0;
var common_1 = require("@nestjs/common");
var user_controller_1 = require("./controller/user.controller");
var user_service_1 = require("./service/user.service");
var db_module_1 = require("../db.module");
var nft_module_1 = require("../nft/nft.module");
var category_service_1 = require("../category/service/category.service");
var s3_service_1 = require("../s3.service");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var UserModule = /** @class */ (function () {
    function UserModule() {
    }
    UserModule = __decorate([
        (0, common_1.Module)({
            imports: [db_module_1.DbModule, nft_module_1.NftModule, kanvas_api_lib_1.CurrencyModule],
            controllers: [user_controller_1.UserController],
            providers: [category_service_1.CategoryService, user_service_1.UserService, s3_service_1.S3Service],
            exports: [user_service_1.UserService]
        })
    ], UserModule);
    return UserModule;
}());
exports.UserModule = UserModule;
