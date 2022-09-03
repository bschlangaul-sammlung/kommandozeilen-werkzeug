"use strict";
/**
 * Rufe externe Kommandzeilen-Befehle auf.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.löscheGeradeSeitenInPdf = exports.exportiereTxtAusPdf = exports.rotierePdf = exports.erkenneTextInPdf = void 0;
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
function erkenneTextInPdf(datei) {
    const process = child_process_1.default.spawnSync('ocrmypdf', [
        '--deskew',
        '--rotate-pages',
        '-l',
        'deu+eng',
        '--sidecar',
        `${datei}.txt`,
        datei,
        datei
    ], { encoding: 'utf-8' });
    if (process.status !== 0) {
        console.log(process.stderr);
    }
}
exports.erkenneTextInPdf = erkenneTextInPdf;
function rotierePdf(datei) {
    const process = child_process_1.default.spawnSync('pdftk', [
        datei,
        'cat',
        '1-endeast',
        'output',
        '--sidecar',
        `${datei}_rotated.pdf`
    ]);
    if (process.status !== 0) {
        console.log(process.stderr);
    }
}
exports.rotierePdf = rotierePdf;
function exportiereTxtAusPdf(datei) {
    if (datei.includes('.pdf')) {
        console.log(datei);
        const txt = datei.replace('.pdf', '.txt');
        if (!fs_1.default.existsSync(txt)) {
            child_process_1.default.spawnSync('pdftotext', [datei]);
        }
    }
}
exports.exportiereTxtAusPdf = exportiereTxtAusPdf;
function löscheGeradeSeitenInPdf(datei) {
    child_process_1.default.spawnSync('pdftk', [
        `A=${datei}`,
        'cat',
        'Aodd',
        'output',
        `${datei}_ungerade.pdf`
    ]);
}
exports.löscheGeradeSeitenInPdf = löscheGeradeSeitenInPdf;
//# sourceMappingURL=externe-befehle.js.map