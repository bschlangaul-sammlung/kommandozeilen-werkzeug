"use strict";
/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.erzeugeHauptDokument = exports.erzeugeExamensLösungen = exports.erzeugeExamenScansSammlung = exports.generiereExamensÜbersicht = void 0;
const aufgabe_1 = require("../aufgabe");
const log_1 = require("../log");
const examen_1 = require("../examen");
const helfer_1 = require("../helfer");
const tex_1 = require("../tex");
/**
 * ```md
 * - 2015 Frühjahr: [Scan.pdf](...46116/2015/03/Scan.pdf) [OCR.txt](…46116/2015/03/OCR.txt)
 *     - Thema 1
 *         - Teilaufgabe 1
 *             - [Aufgabe 3](…46116/2015/03/Thema-1/Teilaufgabe-1/Aufgabe-3.pdf)
 *         - Teilaufgabe 2
 *             - [Aufgabe 1](…46116/2015/03/Thema-1/Teilaufgabe-2/Aufgabe-1.pdf)
 *             - [Aufgabe 3](…46116/2015/03/Thema-1/Teilaufgabe-2/Aufgabe-3.pdf)
 *```
 */
function erzeugeAufgabenBaumMarkdown(examen) {
    const baum = examen.aufgabenBaum;
    if (baum == null) {
        log_1.logger.log('debug', 'Examen hat keine Aufgaben');
        return '';
    }
    function rückeEin() {
        return ' '.repeat(4 * ebene) + '- ';
    }
    let ebene = 1;
    const ausgabe = baum.besuche({
        betreteThema(nummer) {
            ebene = 1;
            const ausgabe = rückeEin() + `Thema ${nummer}`;
            ebene++;
            return ausgabe;
        },
        betreteTeilaufgabe(nummer) {
            ebene = 2;
            const ausgabe = rückeEin() + `Teilaufgabe ${nummer}`;
            ebene++;
            return ausgabe;
        },
        betreteAufgabe(aufgabe, nummer) {
            let titel;
            if (aufgabe != null) {
                titel = aufgabe.gibTitelNurAufgabe(true);
            }
            else {
                titel = `Aufgabe ${nummer}`;
            }
            return rückeEin() + titel;
        }
    });
    if (ausgabe == null)
        return '';
    return '\n' + ausgabe;
}
function erzeugeDateiLink(examen, dateiName) {
    return examen.macheMarkdownLink(dateiName, dateiName);
}
/**
 * Erzeugen den Markdown-Code für die README-Datei.
 */
function generiereExamensÜbersicht() {
    const examenSammlung = examen_1.gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log_1.logger.log('info', 'Konnte keinen Examensbaum aufbauen');
        return '';
    }
    return baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            return `\n### ${nummer}: ${examen_1.Examen.fachDurchNummer(nummer)}\n`;
        },
        betreteExamen(examen, monat, nummer) {
            const scanLink = erzeugeDateiLink(examen, 'Scan.pdf');
            const ocrLink = erzeugeDateiLink(examen, 'OCR.txt');
            return `- ${examen.jahrJahreszeit}: ${scanLink} ${ocrLink} ${erzeugeAufgabenBaumMarkdown(examen)}`;
        }
    });
}
exports.generiereExamensÜbersicht = generiereExamensÜbersicht;
/**
 * Erzeugt eine TeX-Datei, die alle Examens-Scans eines bestimmten Fachs (z. B.
 * 65116) als eine PDF-Datei zusammenfasst.
 */
