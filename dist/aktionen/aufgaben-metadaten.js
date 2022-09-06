import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { gibAufgabenSammlung } from '../aufgabe';
import { schreibeDatei } from '../helfer';
import { machePlist } from '../tex';
export function schreibe(dateiPfad, aufgabenInhalt, titelTexMakro) {
    let aufgabenTitelErsetzt;
    titelTexMakro += '\n';
    if (aufgabenInhalt.includes('\\bAufgabenMetadaten{')) {
        // /s s (dotall) modifier, +? one or more (non-greedy)
        const regexp = /\\bAufgabenMetadaten\{.+?,?\n\}\n/s;
        aufgabenTitelErsetzt = aufgabenInhalt.replace(regexp, titelTexMakro);
    }
    else {
        aufgabenTitelErsetzt = aufgabenInhalt.replace(/(\\begin\{document\})/, '$1\n' + titelTexMakro);
    }
    if (aufgabenInhalt !== aufgabenTitelErsetzt) {
        schreibeDatei(dateiPfad, aufgabenTitelErsetzt);
        return true;
    }
    return false;
}
export function macheAufgabenMetadatenPlist(meta) {
    return machePlist('bAufgabenMetadaten', meta, [
        'Titel',
        'Thematik',
        'ZitatBeschreibung',
        'Stichwoerter',
        'Ueberprueft'
    ]);
}
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
function setzeMetadatenEineDatei(dateiPfad) {
    dateiPfad = path.resolve(dateiPfad);
    const aufgabenSammlung = gibAufgabenSammlung();
    const aufgabe = aufgabenSammlung.gib(dateiPfad);
    const texPlist = machePlist('bAufgabenMetadaten', aufgabe.erzeugeMetadaten(), ['Titel', 'Thematik', 'ZitatBeschreibung', 'Stichwoerter']);
    if (aufgabe.inhalt !== null) {
        const inhalt = aufgabe.inhalt;
        schreibe(dateiPfad, inhalt, texPlist);
    }
    console.log(texPlist);
}
export default function (dateiPfadOderGlob) {
    if (fs.existsSync(dateiPfadOderGlob)) {
        setzeMetadatenEineDatei(dateiPfadOderGlob);
    }
    else {
        const dateien = glob.sync(dateiPfadOderGlob);
        for (const datei of dateien) {
            console.log(datei);
            setzeMetadatenEineDatei(datei);
        }
    }
}
//# sourceMappingURL=aufgaben-metadaten.js.map