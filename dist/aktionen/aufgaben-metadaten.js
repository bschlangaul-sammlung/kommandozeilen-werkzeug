"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.macheAufgabenMetadatenPlist = exports.schreibe = void 0;
const path_1 = __importDefault(require("path"));
const aufgabe_1 = require("../aufgabe");
const helfer_1 = require("../helfer");
const tex_1 = require("../tex");
function schreibe(dateiPfad, aufgabenInhalt, titelTexMakro) {
    let aufgabenTitelErsetzt;
    titelTexMakro += '\n';
    if (aufgabenInhalt.includes('\\bAufgabenMetadaten{')) {
        // /s s (dotall) modifier, +? one or more (non-greedy)
        const regexp = new RegExp(/\\bAufgabenMetadaten\{.+?,?\n\}\n/, 's');
        aufgabenTitelErsetzt = aufgabenInhalt.replace(regexp, titelTexMakro);
    }
    else {
        aufgabenTitelErsetzt = aufgabenInhalt.replace(/(\\begin\{document\})/, '$1\n' + titelTexMakro);
    }
    if (aufgabenInhalt !== aufgabenTitelErsetzt) {
        (0, helfer_1.schreibeDatei)(dateiPfad, aufgabenTitelErsetzt);
        return true;
    }
    return false;
}
exports.schreibe = schreibe;
function macheAufgabenMetadatenPlist(meta) {
    return (0, tex_1.machePlist)('bAufgabenMetadaten', meta, [
        'Titel',
        'Thematik',
        'ZitatBeschreibung',
        'Stichwoerter',
        'Ueberprueft'
    ]);
}
exports.macheAufgabenMetadatenPlist = macheAufgabenMetadatenPlist;
/**
 * ```latex
 * \bAufgabenMetadaten{
 *   Titel = Aufgabe 2,
 *   Thematik = Petri-Netz,
 *   RelativerPfad = Staatsexamen/46116/2016/03/Thema-2/Teilaufgabe-1/Aufgabe-2.tex,
 *   ZitatSchluessel = sosy:pu:4,
 *   EinzelpruefungsNr = 46116,
 *   Jahr = 2016,
 *   Monat = 03,
 *   ThemaNr = 2,
 *   TeilaufgabeNr = 1,
 *   AufgabeNr = 2,
 * }
 * ```
 */
function default_1(dateiPfad) {
    dateiPfad = path_1.default.resolve(dateiPfad);
    const aufgabenSammlung = (0, aufgabe_1.gibAufgabenSammlung)();
    const aufgabe = aufgabenSammlung.gib(dateiPfad);
    const texPlist = (0, tex_1.machePlist)('bAufgabenMetadaten', aufgabe.erzeugeMetadaten(), ['Titel', 'Thematik', 'ZitatBeschreibung', 'Stichwoerter']);
    if (aufgabe.inhalt !== null) {
        const inhalt = aufgabe.inhalt;
        schreibe(dateiPfad, inhalt, texPlist);
    }
    console.log(texPlist);
}
exports.default = default_1;
//# sourceMappingURL=aufgaben-metadaten.js.map