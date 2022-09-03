import path from 'path';
import fs from 'fs';
import { öffneVSCode } from '../helfer';
import { ExamensAufgabe } from '../aufgabe';
import { schreibeTexDatei } from '../tex';
import { macheAufgabenMetadatenPlist } from './aufgaben-metadaten';
function schreibeVorlage(pfad, werte = {}) {
    const meta = {};
    meta.Titel = werte.titel != null ? werte.titel : '';
    meta.Thematik = werte.thematik != null ? werte.thematik : '';
    meta.ZitatSchluessel =
        werte.zitatSchlüssel != null ? werte.zitatSchlüssel : '';
    const plist = macheAufgabenMetadatenPlist(meta);
    const textkörper = plist + '\n' + '\\index{}\n' + '\\footcite{' + meta.ZitatSchluessel + '}\n';
    schreibeTexDatei(pfad, 'aufgabe', '', textkörper);
}
export function erzeugeAufgabenVorlage(titel) {
    let dateiName = 'Aufgabe_';
    if (titel != null) {
        const titelRein = titel.replace(/\s+/g, '-');
        dateiName = `${dateiName}${titelRein}`;
    }
    const pfad = path.join(process.cwd(), `${dateiName}.tex`);
    if (!fs.existsSync(pfad)) {
        schreibeVorlage(pfad, {
            titel
        });
    }
    öffneVSCode(pfad);
}
function schreibeExamensAufgabeVorlage(examensAufgabe) {
    schreibeVorlage(examensAufgabe.pfad, {
        titel: examensAufgabe.aufgabeFormatiert,
        zitatSchlüssel: 'examen:' + examensAufgabe.examen.referenz
    });
    return examensAufgabe.pfad;
}
/**
 * @param ref z. B. `66116:2021:03`
 * @param arg1 Thema-Nummer, Teilaufgaben-Nummer oder Aufgaben-Nummer
 * @param arg2 Teilaufgabe-Nummer oder Aufgabe-Nummer
 * @param arg3 Aufgabe-Nummer
 */
export function erzeugeExamensAufgabeVorlage(ref, arg1, arg2, arg3) {
    const examensAufgabe = ExamensAufgabe.erzeugeExamensAufgabe(ref, arg1, arg2, arg3);
    const pfad = schreibeExamensAufgabeVorlage(examensAufgabe);
    öffneVSCode(pfad);
}
//# sourceMappingURL=aufgaben-vorlage.js.map