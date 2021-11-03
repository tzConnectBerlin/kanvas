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
exports.AuthenticationService = void 0;
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../../user/entity/user.entity");
const user_service_1 = require("../../user/service/user.service");
const token_interface_1 = require("../../interfaces/token.interface");
const common_1 = require("@nestjs/common");
const bcrypt = require('bcrypt');
let AuthenticationService = class AuthenticationService {
    constructor(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async validate(userData) {
        return await this.userService.findByAddress(userData.address);
    }
    async login(userData) {
        const user = await this.validate(userData);
        await this.verifyPassword(userData.signedPayload, user.signedPayload);
        return this.getCookieWithJwtToken({ id: user.id, name: user.name, address: user.address }, user);
    }
    async getLoggedUser(address) {
        return await this.userService.findByAddress(address);
    }
    async register(user) {
        const hashedSignedDartPayload = await bcrypt.hash(user.signedPayload, 10);
        try {
            const createdUser = await this.userService.create(Object.assign(Object.assign({}, user), { signedPayload: hashedSignedDartPayload }));
            createdUser.signedPayload = undefined;
            return createdUser;
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === '23505') {
                throw new common_1.HttpException('User with this credentials already exists', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyPassword(signedDartPayload, hashedSignedDartPayload) {
        const isSignedDartPayloadMatching = await bcrypt.compare(signedDartPayload, hashedSignedDartPayload);
        if (!isSignedDartPayloadMatching) {
            throw new common_1.HttpException('Wrong credentials provided', common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    getCookieWithJwtToken(data, user) {
        const payload = data;
        const token = this.jwtService.sign(payload);
        return {
            token: token,
            id: user.id,
            name: user.name,
            maxAge: process.env.JWT_EXPIRATION_TIME,
            address: data.address,
        };
    }
};
AuthenticationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService])
], AuthenticationService);
exports.AuthenticationService = AuthenticationService;
//# sourceMappingURL=authentication.service.js.map