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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
exports.__esModule = true;
exports.IpfsService = void 0;
/* eslint-disable  @typescript-eslint/no-non-null-assertion */
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var axios_1 = require("axios");
var axios_retry_1 = require("axios-retry");
var fs_1 = require("fs");
var FormData = require("form-data");
var tmp = require("tmp");
(0, axios_retry_1["default"])(axios_1["default"], {
    retries: 3
});
function downloadFile(uri, targetFile) {
    return __awaiter(this, void 0, void 0, function () {
        var writer, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    writer = (0, fs_1.createWriteStream)(targetFile);
                    return [4 /*yield*/, axios_1["default"].get(uri, {
                            responseType: 'stream'
                        })];
                case 1:
                    response = _a.sent();
                    response.data.pipe(writer);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        })];
            }
        });
    });
}
var IpfsService = /** @class */ (function () {
    function IpfsService(conn) {
        this.conn = conn;
        _IpfsService_instances.add(this);
        this.PINATA_API_KEY = process.env['PINATA_API_KEY'];
        this.PINATA_API_SECRET = process.env['PINATA_API_SECRET'];
    }
    IpfsService.prototype.uploadNft = function (nft, dbTx) {
        var _a;
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            var qryRes, _b, artifactIpfsUri, displayIpfsUri, thumbnailIpfsUri, _c, metadata, ipfsHash;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!__classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_serviceEnabled).call(this)) {
                            common_1.Logger.warn("IpfsService not enabled");
                            return [2 /*return*/, undefined];
                        }
                        return [4 /*yield*/, dbTx.query("\nSELECT ipfs_hash, signature\nFROM nft\nWHERE id = $1\n    ", [nft.id])];
                    case 1:
                        qryRes = _d.sent();
                        if (qryRes.rows[0]['ipfs_hash'] != null) {
                            return [2 /*return*/, qryRes.rows[0]['ipfs_hash']];
                        }
                        return [4 /*yield*/, __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_pinUri).call(this, nft.artifactUri)];
                    case 2:
                        _c = [
                            _d.sent()
                        ];
                        return [4 /*yield*/, (nft.displayUri !== nft.artifactUri
                                ? __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_pinUri).call(this, nft.displayUri)
                                : undefined)];
                    case 3:
                        _c = _c.concat([
                            _d.sent()
                        ]);
                        return [4 /*yield*/, (nft.thumbnailUri !== nft.displayUri
                                ? __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_pinUri).call(this, nft.thumbnailUri)
                                : undefined)];
                    case 4:
                        _b = _c.concat([
                            _d.sent()
                        ]), artifactIpfsUri = _b[0], displayIpfsUri = _b[1], thumbnailIpfsUri = _b[2];
                        metadata = __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_nftMetadataJson).call(this, nft, artifactIpfsUri, displayIpfsUri !== null && displayIpfsUri !== void 0 ? displayIpfsUri : artifactIpfsUri, (_a = thumbnailIpfsUri !== null && thumbnailIpfsUri !== void 0 ? thumbnailIpfsUri : displayIpfsUri) !== null && _a !== void 0 ? _a : artifactIpfsUri, qryRes.rows[0]['signature']);
                        return [4 /*yield*/, __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_pinJson).call(this, metadata)];
                    case 5:
                        ipfsHash = _d.sent();
                        return [4 /*yield*/, __classPrivateFieldGet(this, _IpfsService_instances, "m", _IpfsService_updateNftIpfsHash).call(this, nft.id, ipfsHash, dbTx)];
                    case 6:
                        _d.sent();
                        return [2 /*return*/, ipfsHash];
                }
            });
        });
    };
    var _IpfsService_instances, _IpfsService_updateNftIpfsHash, _IpfsService_nftMetadataJson, _IpfsService_pinUri, _IpfsService_pinJson, _IpfsService_serviceEnabled;
    _IpfsService_instances = new WeakSet(), _IpfsService_updateNftIpfsHash = function _IpfsService_updateNftIpfsHash(nftId, ipfsHash, dbTx) {
        if (dbTx === void 0) { dbTx = this.conn; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dbTx.query("\nUPDATE nft\nSET ipfs_hash = $1\nWHERE id = $2\n      ", [ipfsHash, nftId])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }, _IpfsService_nftMetadataJson = function _IpfsService_nftMetadataJson(nft, artifactIpfsUri, displayIpfsUri, thumbnailIpfsUri, signature) {
        var createdAt = new Date(nft.createdAt * 1000).toISOString();
        return {
            decimals: 0,
            name: nft.name,
            description: nft.description,
            date: createdAt,
            tags: nft.categories.map(function (cat) { return cat.name; }),
            artifactUri: artifactIpfsUri,
            displayUri: displayIpfsUri,
            thumbnailUri: thumbnailIpfsUri,
            minter: constants_1.MINTER_ADDRESS,
            creators: [],
            contributors: [],
            publishers: constants_1.STORE_PUBLISHERS,
            isBooleanAmount: nft.editionsSize === 1,
            signature: signature
        };
    }, _IpfsService_pinUri = function _IpfsService_pinUri(uri) {
        return __awaiter(this, void 0, void 0, function () {
            var tmpFile, tmpFileName, form;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tmpFile = tmp.fileSync();
                        tmpFileName = tmpFile.name;
                        return [4 /*yield*/, downloadFile(uri, tmpFileName)];
                    case 1:
                        _a.sent();
                        form = new FormData();
                        form.append('file', (0, fs_1.createReadStream)(tmpFileName));
                        return [2 /*return*/, axios_1["default"]
                                .post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
                                headers: __assign({ pinata_api_key: this.PINATA_API_KEY || '', pinata_secret_api_key: this.PINATA_API_SECRET || '' }, form.getHeaders())
                            })
                                .then(function (response) {
                                tmpFile.removeCallback();
                                return 'ipfs://' + response.data.IpfsHash;
                            })["catch"](function (error) {
                                common_1.Logger.error("failed to pin content from uri (downloaded to file: ".concat(tmpFileName, ")to ipfs, err: ").concat(error));
                                tmpFile.removeCallback();
                                throw error;
                            })];
                }
            });
        });
    }, _IpfsService_pinJson = function _IpfsService_pinJson(jsonData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, axios_1["default"]
                        .post('https://api.pinata.cloud/pinning/pinJSONToIPFS', jsonData, {
                        headers: {
                            pinata_api_key: this.PINATA_API_KEY || '',
                            pinata_secret_api_key: this.PINATA_API_SECRET || ''
                        }
                    })
                        .then(function (response) {
                        return 'ipfs://' + response.data.IpfsHash;
                    })["catch"](function (error) {
                        common_1.Logger.error("failed to pin JSON to IPFS (JSON=".concat(jsonData, "), err: ").concat(error));
                        throw error;
                    })];
            });
        });
    }, _IpfsService_serviceEnabled = function _IpfsService_serviceEnabled() {
        if (typeof this.PINATA_API_KEY === 'undefined') {
            common_1.Logger.warn("failed to upload NFT to IPFS, IpfsService not enabled: PINATA_API_KEY env var not set");
            return false;
        }
        if (typeof this.PINATA_API_SECRET === 'undefined') {
            common_1.Logger.warn("failed to upload NFT to IPFS, IpfsService not enabled: PINATA_API_SECRET env var not set");
            return false;
        }
        return true;
    };
    IpfsService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], IpfsService);
    return IpfsService;
}());
exports.IpfsService = IpfsService;
