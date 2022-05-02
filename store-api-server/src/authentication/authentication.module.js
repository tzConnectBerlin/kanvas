"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AuthenticationModule = void 0;
var common_1 = require("@nestjs/common");
var jwt_1 = require("@nestjs/jwt");
var user_module_1 = require("../user/user.module");
var authentication_service_1 = require("./service/authentication.service");
var authentication_controller_1 = require("./controller/authentication.controller");
var jwt_auth_strategy_1 = require("./strategy/jwt-auth.strategy");
var db_module_1 = require("../db.module");
var s3_service_1 = require("../s3.service");
var AuthenticationModule = /** @class */ (function () {
    function AuthenticationModule() {
    }
    AuthenticationModule = __decorate([
        (0, common_1.Module)({
            imports: [
                jwt_1.JwtModule.register({
                    secret: process.env.JWT_SECRET
                }),
                db_module_1.DbModule,
                user_module_1.UserModule,
            ],
            controllers: [authentication_controller_1.AuthenticationController],
            providers: [authentication_service_1.AuthenticationService, jwt_auth_strategy_1.JwtStrategy, s3_service_1.S3Service],
            exports: [authentication_service_1.AuthenticationService, jwt_auth_strategy_1.JwtStrategy]
        })
    ], AuthenticationModule);
    return AuthenticationModule;
}());
exports.AuthenticationModule = AuthenticationModule;
