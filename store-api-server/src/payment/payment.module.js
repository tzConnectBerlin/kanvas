"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PaymentModule = void 0;
var common_1 = require("@nestjs/common");
var payment_controller_1 = require("./controller/payment.controller");
var db_module_1 = require("../db.module");
var payment_service_1 = require("./service/payment.service");
var user_module_1 = require("../user/user.module");
var nft_module_1 = require("../nft/nft.module");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var PaymentModule = /** @class */ (function () {
    function PaymentModule() {
    }
    PaymentModule = __decorate([
        (0, common_1.Module)({
            imports: [db_module_1.DbModule, user_module_1.UserModule, nft_module_1.NftModule, kanvas_api_lib_1.CurrencyModule],
            controllers: [payment_controller_1.PaymentController],
            providers: [payment_service_1.PaymentService]
        })
    ], PaymentModule);
    return PaymentModule;
}());
exports.PaymentModule = PaymentModule;
