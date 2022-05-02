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
exports.withTransaction = exports.DbModule = void 0;
var common_1 = require("@nestjs/common");
var utils_1 = require("./utils");
var constants_1 = require("./constants");
var pg_1 = require("pg");
var Pool = require("pg-pool");
// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
pg_1.types.setTypeParser(1114 /* TIMESTAMP WITHOUT TIME ZONE type */, function (stringValue) {
    return new Date(stringValue + '+0000');
});
var wrapPool = {
    provide: 'PG_POOL_WRAP',
    useValue: { dbPool: undefined }
};
var dbProvider = {
    provide: constants_1.PG_CONNECTION,
    inject: ['PG_POOL_WRAP'],
    useFactory: function (w) {
        if (typeof w.dbPool !== 'undefined') {
            return w.dbPool;
        }
        w.dbPool = new Pool({
            host: (0, utils_1.assertEnv)('PGHOST'),
            port: Number((0, utils_1.assertEnv)('PGPORT')),
            user: (0, utils_1.assertEnv)('PGUSER'),
            password: (0, utils_1.assertEnv)('PGPASSWORD'),
            database: (0, utils_1.assertEnv)('PGDATABASE')
        });
        return w.dbPool;
    }
};
var DbModule = /** @class */ (function () {
    function DbModule(w) {
        this.w = w;
    }
    DbModule.prototype.onModuleDestroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof this.w.dbPool === 'undefined') {
                            common_1.Logger.warn("pool already uninitialized! stacktrace: ".concat(new Error().stack));
                            return [2 /*return*/];
                        }
                        common_1.Logger.log('closing db connection..');
                        return [4 /*yield*/, this.w.dbPool.end()];
                    case 1:
                        _a.sent();
                        this.w.dbPool = undefined;
                        common_1.Logger.log('db connection closed');
                        return [2 /*return*/];
                }
            });
        });
    };
    DbModule = __decorate([
        (0, common_1.Module)({
            providers: [wrapPool, dbProvider],
            exports: [dbProvider]
        }),
        __param(0, (0, common_1.Inject)('PG_POOL_WRAP'))
    ], DbModule);
    return DbModule;
}());
exports.DbModule = DbModule;
function withTransaction(dbPool, f) {
    return __awaiter(this, void 0, void 0, function () {
        var dbTx, res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dbPool.connect()];
                case 1:
                    dbTx = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, 7, 8]);
                    return [4 /*yield*/, f(dbTx)];
                case 3:
                    res = _a.sent();
                    return [4 /*yield*/, dbTx.query("COMMIT")];
                case 4:
                    _a.sent();
                    return [2 /*return*/, res];
                case 5:
                    err_1 = _a.sent();
                    return [4 /*yield*/, dbTx.query("ROLLBACK")];
                case 6:
                    _a.sent();
                    throw err_1;
                case 7:
                    dbTx.release();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.withTransaction = withTransaction;
