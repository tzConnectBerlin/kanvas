"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.CookieSessionMiddleware = void 0;
var common_1 = require("@nestjs/common");
var cookieSession = require("cookie-session");
var uuid_1 = require("uuid");
var utils_1 = require("../utils");
var CookieSessionMiddleware = /** @class */ (function () {
    function CookieSessionMiddleware() {
        this.options = {
            secret: (0, utils_1.assertEnv)('JWT_SECRET'),
            maxAge: 24 * 60 * 60 * 1000
        };
    }
    CookieSessionMiddleware.prototype.use = function (req, resp, next) {
        cookieSession(this.options)(req, resp, function () {
            if (typeof req.session.uuid === 'undefined') {
                req.session.uuid = (0, uuid_1.v4)();
            }
            next();
        });
    };
    CookieSessionMiddleware = __decorate([
        (0, common_1.Injectable)()
    ], CookieSessionMiddleware);
    return CookieSessionMiddleware;
}());
exports.CookieSessionMiddleware = CookieSessionMiddleware;
