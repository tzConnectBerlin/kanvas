"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProviderModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_provider_entity_1 = require("./entity/auth-provider.entity");
const auth_provider_service_1 = require("./service/auth-provider.service");
let AuthProviderModule = class AuthProviderModule {
};
AuthProviderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                auth_provider_entity_1.AuthProviderEntity
            ])
        ],
        providers: [auth_provider_service_1.AuthProviderService]
    })
], AuthProviderModule);
exports.AuthProviderModule = AuthProviderModule;
//# sourceMappingURL=auth-provider.module.js.map