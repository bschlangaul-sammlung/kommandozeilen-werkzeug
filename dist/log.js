"use strict";
/**
 * ```js
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 * }
 * ```
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.gibLogEbene = exports.setzeLogEbene = exports.log = void 0;
const winston_1 = __importStar(require("winston"));
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'blue',
        verbose: 'cyan',
        debug: 'magenta'
    }
};
const console = new winston_1.default.transports.Console({
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.splat(), winston_1.format.simple()),
    level: 'error'
});
winston_1.default.addColors(customLevels.colors);
const logger = winston_1.default.createLogger({
    level: 'error',
    transports: [console],
    levels: customLevels.levels
});
/**
 * ```js
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 * }
 * ```
 */
function log(level, message, ...meta) {
    logger.log(level, message, ...meta);
}
exports.log = log;
function setzeLogEbene(ebene) {
    console.level = ebene;
}
exports.setzeLogEbene = setzeLogEbene;
function gibLogEbene() {
    return console.level;
}
exports.gibLogEbene = gibLogEbene;
