/**
 * Formatiere das TeX-Markup der Aufgaben. Erstelle zum Beispiel Listenpunkte
 * aus a) b) und c)
 */
import { leseDatei, schreibeDatei } from '../helfer';
/**
 * @param dateiPfad - Der Dateipfad der TeX-Datei
 */
export function erzeugeListenElemente(dateiPfad) {
    let inhalt = leseDatei(dateiPfad);
    inhalt = inhalt.replace(/\n(\(?[abcdefghijv]+\)\s*)/g, '\n%%\n% $1\n%%\n\n\\item ');
    schreibeDatei(dateiPfad, inhalt);
}
//# sourceMappingURL=tex-formatierung.js.map