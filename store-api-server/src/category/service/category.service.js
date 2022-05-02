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
exports.CategoryService = void 0;
var common_1 = require("@nestjs/common");
var constants_1 = require("../../constants");
var CategoryService = /** @class */ (function () {
    function CategoryService(conn) {
        this.conn = conn;
    }
    CategoryService.prototype.search = function (str) {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(str === '')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getMostPopular()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.conn.query("\nSELECT id, category AS name, description\nFROM (\n  SELECT\n    id,\n    category,\n    description,\n    GREATEST(\n      word_similarity($1, category),\n      word_similarity($1, description)\n    ) AS similarity\n  FROM nft_category\n) AS inner_query\nWHERE similarity >= $2\nORDER BY similarity DESC, id\nLIMIT $3\n    ", [str, constants_1.SEARCH_SIMILARITY_LIMIT, constants_1.SEARCH_MAX_CATEGORIES])];
                    case 3:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows];
                }
            });
        });
    };
    CategoryService.prototype.getMostPopular = function () {
        return __awaiter(this, void 0, void 0, function () {
            var qryRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.conn.query("\nSELECT cat.id, cat.category AS name, cat.description\nFROM (\n  SELECT cat.id as cat_id, SUM(nft.view_count) AS view_count\n  FROM nft_category AS cat\n  JOIN mtm_nft_category AS mtm\n    ON mtm.nft_category_id = cat.id\n  JOIN nft\n    ON nft.id = mtm.nft_id\n  GROUP BY 1\n  ORDER BY 2 DESC\n  LIMIT $1\n) AS view_counts\nJOIN nft_category AS cat\n  on cat.id = view_counts.cat_id\nORDER BY view_count, cat.id\n", [constants_1.SEARCH_MAX_CATEGORIES])];
                    case 1:
                        qryRes = _a.sent();
                        return [2 /*return*/, qryRes.rows];
                }
            });
        });
    };
    CategoryService.prototype.findAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var categoriesQryRes, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.conn.query("\nSELECT id, category, description, parent\nFROM nft_category\nORDER BY COALESCE(parent, 0) DESC, id", [])];
                    case 1:
                        categoriesQryRes = _a.sent();
                        return [2 /*return*/, this.categoriesQryRespToEntities(categoriesQryRes.rows)];
                    case 2:
                        err_1 = _a.sent();
                        common_1.Logger.error('Error on get categories query, err: ' + err_1);
                        throw new common_1.HttpException('Something went wrong', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Note: this function expects inputs to be sorted on:
    //  parent DESC (and with parent == undefined last), id ASC
    CategoryService.prototype.categoriesQryRespToEntities = function (categoryRows) {
        if (categoryRows.length === 0) {
            return [];
        }
        var m = new Map();
        for (var _i = 0, categoryRows_1 = categoryRows; _i < categoryRows_1.length; _i++) {
            var row = categoryRows_1[_i];
            var entity = {
                id: row.id,
                name: row.category,
                description: row.description,
                children: []
            };
            if (m.has(row.id)) {
                entity.children = m.get(row.id);
                m["delete"](row.id);
            }
            var parent_1 = row.parent || 0;
            if (m.has(parent_1)) {
                m.get(parent_1).push(entity);
            }
            else {
                m.set(parent_1, [entity]);
            }
        }
        return m.get(0);
    };
    CategoryService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(constants_1.PG_CONNECTION))
    ], CategoryService);
    return CategoryService;
}());
exports.CategoryService = CategoryService;
