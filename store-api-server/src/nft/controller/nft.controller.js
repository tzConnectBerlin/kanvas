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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
exports.__esModule = true;
exports.NftController = void 0;
var common_1 = require("@nestjs/common");
var sotez_1 = require("sotez");
var utils_1 = require("../../utils");
var constants_1 = require("../../constants");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var paramUtils_1 = require("../../paramUtils");
var NftController = /** @class */ (function () {
    function NftController(nftService, categoryService, cache) {
        this.nftService = nftService;
        this.categoryService = categoryService;
        this.cache = cache;
        _NftController_instances.add(this);
    }
    NftController.prototype.createNft = function (nft) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __classPrivateFieldGet(this, _NftController_instances, "m", _NftController_verifySignature).call(this, kanvas_api_lib_1.SIGNATURE_PREFIX_CREATE_NFT, nft.id, nft.signature)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.nftService.createNft(nft)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NftController.prototype.delistNft = function (nftId, signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nftId = Number(nftId);
                        if (nftId === NaN) {
                            throw new common_1.HttpException("invalid nft id", common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, __classPrivateFieldGet(this, _NftController_instances, "m", _NftController_verifySignature).call(this, kanvas_api_lib_1.SIGNATURE_PREFIX_DELIST_NFT, Number(nftId), signature)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.nftService.delistNft(nftId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NftController.prototype.relistNft = function (nftId, signature) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nftId = Number(nftId);
                        if (nftId === NaN) {
                            throw new common_1.HttpException("invalid nft id", common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, __classPrivateFieldGet(this, _NftController_instances, "m", _NftController_verifySignature).call(this, kanvas_api_lib_1.SIGNATURE_PREFIX_RELIST_NFT, nftId, signature)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.nftService.relistNft(nftId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NftController.prototype.getFiltered = function (resp, filters, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        __classPrivateFieldGet(this, _NftController_instances, "m", _NftController_validateFilterParams).call(this, filters);
                        return [4 /*yield*/, (0, utils_1.wrapCache)(this.cache, resp, 'nft.findNftsWithFilter' + JSON.stringify(filters) + currency, function () {
                                return _this.nftService.findNftsWithFilter(filters, currency);
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NftController.prototype.search = function (resp, searchParams, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        return [4 /*yield*/, (0, utils_1.wrapCache)(this.cache, resp, 'nft.search' + searchParams.searchString + currency, function () {
                                return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    var _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0:
                                                _a = resolve;
                                                _b = {};
                                                return [4 /*yield*/, this.nftService.search(searchParams.searchString, currency)];
                                            case 1:
                                                _b.nfts = _c.sent();
                                                return [4 /*yield*/, this.categoryService.search(searchParams.searchString)];
                                            case 2:
                                                _a.apply(void 0, [(_b.categories = _c.sent(),
                                                        _b)]);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NftController.prototype.byId = function (id, currency) {
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, paramUtils_1.validateRequestedCurrency)(currency);
                        id = Number(id);
                        if (isNaN(id)) {
                            throw new common_1.HttpException("invalid id (should be a number)", common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, this.nftService.byId(id, currency)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    var _NftController_instances, _NftController_validateFilterParams, _NftController_validatePaginationParams, _NftController_verifySignature;
    _NftController_instances = new WeakSet(), _NftController_validateFilterParams = function _NftController_validateFilterParams(params) {
        if (typeof params.availability !== 'undefined') {
            if (params.availability.some(function (availabilityEntry) {
                return !['upcoming', 'onSale', 'soldOut'].some(function (elem) { return elem === availabilityEntry; });
            })) {
                throw new common_1.HttpException("Requested availability ('".concat(params.availability, "') not supported"), common_1.HttpStatus.BAD_REQUEST);
            }
        }
        __classPrivateFieldGet(this, _NftController_instances, "m", _NftController_validatePaginationParams).call(this, params);
    }, _NftController_validatePaginationParams = function _NftController_validatePaginationParams(params) {
        if (params.page < 1 || params.pageSize < 1) {
            throw new common_1.HttpException('Bad page parameters', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!['asc', 'desc'].some(function (elem) { return elem === params.orderDirection; })) {
            throw new common_1.HttpException("Requested orderDirection ('".concat(params.orderDirection, "') not supported"), common_1.HttpStatus.BAD_REQUEST);
        }
        if (!['id', 'name', 'price', 'views', 'createdAt'].some(function (elem) { return elem === params.orderBy; })) {
            throw new common_1.HttpException("Requested orderBy ('".concat(params.orderBy, "') not supported"), common_1.HttpStatus.BAD_REQUEST);
        }
    }, _NftController_verifySignature = function _NftController_verifySignature(hexPrefix, nftId, signature) {
        return __awaiter(this, void 0, void 0, function () {
            var nftIdHex, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nftIdHex = nftId.toString(16);
                        if (nftIdHex.length & 1) {
                            // hex is of uneven length, sotez expects an even number of hexadecimal characters
                            nftIdHex = '0' + nftIdHex;
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, sotez_1.cryptoUtils.verify(hexPrefix + nftIdHex, "".concat(signature), constants_1.ADMIN_PUBLIC_KEY)];
                    case 2:
                        if (!(_a.sent())) {
                            throw new common_1.HttpException('Invalid signature', common_1.HttpStatus.UNAUTHORIZED);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        common_1.Logger.warn("Error on new nft signature validation, err: ".concat(err_1));
                        throw new common_1.HttpException('Could not validate signature (it may be misshaped)', common_1.HttpStatus.UNAUTHORIZED);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, common_1.Post)('/create'),
        __param(0, (0, common_1.Body)())
    ], NftController.prototype, "createNft");
    __decorate([
        (0, common_1.Post)('/delist/:id'),
        __param(0, (0, common_1.Param)('id')),
        __param(1, (0, common_1.Body)('signature'))
    ], NftController.prototype, "delistNft");
    __decorate([
        (0, common_1.Post)('/relist/:id'),
        __param(0, (0, common_1.Param)('id')),
        __param(1, (0, common_1.Body)('signature'))
    ], NftController.prototype, "relistNft");
    __decorate([
        (0, common_1.Get)(),
        __param(0, (0, common_1.Res)()),
        __param(1, (0, common_1.Query)()),
        __param(2, (0, common_1.Query)('currency'))
    ], NftController.prototype, "getFiltered");
    __decorate([
        (0, common_1.Get)('/search'),
        __param(0, (0, common_1.Res)()),
        __param(1, (0, common_1.Query)()),
        __param(2, (0, common_1.Query)('currency'))
    ], NftController.prototype, "search");
    __decorate([
        (0, common_1.Post)('/:id'),
        __param(0, (0, common_1.Param)('id')),
        __param(1, (0, common_1.Query)('currency'))
    ], NftController.prototype, "byId");
    NftController = __decorate([
        (0, common_1.Controller)('nfts'),
        __param(2, (0, common_1.Inject)(common_1.CACHE_MANAGER))
    ], NftController);
    return NftController;
}());
exports.NftController = NftController;
