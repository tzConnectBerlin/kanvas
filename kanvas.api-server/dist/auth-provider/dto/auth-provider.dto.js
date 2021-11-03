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
exports.AuthProviderDto = void 0;
const class_validator_1 = require("class-validator");
var AuthProviderEnum;
(function (AuthProviderEnum) {
    AuthProviderEnum["KUKAI"] = "kukai";
    AuthProviderEnum["BEACON"] = "beacon";
})(AuthProviderEnum || (AuthProviderEnum = {}));
class AuthProviderDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AuthProviderDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthProviderDto.prototype, "name", void 0);
exports.AuthProviderDto = AuthProviderDto;
//# sourceMappingURL=auth-provider.dto.js.map