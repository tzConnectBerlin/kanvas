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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.NftService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var kanvas_api_lib_1 = require("kanvas-api-lib");
var utils_1 = require("../../utils");
var db_module_1 = require("../../db.module");
var NftService = /** @class */ (function () {
    function NftService(conn, categoryService, ipfsService, currencyService) {
        this.conn = conn;
        this.categoryService = categoryService;
        this.ipfsService = ipfsService;
        this.currencyService = currencyService;
        _NftService_instances.add(this);
    }
    NftService.prototype.createNft = function (newNft) {
        return __awaiter(this, void 0, void 0, function () {
            var insert, uploadToIpfs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        insert = function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var launchAt;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        launchAt = undefined;
                                        if (typeof newNft.launchAt !== 'undefined') {
                                            launchAt = new Date();
                                            launchAt.setTime(newNft.launchAt);
                                        }
                                        return [4 /*yield*/, dbTx.query("\nINSERT INTO nft (\n  id, signature, nft_name, artifact_uri, display_uri, thumbnail_uri, description, launch_at, price, editions_size\n)\nVALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n      ", [
                                                newNft.id,
                                                newNft.signature,
                                                newNft.name,
                                                newNft.artifactUri,
                                                newNft.displayUri,
                                                newNft.thumbnailUri,
                                                newNft.description,
                                                launchAt === null || launchAt === void 0 ? void 0 : launchAt.toUTCString(),
                                                newNft.price,
                                                newNft.editionsSize,
                                            ])];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, dbTx.query("\nINSERT INTO mtm_nft_category (\n  nft_id, nft_category_id\n)\nSELECT $1, UNNEST($2::INTEGER[])\n      ", [newNft.id, newNft.categories])];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        uploadToIpfs = function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var nftEntity, MAX_ATTEMPTS, BACKOFF_MS, i, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.byId(newNft.id, kanvas_api_lib_1.BASE_CURRENCY, false, dbTx)];
                                    case 1:
                                        nftEntity = _a.sent();
                                        MAX_ATTEMPTS = 10;
                                        BACKOFF_MS = 1000;
                                        i = 0;
                                        _a.label = 2;
                                    case 2:
                                        if (!(i < MAX_ATTEMPTS)) return [3 /*break*/, 8];
                                        _a.label = 3;
                                    case 3:
                                        _a.trys.push([3, 5, , 6]);
                                        return [4 /*yield*/, this.ipfsService.uploadNft(nftEntity, dbTx)];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                    case 5:
                                        err_1 = _a.sent();
                                        common_1.Logger.warn("failed to upload new nft to IPFS (attempt ".concat(i + 1, "/").concat(MAX_ATTEMPTS, "), err: ").concat(err_1));
                                        return [3 /*break*/, 6];
                                    case 6:
                                        (0, utils_1.sleep)(BACKOFF_MS);
                                        _a.label = 7;
                                    case 7:
                                        i++;
                                        return [3 /*break*/, 2];
                                    case 8: throw "failed to upload new nft to IPFS";
                                }
                            });
                        }); };
                        return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, insert(dbTx)];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, uploadToIpfs(dbTx)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })["catch"](function (err) {
                                common_1.Logger.error("failed to publish nft (id=".concat(newNft.id, "), err: ").concat(err));
                                throw err;
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NftService.prototype.delistNft = function (nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var tablesNftIdField, tables, _i, tables_1, table, nftIdField, qryRes, _a, tables_2, table, nftIdField;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        tablesNftIdField = {
                                            nft: 'id',
                                            mtm_kanvas_user_nft: 'nft_id',
                                            mtm_nft_category: 'nft_id',
                                            mtm_nft_order_nft: 'nft_id'
                                        };
                                        tables = [
                                            'mtm_nft_order_nft',
                                            'mtm_kanvas_user_nft',
                                            'mtm_nft_category',
                                            'nft',
                                        ];
                                        _i = 0, tables_1 = tables;
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < tables_1.length)) return [3 /*break*/, 4];
                                        table = tables_1[_i];
                                        nftIdField = tablesNftIdField[table];
                                        return [4 /*yield*/, dbTx.query("\nINSERT INTO __".concat(table, "_delisted\nSELECT *\nFROM ").concat(table, "\nWHERE ").concat(nftIdField, " = $1\n        "), [nftId])];
                                    case 2:
                                        qryRes = _b.sent();
                                        _b.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        _a = 0, tables_2 = tables;
                                        _b.label = 5;
                                    case 5:
                                        if (!(_a < tables_2.length)) return [3 /*break*/, 8];
                                        table = tables_2[_a];
                                        nftIdField = tablesNftIdField[table];
                                        return [4 /*yield*/, dbTx.query("\nDELETE FROM ".concat(table, "\nWHERE ").concat(nftIdField, " = $1\n        "), [nftId])];
                                    case 6:
                                        _b.sent();
                                        _b.label = 7;
                                    case 7:
                                        _a++;
                                        return [3 /*break*/, 5];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NftService.prototype.relistNft = function (nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                            var tablesNftIdField, tables, _i, tables_3, table, nftIdField, _a, tables_4, table, nftIdField;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        tablesNftIdField = {
                                            nft: 'id',
                                            mtm_kanvas_user_nft: 'nft_id',
                                            mtm_nft_category: 'nft_id',
                                            mtm_nft_order_nft: 'nft_id'
                                        };
                                        tables = [
                                            'nft',
                                            'mtm_nft_order_nft',
                                            'mtm_kanvas_user_nft',
                                            'mtm_nft_category',
                                        ];
                                        _i = 0, tables_3 = tables;
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < tables_3.length)) return [3 /*break*/, 4];
                                        table = tables_3[_i];
                                        nftIdField = tablesNftIdField[table];
                                        return [4 /*yield*/, dbTx.query("\n\nINSERT INTO ".concat(table, "\nSELECT *\nFROM __").concat(table, "_delisted\nWHERE ").concat(nftIdField, " = $1\n        "), [nftId])];
                                    case 2:
                                        _b.sent();
                                        _b.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        _a = 0, tables_4 = tables;
                                        _b.label = 5;
                                    case 5:
                                        if (!(_a < tables_4.length)) return [3 /*break*/, 8];
                                        table = tables_4[_a];
                                        nftIdField = tablesNftIdField[table];
                                        return [4 /*yield*/, dbTx.query("\nDELETE FROM __".concat(table, "_delisted\nWHERE ").concat(nftIdField, " = $1\n        "), [nftId])];
                                    case 6:
                                        _b.sent();
                                        _b.label = 7;
                                    case 7:
                                        _a++;
                                        return [3 /*break*/, 5];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NftService.prototype.search = function (str, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var nftIds, nfts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT id\nFROM (\n  SELECT\n    id,\n    view_count,\n    GREATEST(\n      word_similarity($1, nft_name),\n      word_similarity($1, description)\n    ) AS similarity\n  FROM nft\n) AS inner_query\nWHERE similarity >= $2\nORDER BY similarity DESC, view_count DESC\nLIMIT $3\n    ", [str, constants_1.SEARCH_SIMILARITY_LIMIT, constants_1.SEARCH_MAX_NFTS])];
                    case 1:
                        nftIds = _a.sent();
                        return [4 /*yield*/, this.findByIds(nftIds.rows.map(function (row) { return row.id; }), 'nft_id', 'asc', currency)];
                    case 2:
                        nfts = _a.sent();
                        return [2 /*return*/, nftIds.rows
                                .map(function (row) { return nfts.find(function (nft) { return nft.id === row.id; }); })
                                .filter(Boolean)];
                }
            });
        });
    };
    NftService.prototype.findNftsWithFilter = function (filters, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var orderByMapping, orderBy, offset, limit, untilNft, nftIds, priceBounds, res, _a, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orderByMapping = new Map([
                            ['id', 'nft_id'],
                            ['createdAt', 'nft_created_at'],
                            ['name', 'nft_name'],
                            ['price', 'price'],
                            ['views', 'view_count'],
                        ]);
                        orderBy = orderByMapping.get(filters.orderBy);
                        if (typeof orderBy === 'undefined') {
                            common_1.Logger.error('Error in nft.filter(), orderBy unmapped, request.orderBy: ' +
                                filters.orderBy);
                            throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                        if (typeof filters.priceAtLeast !== 'undefined') {
                            filters.priceAtLeast = this.currencyService.convertFromCurrency(filters.priceAtLeast, currency);
                        }
                        if (typeof filters.priceAtMost !== 'undefined') {
                            filters.priceAtMost = this.currencyService.convertFromCurrency(filters.priceAtMost, currency);
                        }
                        offset = (filters.page - 1) * filters.pageSize;
                        limit = filters.pageSize;
                        untilNft = undefined;
                        if (typeof filters.firstRequestAt === 'number') {
                            untilNft = new Date(filters.firstRequestAt * 1000).toISOString();
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.conn.query("\nSELECT nft_id, total_nft_count\nFROM nft_ids_filtered($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", [
                                filters.userAddress,
                                filters.categories,
                                filters.priceAtLeast,
                                filters.priceAtMost,
                                filters.availability,
                                orderBy,
                                filters.orderDirection,
                                offset,
                                limit,
                                untilNft,
                                constants_1.MINTER_ADDRESS,
                            ])];
                    case 2:
                        nftIds = _b.sent();
                        return [4 /*yield*/, this.conn.query("\nSELECT min_price, max_price\nFROM price_bounds($1, $2, $3)", [filters.userAddress, filters.categories, untilNft])];
                    case 3:
                        priceBounds = _b.sent();
                        res = {
                            currentPage: filters.page,
                            numberOfPages: 0,
                            firstRequestAt: filters.firstRequestAt,
                            nfts: [],
                            lowerPriceBound: this.currencyService.convertToCurrency(Number(priceBounds.rows[0].min_price), currency),
                            upperPriceBound: this.currencyService.convertToCurrency(Number(priceBounds.rows[0].max_price), currency)
                        };
                        if (nftIds.rows.length === 0) {
                            return [2 /*return*/, res];
                        }
                        res.numberOfPages = Math.ceil(nftIds.rows[0].total_nft_count / filters.pageSize);
                        _a = res;
                        return [4 /*yield*/, this.findByIds(nftIds.rows.map(function (row) { return row.nft_id; }), orderBy, filters.orderDirection, currency)];
                    case 4:
                        _a.nfts = _b.sent();
                        if (!(typeof filters.userAddress !== 'undefined')) return [3 /*break*/, 6];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _NftService_instances, "m", _NftService_addNftOwnerStatus).call(this, filters.userAddress, res.nfts)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/, res];
                    case 7:
                        err_2 = _b.sent();
                        common_1.Logger.error('Error on nft filtered query, err: ' + err_2);
                        throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    NftService.prototype.byId = function (id, currency, incrViewCount, dbConn) {
        if (incrViewCount === void 0) { incrViewCount = true; }
        if (dbConn === void 0) { dbConn = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var nfts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findByIds([id], 'nft_id', 'asc', currency, false, dbConn)];
                    case 1:
                        nfts = _a.sent();
                        if (nfts.length === 0) {
                            throw new common_1.HttpException('NFT with the requested id does not exist', common_1.HttpStatus.BAD_REQUEST);
                        }
                        if (incrViewCount) {
                            __classPrivateFieldGet(this, _NftService_instances, "m", _NftService_incrementNftViewCount).call(this, id);
                        }
                        return [2 /*return*/, nfts[0]];
                }
            });
        });
    };
    NftService.prototype.getNftOwnerStatus = function (address, nftIds) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes, ownerStatuses, _i, _a, row;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT\n  idx_assets_nat AS nft_id,\n  'owned' AS owner_status,\n  assets_nat AS num_editions\nFROM onchain_kanvas.\"storage.ledger_live\" AS ledger_now\nWHERE ledger_now.idx_assets_address = $2\n  AND ledger_now.idx_assets_nat = ANY($3)\n\nUNION ALL\n\nSELECT\n  nft_id,\n  'pending' AS owner_status,\n  purchased_editions_pending_transfer(nft_id, $2, $1) as num_editions\nFROM UNNEST($3::integer[]) as nft_id\n\nORDER BY 1\n", [constants_1.MINTER_ADDRESS, address, nftIds])];
                    case 1:
                        qryRes = _b.sent();
                        ownerStatuses = {};
                        for (_i = 0, _a = qryRes.rows; _i < _a.length; _i++) {
                            row = _a[_i];
                            ownerStatuses[row.nft_id] = __spreadArray(__spreadArray([], (ownerStatuses[row.nft_id] || []), true), Array(Number(row.num_editions)).fill(row.owner_status), true);
                        }
                        return [2 /*return*/, ownerStatuses];
                }
            });
        });
    };
    NftService.prototype.findByIds = function (nftIds, orderBy, orderDirection, currency, inBaseUnit, dbConn) {
        if (orderBy === void 0) { orderBy = 'nft_id'; }
        if (orderDirection === void 0) { orderDirection = 'asc'; }
        if (currency === void 0) { currency = kanvas_api_lib_1.BASE_CURRENCY; }
        if (inBaseUnit === void 0) { inBaseUnit = false; }
        if (dbConn === void 0) { dbConn = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var nftsQryRes, err_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, dbConn.query("\nSELECT\n  nft_id,\n  nft_name,\n  description,\n  ipfs_hash,\n  artifact_uri,\n  display_uri,\n  thumbnail_uri,\n  price,\n  categories,\n  editions_size,\n  editions_reserved,\n  editions_owned,\n  nft_created_at,\n  launch_at\nFROM nfts_by_id($1, $2, $3)", [nftIds, orderBy, orderDirection])];
                    case 1:
                        nftsQryRes = _a.sent();
                        return [2 /*return*/, nftsQryRes.rows.map(function (nftRow) {
                                var _a, _b, _c;
                                var editions = Number(nftRow['editions_size']);
                                var reserved = Number(nftRow['editions_reserved']);
                                var owned = Number(nftRow['editions_owned']);
                                var launchAtMilliUnix = ((_a = nftRow['launch_at']) === null || _a === void 0 ? void 0 : _a.getTime()) || 0;
                                var nft = {
                                    id: nftRow['nft_id'],
                                    name: nftRow['nft_name'],
                                    description: nftRow['description'],
                                    ipfsHash: owned === 0 ? null : nftRow['ipfs_hash'],
                                    artifactUri: nftRow['artifact_uri'],
                                    displayUri: nftRow['display_uri'],
                                    thumbnailUri: nftRow['thumbnail_uri'],
                                    price: _this.currencyService.convertToCurrency(Number(nftRow['price']), currency, inBaseUnit),
                                    editionsSize: editions,
                                    editionsAvailable: editions - (reserved + owned),
                                    createdAt: Math.floor(nftRow['nft_created_at'].getTime() / 1000),
                                    launchAt: Math.floor(launchAtMilliUnix / 1000),
                                    categories: nftRow['categories'].map(function (categoryRow) {
                                        return {
                                            id: Number(categoryRow[0]),
                                            name: categoryRow[1],
                                            description: categoryRow[2]
                                        };
                                    })
                                };
                                (_b = nft.displayUri) !== null && _b !== void 0 ? _b : (nft.displayUri = nft.artifactUri);
                                (_c = nft.thumbnailUri) !== null && _c !== void 0 ? _c : (nft.thumbnailUri = nft.displayUri);
                                return nft;
                            })];
                    case 2:
                        err_3 = _a.sent();
                        common_1.Logger.error('Error on find nfts by ids query: ' + err_3);
                        throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    var _NftService_instances, _NftService_incrementNftViewCount, _NftService_addNftOwnerStatus;
    _NftService_instances = new WeakSet(), _NftService_incrementNftViewCount = function _NftService_incrementNftViewCount(id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.conn.query("\nUPDATE nft\nSET view_count = view_count + 1\nWHERE id = $1\n", [id]);
                return [2 /*return*/];
            });
        });
    }, _NftService_addNftOwnerStatus = function _NftService_addNftOwnerStatus(address, nfts) {
        return __awaiter(this, void 0, void 0, function () {
            var ownerStatuses, _i, nfts_1, nft;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNftOwnerStatus(address, nfts.map(function (nft) { return nft.id; }))];
                    case 1:
                        ownerStatuses = _a.sent();
                        for (_i = 0, nfts_1 = nfts; _i < nfts_1.length; _i++) {
                            nft = nfts_1[_i];
                            nft.ownerStatuses = ownerStatuses[nft.id];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    NftService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], NftService);
    return NftService;
}());
exports.NftService = NftService;
