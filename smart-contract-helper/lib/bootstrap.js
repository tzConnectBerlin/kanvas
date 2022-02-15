"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolkit = exports.activateAccounts = void 0;
const fs = __importStar(require("fs"));
const kleur = __importStar(require("kleur"));
const path = __importStar(require("path"));
const signer_1 = require("@taquito/signer");
const taquito_1 = require("@taquito/taquito");
function activateAccounts() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (let owner of ['owner', 'bob', 'alice']) {
                const faucet = JSON.parse(fs.readFileSync(path.join(__dirname, `../ligo/faucets/${owner}_faucet.json`)).toString());
                const signer = yield signer_1.InMemorySigner.fromFundraiser(faucet.email, faucet.password, faucet.mnemonic.join(' '));
                yield activateFaucet(signer, faucet.secret);
            }
        }
        catch (error) {
            console.log(kleur.red(error));
            console.log(kleur.yellow('No owner found for the specified name, try : owner, bob, or alice'));
        }
    });
}
exports.activateAccounts = activateAccounts;
function activateFaucet(signer, secret) {
    return __awaiter(this, void 0, void 0, function* () {
        const address = yield signer.publicKeyHash();
        const toolkit = createToolkit(signer);
        const bal = yield toolkit.tz.getBalance(address);
        if (bal.eq(0)) {
            console.log(kleur.yellow('Activating faucet account...'));
            const op = yield toolkit.tz.activate(address, secret);
            yield op.confirmation();
            console.log(kleur.green('Faucet account activated'));
        }
        else {
            console.log(kleur.yellow('Accounts already activated.'));
        }
    });
}
function createToolkit(signer) {
    const toolkit = new taquito_1.TezosToolkit('https://florencenet.smartpy.io');
    toolkit.setProvider({
        signer: signer,
        config: { confirmationPollingIntervalSecond: 5 }
    });
    return toolkit;
}
exports.createToolkit = createToolkit;
//# sourceMappingURL=bootstrap.js.map