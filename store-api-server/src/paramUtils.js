"use strict";
exports.__esModule = true;
exports.validateRequestedCurrency = void 0;
var common_1 = require("@nestjs/common");
var kanvas_api_lib_1 = require("kanvas-api-lib");
function validateRequestedCurrency(currency) {
    if (!Object.keys(kanvas_api_lib_1.SUPPORTED_CURRENCIES).includes(currency)) {
        throw new common_1.HttpException("currency is not supported", common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.validateRequestedCurrency = validateRequestedCurrency;
