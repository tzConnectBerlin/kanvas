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
exports.MintService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var async_await_mutex_lock_1 = require("async-await-mutex-lock");
var MintService = /** @class */ (function () {
    function MintService(conn, ipfsService) {
        this.conn = conn;
        this.ipfsService = ipfsService;
        _MintService_instances.add(this);
        this.nftLock = new async_await_mutex_lock_1.Lock();
    }
    MintService.prototype.transfer_nfts = function (nfts, buyer_address) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, nfts_1, nft, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, nfts_1 = nfts;
                        _a.label = 1;
                    case 1:
                        if (!(_i < nfts_1.length)) return [3 /*break*/, 6];
                        nft = nfts_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MintService_instances, "m", _MintService_transfer_nft).call(this, nft, buyer_address)];
                    case 3:
                        _a.sent();
                        common_1.Logger.log("transfer created for nft (id=".concat(nft.id, ") to buyer (address=").concat(buyer_address, ")"));
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        common_1.Logger.error("failed to transfer nft (id=".concat(nft.id, ") to buyer (address=").concat(buyer_address, "), err: ").concat(err_1));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    var _MintService_instances, _MintService_transfer_nft, _MintService_mint, _MintService_insertCommand, _MintService_isNftSubmitted;
    _MintService_instances = new WeakSet(), _MintService_transfer_nft = function _MintService_transfer_nft(nft, buyer_address) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.nftLock.acquire(nft.id)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, , 7, 8]);
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MintService_instances, "m", _MintService_isNftSubmitted).call(this, nft)];
                    case 3:
                        if (!!(_a.sent())) return [3 /*break*/, 5];
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MintService_instances, "m", _MintService_mint).call(this, nft)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        cmd = {
                            handler: 'nft',
                            name: 'transfer',
                            args: {
                                token_id: nft.id,
                                from_address: constants_1.MINTER_ADDRESS,
                                to_address: buyer_address,
                                amount: 1
                            }
                        };
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MintService_instances, "m", _MintService_insertCommand).call(this, cmd)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        this.nftLock.release(nft.id);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }, _MintService_mint = function _MintService_mint(nft) {
        return __awaiter(this, void 0, void 0, function () {
            var metadataIpfs, cmd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ipfsService.uploadNft(nft)];
                    case 1:
                        metadataIpfs = _a.sent();
                        if (typeof metadataIpfs === 'undefined') {
                            throw "failed to upload nft to Ipfs";
                        }
                        cmd = {
                            handler: 'nft',
                            name: 'create_and_mint',
                            args: {
                                token_id: nft.id,
                                to_address: constants_1.MINTER_ADDRESS,
                                metadata_ipfs: metadataIpfs,
                                amount: nft.editionsSize
                            }
                        };
                        return [4 /*yield*/, __classPrivateFieldGet(this, _MintService_instances, "m", _MintService_insertCommand).call(this, cmd)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }, _MintService_insertCommand = function _MintService_insertCommand(cmd) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nINSERT INTO peppermint.operations (\n  originator, command\n)\nVALUES (\n  $1, $2\n)\n", [constants_1.MINTER_ADDRESS, cmd])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }, _MintService_isNftSubmitted = function _MintService_isNftSubmitted(nft) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT 1\nFROM onchain_kanvas.\"storage.token_metadata_live\"\nWHERE idx_assets_nat::INTEGER = $1\n\nUNION ALL\n\nSELECT 1\nFROM peppermint.operations\nWHERE command->>'handler' = 'nft'\n  AND command->>'name' = 'create_and_mint'\n  AND (command->'args'->>'token_id')::INTEGER = $1\n  AND state IN ('pending', 'processing', 'waiting')\n", [nft.id])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rowCount > 0];
                }
            });
        });
    };
    MintService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], MintService);
    return MintService;
}());
exports.MintService = MintService;
