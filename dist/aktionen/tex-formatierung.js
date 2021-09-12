"use strict";
/**
 * Formatiere das TeX-Markup der Aufgaben. Erstelle zum Beispiel Listenpunkte
 * aus a) b) und c)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.erzeugeListenElemente = void 0;
const helfer_1 = require("../helfer");
/**
 * @param dateiPfad - Der Dateipfad der TeX-Datei
 */
function erzeugeListenElemente(dateiPfad) {
    let inhalt = (0, helfer_1.leseDatei)(dateiPfad);
    inhalt = inhalt.replace(/\n(\(?[abcdefghijv]+\)\s*)/g, '\n%%\n% $1\n%%\n\n\\item ');
    (0, helfer_1.schreibeDatei)(dateiPfad, inhalt);
}
exports.erzeugeListenElemente = erzeugeListenElemente;
