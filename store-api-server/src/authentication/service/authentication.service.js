"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AuthenticationService = void 0;
var common_1 = require("@nestjs/common");
var ts_results_1 = require("ts-results");
var bcrypt = require('bcrypt');
var AuthenticationService = /** @class */ (function () {
    function AuthenticationService(userService, jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }
    AuthenticationService.prototype.validate = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.findByAddress(userData.userAddress)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthenticationService.prototype.login = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var userRes, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.validate(userData)];
                    case 1:
                        userRes = _a.sent();
                        if (!userRes.ok) {
                            throw new common_1.HttpException('User not registered', common_1.HttpStatus.BAD_REQUEST);
                        }
                        user = userRes.val;
                        if (!(user.signedPayload !== undefined &&
                            userData.signedPayload !== undefined)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.verifyPassword(userData.signedPayload, user.signedPayload)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.getCookieWithJwtToken({
                                id: user.id,
                                userName: user.userName,
                                userAddress: user.userAddress
                            }, user)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthenticationService.prototype.getLoggedUser = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var userRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.findByAddress(address)];
                    case 1:
                        userRes = _a.sent();
                        if (userRes.ok) {
                            delete userRes.val.signedPayload;
                        }
                        return [2 /*return*/, userRes];
                }
            });
        });
    };
    AuthenticationService.prototype.isUserAttachedToCookieSession = function (userId, cookieSession) {
        return __awaiter(this, void 0, void 0, function () {
            var isAttached, cartSessionRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isAttached = false;
                        return [4 /*yield*/, this.userService.getUserCartSession(userId)];
                    case 1:
                        cartSessionRes = _a.sent();
                        if (!cartSessionRes.ok) {
                            return [2 /*return*/, cartSessionRes];
                        }
                        if (cartSessionRes.ok) {
                            isAttached || (isAttached = cartSessionRes.val === cookieSession);
                        }
                        return [2 /*return*/, (0, ts_results_1.Ok)(isAttached)];
                }
            });
        });
    };
    AuthenticationService.prototype.register = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedsignedKanvasPayload, createdUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bcrypt.hash(user.signedPayload, 10)];
                    case 1:
                        hashedsignedKanvasPayload = _a.sent();
                        return [4 /*yield*/, this.userService.create(__assign(__assign({}, user), { signedPayload: hashedsignedKanvasPayload }))];
                    case 2:
                        createdUser = _a.sent();
                        createdUser.signedPayload = undefined;
                        return [2 /*return*/, createdUser];
                }
            });
        });
    };
    AuthenticationService.prototype.verifyPassword = function (signedKanvasPayload, hashedsignedKanvasPayload) {
        return __awaiter(this, void 0, void 0, function () {
            var issignedKanvasPayloadMatching;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, bcrypt.compare(signedKanvasPayload, hashedsignedKanvasPayload)];
                    case 1:
                        issignedKanvasPayloadMatching = _a.sent();
                        if (!issignedKanvasPayloadMatching) {
                            throw new common_1.HttpException('Wrong credentials provided', common_1.HttpStatus.UNAUTHORIZED);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthenticationService.prototype.getCookieWithJwtToken = function (data, user) {
        var payload = data;
        var token = this.jwtService.sign(payload);
        if (typeof process.env.JWT_EXPIRATION_TIME == 'string') {
            return {
                token: token,
                id: user.id,
                userName: user.userName,
                maxAge: process.env.JWT_EXPIRATION_TIME,
                userAddress: data.userAddress
            };
        }
        else {
            throw new Error('process.env.JWT_EXPIRATION_TIME not set');
        }
    };
    AuthenticationService = __decorate([
        (0, common_1.Injectable)()
    ], AuthenticationService);
    return AuthenticationService;
}());
exports.AuthenticationService = AuthenticationService;
