"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.SearchParam = exports.FilterParams = exports.PaginationParams = void 0;
var common_1 = require("@nestjs/common");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var PaginationParams = /** @class */ (function () {
    function PaginationParams() {
        this.page = 1;
        this.pageSize = 10;
        this.orderDirection = 'asc';
        this.orderBy = 'id';
    }
    __decorate([
        (0, class_validator_1.IsInt)(),
        (0, class_transformer_1.Type)(function () { return Number; }),
        (0, class_validator_1.IsOptional)()
    ], PaginationParams.prototype, "page");
    __decorate([
        (0, class_validator_1.IsInt)(),
        (0, class_transformer_1.Type)(function () { return Number; }),
        (0, class_validator_1.IsOptional)()
    ], PaginationParams.prototype, "pageSize");
    __decorate([
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsOptional)()
    ], PaginationParams.prototype, "orderDirection");
    __decorate([
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsOptional)()
    ], PaginationParams.prototype, "orderBy");
    __decorate([
        (0, class_validator_1.IsInt)(),
        (0, class_transformer_1.Type)(function () { return Number; }),
        (0, class_validator_1.IsOptional)()
    ], PaginationParams.prototype, "firstRequestAt");
    return PaginationParams;
}());
exports.PaginationParams = PaginationParams;
var FilterParams = /** @class */ (function (_super) {
    __extends(FilterParams, _super);
    function FilterParams() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    __decorate([
        (0, class_validator_1.IsArray)(),
        (0, class_transformer_1.Transform)(function (_a) {
            var value = _a.value;
            return value
                ? parseStringArray(value, ',').map(function (v) { return parseNumberParam(v); })
                : undefined;
        }),
        (0, class_validator_1.IsOptional)()
    ], FilterParams.prototype, "categories");
    __decorate([
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsOptional)()
    ], FilterParams.prototype, "userAddress");
    __decorate([
        (0, class_validator_1.IsNumber)(),
        (0, class_transformer_1.Type)(function () { return Number; }),
        (0, class_validator_1.IsOptional)()
    ], FilterParams.prototype, "priceAtLeast");
    __decorate([
        (0, class_validator_1.IsNumber)(),
        (0, class_transformer_1.Type)(function () { return Number; }),
        (0, class_validator_1.IsOptional)()
    ], FilterParams.prototype, "priceAtMost");
    __decorate([
        (0, class_validator_1.IsArray)(),
        (0, class_transformer_1.Transform)(function (_a) {
            var value = _a.value;
            return (value ? parseStringArray(value, ',') : undefined);
        }),
        (0, class_validator_1.IsOptional)()
    ], FilterParams.prototype, "availability");
    return FilterParams;
}(PaginationParams));
exports.FilterParams = FilterParams;
var SearchParam = /** @class */ (function () {
    function SearchParam() {
    }
    __decorate([
        (0, class_validator_1.IsString)()
    ], SearchParam.prototype, "searchString");
    return SearchParam;
}());
exports.SearchParam = SearchParam;
function parseStringArray(v, sep) {
    if (typeof v !== 'string') {
        return v;
    }
    return v.split(sep);
}
function parseNumberParam(v) {
    var res = Number(v);
    if (isNaN(res)) {
        throw new common_1.HttpException("".concat(v, " is not a number"), common_1.HttpStatus.BAD_REQUEST);
    }
    return res;
}
