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
exports.UserService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var ts_results_1 = require("ts-results");
var schedule_1 = require("@nestjs/schedule");
var utils_1 = require("../../utils");
var db_module_1 = require("../../db.module");
var generate = require('meaningful-string');
var UserService = /** @class */ (function () {
    function UserService(conn, s3Service, mintService, currencyService, nftService) {
        this.conn = conn;
        this.s3Service = s3Service;
        this.mintService = mintService;
        this.currencyService = currencyService;
        this.nftService = nftService;
        this.RANDOM_NAME_OPTIONS = {
            numberUpto: 20,
            joinBy: '_'
        };
        this.RANDOM_NAME_MAX_RETRIES = 5;
        this.CART_EXPIRATION_MILLI_SECS = Number((0, utils_1.assertEnv)('CART_EXPIRATION_MILLI_SECS'));
    }
    UserService.prototype.create = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var generateRandomName, lastErr, i, qryRes, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        generateRandomName = typeof user.userName === 'undefined';
                        lastErr = null;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.RANDOM_NAME_MAX_RETRIES)) return [3 /*break*/, 6];
                        if (generateRandomName) {
                            user.userName = generate.meaningful(this.RANDOM_NAME_OPTIONS);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.conn.query("\nINSERT INTO kanvas_user(\n  user_name, address, signed_payload\n)\nVALUES ($1, $2, $3)\nRETURNING id", [user.userName, user.userAddress, user.signedPayload])];
                    case 3:
                        qryRes = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, user), { id: qryRes.rows[0]['id'] })];
                    case 4:
                        err_1 = _a.sent();
                        if (!generateRandomName || (err_1 === null || err_1 === void 0 ? void 0 : err_1.code) !== constants_1.PG_UNIQUE_VIOLATION_ERRCODE) {
                            throw err_1;
                        }
                        lastErr = err_1;
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: throw lastErr;
                }
            });
        });
    };
    UserService.prototype.isNameAvailable = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT 1\nFROM kanvas_user\nWHERE user_name = $1\n    ", [name])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rowCount === 0];
                }
            });
        });
    };
    UserService.prototype.edit = function (userId, name, picture) {
        return __awaiter(this, void 0, void 0, function () {
            var profilePicture, fileName, s3PathRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof picture !== 'undefined')) return [3 /*break*/, 2];
                        fileName = "profilePicture_".concat(userId);
                        return [4 /*yield*/, this.s3Service.uploadFile(picture, fileName)];
                    case 1:
                        s3PathRes = _a.sent();
                        if (!s3PathRes.ok) {
                            throw s3PathRes.val;
                        }
                        profilePicture = s3PathRes.val;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.conn.query("\nUPDATE kanvas_user\nSET\n  user_name = coalesce($2, user_name),\n  picture_url = coalesce($3, picture_url)\nWHERE id = $1\n", [userId, name, profilePicture])];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserService.prototype.findByAddress = function (addr) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT\n  usr.id,\n  usr.user_name,\n  usr.address,\n  usr.picture_url,\n  usr.signed_payload,\n  usr.created_at\nFROM kanvas_user usr\nWHERE address = $1\n", [addr])];
                    case 1:
                        qryRes = _a.sent();
                        if (qryRes.rows.length === 0) {
                            return [2 /*return*/, new ts_results_1.Err("no user found with address=".concat(addr))];
                        }
                        res = {
                            id: qryRes.rows[0]['id'],
                            userName: qryRes.rows[0]['user_name'],
                            userAddress: qryRes.rows[0]['address'],
                            createdAt: Math.floor(qryRes.rows[0]['created_at'].getTime() / 1000),
                            profilePicture: qryRes.rows[0]['picture_url'],
                            signedPayload: qryRes.rows[0]['signed_payload']
                        };
                        return [2 /*return*/, (0, ts_results_1.Ok)(res)];
                }
            });
        });
    };
    UserService.prototype.getProfile = function (address, currency) {
        return __awaiter(this, void 0, void 0, function () {
            var userRes, user, userNfts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findByAddress(address)];
                    case 1:
                        userRes = _a.sent();
                        if (!userRes.ok) {
                            return [2 /*return*/, userRes];
                        }
                        user = userRes.val;
                        delete user.signedPayload;
                        return [4 /*yield*/, this.nftService.findNftsWithFilter({
                                page: 1,
                                pageSize: 1,
                                orderBy: 'id',
                                orderDirection: 'asc',
                                firstRequestAt: undefined,
                                categories: undefined,
                                userAddress: address,
                                availability: undefined
                            }, currency)];
                    case 2:
                        userNfts = _a.sent();
                        return [2 /*return*/, new ts_results_1.Ok({
                                user: user,
                                nftCount: userNfts.numberOfPages
                            })];
                }
            });
        });
    };
    UserService.prototype.getNftOwnershipStatuses = function (user, nftIds) {
        return __awaiter(this, void 0, void 0, function () {
            var statuses;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nftService.getNftOwnerStatus(user.userAddress, nftIds)];
                    case 1:
                        statuses = _a.sent();
                        return [2 /*return*/, Object.keys(statuses).map(function (nftId) {
                                return {
                                    nftId: nftId,
                                    ownerStatuses: statuses[nftId]
                                };
                            })];
                }
            });
        });
    };
    UserService.prototype.getUserCartSession = function (userId, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nSELECT cart_session\nFROM kanvas_user\nWHERE id = $1", [userId])];
                    case 1:
                        qryRes = _a.sent();
                        if (qryRes.rowCount === 0) {
                            return [2 /*return*/, (0, ts_results_1.Err)("getUserCartSession err: user with id ".concat(userId, " does not exist"))];
                        }
                        return [2 /*return*/, (0, ts_results_1.Ok)(qryRes.rows[0]['cart_session'])];
                }
            });
        });
    };
    UserService.prototype.getTopBuyers = function (currency) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT\n  usr.id AS user_id,\n  usr.user_name,\n  usr.address AS user_address,\n  usr.picture_url AS profile_pic_url,\n  SUM(nft.price) AS total_paid\nFROM mtm_kanvas_user_nft AS mtm\nJOIN nft\n  ON nft.id = mtm.nft_id\njoin kanvas_user AS usr\n  ON usr.id = mtm.kanvas_user_id\nGROUP BY 1, 2, 3, 4\nORDER BY 5 DESC\nLIMIT $1\n      ", [constants_1.NUM_TOP_BUYERS])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows.map(function (row) {
                                return ({
                                    userId: row['user_id'],
                                    userName: row['user_name'],
                                    userAddress: row['user_address'],
                                    userPicture: row['profile_pic_url'],
                                    totalPaid: _this.currencyService.convertToCurrency(row['total_paid'], currency)
                                });
                            })];
                }
            });
        });
    };
    UserService.prototype.ensureUserCartSession = function (userId, session) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes, oldSession, newSession;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.touchCart(session)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.conn.query("\nUPDATE kanvas_user AS update\nSET cart_session = coalesce((\n    SELECT session_id\n    FROM cart_session AS cart\n    JOIN mtm_cart_session_nft AS mtm\n      on mtm.cart_session_id = cart.id\n    WHERE session_id = $2\n    LIMIT 1\n  ), original.cart_session, $2)\nFROM kanvas_user AS original\nWHERE update.id = $1\n  AND original.id = update.id\nRETURNING\n  update.cart_session AS new_session,\n  original.cart_session AS old_session", [userId, session])];
                    case 2:
                        qryRes = _a.sent();
                        oldSession = qryRes.rows[0]['old_session'];
                        newSession = qryRes.rows[0]['new_session'];
                        if (oldSession !== newSession) {
                            this.conn.query("\nDELETE FROM cart_session\nWHERE session_id = $1\n", [oldSession]);
                        }
                        return [2 /*return*/, newSession];
                }
            });
        });
    };
    UserService.prototype.cartList = function (session, currency, inBaseUnit, dbTx) {
        if (inBaseUnit === void 0) { inBaseUnit = false; }
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var cartMeta, nftIds;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getCartMeta(session, dbTx)];
                    case 1:
                        cartMeta = _b.sent();
                        if (typeof cartMeta === 'undefined') {
                            return [2 /*return*/, {
                                    nfts: [],
                                    expiresAt: undefined
                                }];
                        }
                        return [4 /*yield*/, this.getCartNftIds(cartMeta.id, dbTx)];
                    case 2:
                        nftIds = _b.sent();
                        if (nftIds.length === 0) {
                            return [2 /*return*/, {
                                    nfts: [],
                                    expiresAt: undefined
                                }];
                        }
                        _a = {};
                        return [4 /*yield*/, this.nftService.findByIds(nftIds, 'nft_id', 'asc', currency, inBaseUnit)];
                    case 3: return [2 /*return*/, (_a.nfts = _b.sent(),
                            _a.expiresAt = cartMeta.expiresAt,
                            _a)];
                }
            });
        });
    };
    UserService.prototype.getCartNftIds = function (cartId, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nSELECT nft_id\nFROM mtm_cart_session_nft\nWHERE cart_session_id = $1", [cartId])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows.map(function (row) { return row['nft_id']; })];
                }
            });
        });
    };
    UserService.prototype.cartAdd = function (session, nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var cartMeta;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.touchCart(session)];
                    case 1:
                        cartMeta = _a.sent();
                        return [4 /*yield*/, (0, db_module_1.withTransaction)(this.conn, function (dbTx) { return __awaiter(_this, void 0, void 0, function () {
                                var qryRes;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, dbTx.query("\nINSERT INTO mtm_cart_session_nft(\n  cart_session_id, nft_id\n)\nVALUES ($1, $2)", [cartMeta.id, nftId])];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, dbTx.query("\nSELECT\n  (SELECT reserved + owned FROM nft_editions_locked($1)) AS editions_locked,\n  nft.editions_size,\n  nft.launch_at\nFROM nft\nWHERE nft.id = $1", [nftId])];
                                        case 2:
                                            qryRes = _a.sent();
                                            if (qryRes.rows[0]['editions_locked'] > qryRes.rows[0]['editions_size']) {
                                                throw new common_1.HttpException('All editions of this nft have been reserved/bought', common_1.HttpStatus.BAD_REQUEST);
                                            }
                                            if (qryRes.rows[0]['launch_at'] > new Date()) {
                                                throw new common_1.HttpException('This nft is not yet for sale', common_1.HttpStatus.BAD_REQUEST);
                                            }
                                            return [4 /*yield*/, this.resetCartExpiration(cartMeta.id, dbTx)];
                                        case 3:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UserService.prototype.cartRemove = function (session, nftId) {
        return __awaiter(this, void 0, void 0, function () {
            var cartMeta, qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.touchCart(session)];
                    case 1:
                        cartMeta = _a.sent();
                        return [4 /*yield*/, this.conn.query("\nDELETE FROM mtm_cart_session_nft\nWHERE cart_session_id = $1\n  AND nft_id = $2", [cartMeta.id, nftId])];
                    case 2:
                        qryRes = _a.sent();
                        if (qryRes.rowCount === 0) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.resetCartExpiration(cartMeta.id)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    UserService.prototype.resetCartExpiration = function (cartId, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var expiresAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expiresAt = this.newCartExpiration();
                        return [4 /*yield*/, dbTx.query("\nUPDATE cart_session\nSET expires_at = $2\nWHERE id = $1\n  ", [cartId, expiresAt.toUTCString()])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserService.prototype.touchCart = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var cartMeta, expiresAt, qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCartMeta(session)];
                    case 1:
                        cartMeta = _a.sent();
                        if (typeof cartMeta !== 'undefined') {
                            return [2 /*return*/, cartMeta];
                        }
                        expiresAt = this.newCartExpiration();
                        return [4 /*yield*/, this.conn.query("\nINSERT INTO cart_session (\n  session_id, expires_at\n)\nVALUES ($1, $2)\nRETURNING id, expires_at", [session, expiresAt.toUTCString()])];
                    case 2:
                        qryRes = _a.sent();
                        return [2 /*return*/, {
                                id: qryRes.rows[0]['id'],
                                expiresAt: qryRes.rows[0]['expires_at']
                            }];
                }
            });
        });
    };
    UserService.prototype.deleteCartSession = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\n      DELETE FROM\n      cart_session\n      WHERE order_id = $1\n    ", [orderId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserService.prototype.getCartMeta = function (session, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nSELECT id, expires_at, order_id\nFROM cart_session\nWHERE session_id = $1\nORDER BY expires_at DESC\n      ", [session])];
                    case 1:
                        qryRes = _a.sent();
                        if (qryRes.rows.length === 0) {
                            return [2 /*return*/, undefined];
                        }
                        return [2 /*return*/, {
                                id: qryRes.rows[0]['id'],
                                expiresAt: qryRes.rows[0]['expires_at'],
                                orderId: qryRes.rows[0]['order_id']
                            }];
                }
            });
        });
    };
    UserService.prototype.deleteExpiredCarts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var deletedSessions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nDELETE FROM cart_session AS sess\nWHERE expires_at < now() AT TIME ZONE 'UTC'\n  AND (\n    sess.order_id IS NULL OR (SELECT status FROM payment where payment.nft_order_id = sess.order_id) NOT IN ('processing')\n  )\nRETURNING session_id")];
                    case 1:
                        deletedSessions = _a.sent();
                        if (deletedSessions.rows.length === 0) {
                            return [2 /*return*/];
                        }
                        common_1.Logger.warn("deleted following expired cart sessions: ".concat(deletedSessions.rows.map(function (row) { return row.session_id; })));
                        return [2 /*return*/];
                }
            });
        });
    };
    UserService.prototype.newCartExpiration = function () {
        var expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + this.CART_EXPIRATION_MILLI_SECS);
        return expiresAt;
    };
    UserService.prototype.getCartSession = function (cookieSession, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof user === 'undefined') {
                            return [2 /*return*/, cookieSession.uuid];
                        }
                        return [4 /*yield*/, this.ensureUserCartSession(user.id, cookieSession.uuid)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE)
    ], UserService.prototype, "deleteExpiredCarts");
    UserService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], UserService);
    return UserService;
}());
exports.UserService = UserService;