function erzeugeExamenScansSammlung() {
    const examenSammlung = examen_1.gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log_1.logger.log('info', 'Konnte keinen Examensbaum aufbauen');
        return;
    }
    const ausgabe = new helfer_1.AusgabeSammler();
    baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            ausgabe.leere();
            return undefined;
        },
        betreteExamen(examen, monat, nummer) {
            ausgabe.sammle(`\n\\liTrennSeite{${examen.jahreszeit} ${examen.jahr}}`);
            ausgabe.sammle(`\\liBindePdfEin{${helfer_1.macheRelativenPfad(examen.pfad)}}`);
            return undefined;
        },
        verlasseEinzelprüfungsNr(nummer) {
            const textKörper = ausgabe.gibText();
            const kopf = `\\liPruefungsNummer{${nummer}}\n` +
                `\\liPruefungsTitel{${examen_1.Examen.fachDurchNummer(nummer)}}\n`;
            tex_1.schreibeTexDatei(helfer_1.macheRepoPfad('Staatsexamen', nummer.toString(), 'Examensammlung.tex'), 'examen-scans', kopf, textKörper);
            return undefined;
        }
    });
}
exports.erzeugeExamenScansSammlung = erzeugeExamenScansSammlung;
/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 *
 * ```latex
 * \liSetzeExamen{66116}{2021}{03}
 *
 * \liSetzeExamenThemaNr{1}
 *
 * \liSetzeExamenTeilaufgabeNr{1}
 *
 * \liBindeAufgabeEin{1}
 * \liBindeAufgabeEin{2}
 * \liBindeAufgabeEin{3}
 * ```
 */
function erzeugeExamensLösung(examen) {
    log_1.logger.log('debug', 'Besuche Examen %s', examen.referenz);
    const baum = examen.aufgabenBaum;
    if (baum == null) {
        log_1.logger.log('debug', 'Examen hat keine Aufgaben');
        return;
    }
    log_1.logger.verbose(examen.pfad);
    const textKörper = baum.besuche({
        betreteThema(nummer) {
            return `\n\n\\liSetzeExamenThemaNr{${nummer}}`;
        },
        betreteTeilaufgabe(nummer) {
            return `\n\\liSetzeExamenTeilaufgabeNr{${nummer}}\n`;
        },
        betreteAufgabe(aufgaben, nummer) {
            return `\\liBindeAufgabeEin{${nummer}}`;
        }
    });
    const kopf = tex_1.machePlist('liMetaSetze', {
        ExamenNummer: examen.nummer,
        ExamenFach: examen.fach,
        ExamenJahr: examen.jahr,
        ExamenMonat: examen.monatMitNullen,
        ExamenJahreszeit: examen.jahreszeit
    });
    const pfad = examen.machePfad('Examen.tex');
    if (textKörper != null) {
        log_1.logger.log('info', 'Schreibe %s', pfad);
        tex_1.schreibeTexDatei(pfad, 'examen', kopf, textKörper);
    }
    else {
        log_1.logger.log('verbose', 'Lösche %s', pfad);
        helfer_1.löscheDatei(pfad);
    }
}
/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 */
function erzeugeExamensLösungen() {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    aufgabe_1.gibAufgabenSammlung();
    const examenSammlung = examen_1.gibExamenSammlung();
    const examenBaum = examenSammlung.baum;
    for (const nummer in examenBaum) {
        for (const jahr in examenBaum[nummer]) {
            for (const monat in examenBaum[nummer][jahr]) {
                const examen = examenBaum[nummer][jahr][monat];
                erzeugeExamensLösung(examen);
            }
        }
    }
}
exports.erzeugeExamensLösungen = erzeugeExamensLösungen;
/**
 * Erzeuge das Haupt-Dokument mit dem Dateinamen `Bschlangaul-Sammlung.tex`
 */
function erzeugeHauptDokument() {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    aufgabe_1.gibAufgabenSammlung();
    const examenSammlung = examen_1.gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log_1.logger.log('info', 'Konnte keinen Examensbaum aufbauen');
        return;
    }
    const textkörper = baum.besuche({
        betreteAufgabe(aufgabe, nummer) {
            if (aufgabe.istKorrekt) {
                return '% ' + aufgabe.einbindenTexMakro;
            }
        }
    });
    tex_1.schreibeTexDatei(helfer_1.macheRepoPfad('Bschlangaul-Sammlung.tex'), 'examen', '', textkörper);
}
exports.erzeugeHauptDokument = erzeugeHauptDokument;
