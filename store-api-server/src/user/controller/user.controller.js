"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.UserController = void 0;
var common_1 = require("@nestjs/common");
var utils_1 = require("../../utils");
var platform_express_1 = require("@nestjs/platform-express");
var user_decorator_1 = require("../../decoraters/user.decorator");
var paramUtils_1 = require("../../paramUtils");
var jwt_auth_guard_1 = require("../../authentication/guards/jwt-auth.guard");
var constants_1 = require("../../constants");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var UserController = /** @class */ (function () {
    function UserController(userService, cache) {
        this.userService = userService;
        this.cache = cache;
    }
    UserController.prototype.getProfile = function (user, userAddress, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var address, profile_res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        address = userAddress ||
                            (typeof user !== 'undefined' ? user.userAddress : undefined);
                        if (typeof address === 'undefined') {
                            throw new common_1.HttpException('Define userAddress parameter or access this endpoint logged in', common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, this.userService.getProfile(address, currency)];
                    case 1:
                        profile_res = _a.sent();
                        if (!profile_res.ok) {
                            if (typeof userAddress === 'undefined') {
                                throw new common_1.HttpException('Failed to find user associated to JWT', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            }
                            throw new common_1.HttpException('No user registered with requested userAddress', common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [2 /*return*/, profile_res.val];
                }
            });
        });
    };
    UserController.prototype.editProfile = function (currentUser, editFields, picture) {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof editFields.userName === 'undefined' &&
                            typeof picture === 'undefined') {
                            throw new common_1.HttpException('neither username nor profile picture change requested', common_1.HttpStatus.BAD_REQUEST);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.userService.edit(currentUser.id, editFields.userName, picture)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        if ((err_1 === null || err_1 === void 0 ? void 0 : err_1.code) === constants_1.PG_UNIQUE_VIOLATION_ERRCODE) {
                            throw new common_1.HttpException('This username is already taken', common_1.HttpStatus.FORBIDDEN);
                        }
                        common_1.Logger.warn(err_1);
                        throw new common_1.HttpException('Failed to edit profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.checkAllowedEdit = function (userName) {
        return __awaiter(this, void 0, void 0, function () {
            var available;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.isNameAvailable(userName)];
                    case 1:
                        available = _a.sent();
                        return [2 /*return*/, {
                                userName: userName,
                                available: available
                            }];
                }
            });
        });
    };
    UserController.prototype.topBuyers = function (currency, resp) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        return [4 /*yield*/, (0, utils_1.wrapCache)(this.cache, resp, 'user.getTopBuyers' + currency, function () {
                                return _this.userService.getTopBuyers(currency).then(function (topBuyers) {
                                    return { topBuyers: topBuyers };
                                });
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UserController.prototype.nftOwnershipStatus = function (user, nftIdsQuery) {
        return __awaiter(this, void 0, void 0, function () {
            var nftIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            nftIds = nftIdsQuery.split(',').map(function (v) { return Number(v); });
                            if (nftIds.some(function (id) { return Number.isNaN(id); })) {
                                throw "one or more requested nftIds is NaN";
                            }
                        }
                        catch (err) {
                            throw new common_1.HttpException('Bad nftIds query parameter, expected comma separated nft id numbers', common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, this.userService.getNftOwnershipStatuses(user, nftIds)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UserController.prototype.cartAdd = function (cookieSession, user, nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var cartSession;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.getCartSession(cookieSession, user)];
                    case 1:
                        cartSession = _a.sent();
                        return [4 /*yield*/, this.userService.cartAdd(cartSession, nftId)["catch"](function (err) {
                                if (err instanceof common_1.HttpException) {
                                    throw err;
                                }
                                if ((err === null || err === void 0 ? void 0 : err.code) === constants_1.PG_FOREIGN_KEY_VIOLATION_ERRCODE) {
                                    throw new common_1.HttpException('This nft does not exist', common_1.HttpStatus.BAD_REQUEST);
                                }
                                if ((err === null || err === void 0 ? void 0 : err.code) === constants_1.PG_UNIQUE_VIOLATION_ERRCODE) {
                                    throw new common_1.HttpException('This nft is already in the cart', common_1.HttpStatus.BAD_REQUEST);
                                }
                                common_1.Logger.error("Error on adding nft to cart. cartSession=".concat(cartSession, ", nftId=").concat(nftId, ", err: ").concat(err));
                                throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserController.prototype.cartRemove = function (cookieSession, user, nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var cartSession, removed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.getCartSession(cookieSession, user)];
                    case 1:
                        cartSession = _a.sent();
                        return [4 /*yield*/, this.userService.cartRemove(cartSession, nftId)];
                    case 2:
                        removed = _a.sent();
                        if (!removed) {
                            throw new common_1.HttpException('This nft was not in the cart', common_1.HttpStatus.BAD_REQUEST);
                        }
                        // return 204 (successful delete, returning nothing)
                        throw new common_1.HttpException('', common_1.HttpStatus.NO_CONTENT);
                }
            });
        });
    };
    UserController.prototype.cartList = function (cookieSession, user, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var cartSession;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        return [4 /*yield*/, this.userService.getCartSession(cookieSession, user)];
                    case 1:
                        cartSession = _a.sent();
                        return [4 /*yield*/, this.userService.cartList(cartSession, currency)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Get)('/profile'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtFailableAuthGuard),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Query)('userAddress')),
        __param(2, (0, common_1.Query)('currency'))
    ], UserController.prototype, "getProfile");
    __decorate([
        (0, common_1.Post)('/profile/edit'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('profilePicture', {
            limits: { fileSize: constants_1.PROFILE_PICTURE_MAX_BYTES }
        })),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Body)()),
        __param(2, (0, common_1.UploadedFile)())
    ], UserController.prototype, "editProfile");
    __decorate([
        (0, common_1.Get)('/profile/edit/check'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        __param(0, (0, common_1.Query)('userName'))
    ], UserController.prototype, "checkAllowedEdit");
    __decorate([
        (0, common_1.Get)('topBuyers'),
        __param(0, (0, common_1.Query)('currency')),
        __param(1, (0, common_1.Res)())
    ], UserController.prototype, "topBuyers");
    __decorate([
        (0, common_1.Post)('nftOwnership'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
        __param(0, (0, user_decorator_1.CurrentUser)()),
        __param(1, (0, common_1.Query)('nftIds'))
    ], UserController.prototype, "nftOwnershipStatus");
    __decorate([
        (0, common_1.Post)('cart/add/:nftId'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtFailableAuthGuard),
        __param(0, (0, common_1.Session)()),
        __param(1, (0, user_decorator_1.CurrentUser)()),
        __param(2, (0, common_1.Param)('nftId'))
    ], UserController.prototype, "cartAdd");
    __decorate([
        (0, common_1.Post)('cart/remove/:nftId'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtFailableAuthGuard),
        __param(0, (0, common_1.Session)()),
        __param(1, (0, user_decorator_1.CurrentUser)()),
        __param(2, (0, common_1.Param)('nftId'))
    ], UserController.prototype, "cartRemove");
    __decorate([
        (0, common_1.Post)('cart/list'),
        (0, common_1.UseGuards)(jwt_auth_guard_1.JwtFailableAuthGuard),
        __param(0, (0, common_1.Session)()),
        __param(1, (0, user_decorator_1.CurrentUser)()),
        __param(2, (0, common_1.Query)('currency'))
    ], UserController.prototype, "cartList");
    UserController = __decorate([
        (0, common_1.Controller)('users'),
        __param(1, (0, common_1.Inject)(common_1.CACHE_MANAGER))
    ], UserController);
    return UserController;
}());
exports.UserController = UserController;
