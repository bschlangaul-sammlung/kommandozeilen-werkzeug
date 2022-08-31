"use strict";
/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.erzeugeAufgabenSammlung = exports.erzeugeExamensLösungen = exports.erzeugeExamenScansSammlung = exports.generiereExamensÜbersicht = void 0;
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
        (0, log_1.log)('debug', 'Examen hat keine Aufgaben');
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
    const examenSammlung = (0, examen_1.gibExamenSammlung)();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        (0, log_1.log)('info', 'Konnte keinen Examensbaum aufbauen');
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
    const examenSammlung = (0, examen_1.gibExamenSammlung)();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        (0, log_1.log)('info', 'Konnte keinen Examensbaum aufbauen');
        return;
    }
    const ausgabe = new helfer_1.AusgabeSammler();
    baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            ausgabe.leere();
            return undefined;
        },
        betreteExamen(examen, monat, nummer) {
            ausgabe.sammle(`\n\\bTrennSeite{${examen.jahreszeit} ${examen.jahr}}`);
            ausgabe.sammle(`\\bBindePdfEin{${(0, helfer_1.macheRelativenPfad)(examen.pfad)}}`);
            return undefined;
        },
        verlasseEinzelprüfungsNr(nummer) {
            const textKörper = ausgabe.gibText();
            const kopf = `\\bPruefungsNummer{${nummer}}\n` +
                `\\bPruefungsTitel{${examen_1.Examen.fachDurchNummer(nummer)}}\n`;
            (0, tex_1.schreibeTexDatei)((0, helfer_1.macheRepoPfad)('Staatsexamen', nummer.toString(), 'Examensammlung.tex'), 'examen-scans', kopf, textKörper);
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
 * \bSetzeExamen{66116}{2021}{03}
 *
 * \bSetzeThemaNr{1}
 *
 * \bSetzeTeilaufgabeNr{1}
 *
 * \bBindeAufgabeEin{1}
 * \bBindeAufgabeEin{2}
 * \bBindeAufgabeEin{3}
 * ```
 */
function erzeugeExamensLösung(examen) {
    (0, log_1.log)('debug', 'Besuche Examen %s', examen.referenz);
    const baum = examen.aufgabenBaum;
    if (baum == null) {
        (0, log_1.log)('debug', 'Examen hat keine Aufgaben');
        return;
    }
    (0, log_1.log)('verbose', examen.pfad);
    const textKörper = baum.besuche({
        betreteThema(nummer) {
            return `\n\n\\bSetzeThemaNr{${nummer}}`;
        },
        betreteTeilaufgabe(nummer) {
            return `\n\\bSetzeTeilaufgabeNr{${nummer}}\n`;
        },
        betreteAufgabe(aufgaben, nummer) {
            return `\\bBindeAufgabeEin{${nummer}}`;
        }
    });
    const kopf = (0, tex_1.machePlist)('liMetaSetze', {
        EinzelpruefungsNr: examen.nummer,
        ExamenFach: examen.fach,
        Jahr: examen.jahr,
        Monat: examen.monatMitNullen,
        Jahreszeit: examen.jahreszeit
    });
    const pfad = examen.machePfad('Examen.tex');
    if (textKörper != null) {
        (0, log_1.log)('info', 'Schreibe %s', pfad);
        (0, tex_1.schreibeTexDatei)(pfad, 'examen', kopf, textKörper);
    }
    else {
        (0, log_1.log)('verbose', 'Lösche %s', pfad);
        (0, helfer_1.löscheDatei)(pfad);
    }
}
/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 */
function erzeugeExamensLösungen() {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    (0, aufgabe_1.gibAufgabenSammlung)();
    const examenSammlung = (0, examen_1.gibExamenSammlung)();
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
function erzeugeAufgabenSammlung(opts) {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    (0, aufgabe_1.gibAufgabenSammlung)();
    const examenSammlung = (0, examen_1.gibExamenSammlung)();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        (0, log_1.log)('info', 'Konnte keinen Examensbaum aufbauen');
        return;
    }
    let einzelprüfungsNr;
    const textkörper = baum.besuche({
        betreteAufgabe(aufgabe, nummer) {
            if (opts.examen != null && opts.examen && !aufgabe.istExamen) {
                return;
            }
            if (opts.korrektheit != null &&
                parseInt(opts.korrektheit) >= aufgabe.korrektheitGrad) {
                return;
            }
            if (opts.bearbeitungsStand != null &&
                parseInt(opts.bearbeitungsStand) >= aufgabe.bearbeitungsStandGrad) {
                return;
            }
            const examensAufgabe = aufgabe;
            const examen = examensAufgabe.examen;
            (0, log_1.log)('info', 'Die Aufgabe %s ist anscheinend korrekt.', aufgabe.referenz);
            let ausgabe = '';
            if (einzelprüfungsNr == null || examen.nummer !== einzelprüfungsNr) {
                (0, log_1.log)('verbose', 'Beginne neue Überschrift für Einzelprüfungs-Nummer %s.', einzelprüfungsNr);
                einzelprüfungsNr = examen.nummer;
                const überschrift = einzelprüfungsNr.toString() + ' (' + examen.fach + ')';
                ausgabe += `\n\\section{${überschrift}}\n`;
            }
            return ausgabe + aufgabe.einbindenTexMakro;
        }
    });
    let ziel = 'Bschlangaul-Sammlung';
    if (opts.ziel != null) {
        ziel = opts.ziel;
    }
    (0, tex_1.schreibeTexDatei)((0, helfer_1.macheRepoPfad)(ziel + '.tex'), 'haupt', '', textkörper);
}
exports.erzeugeAufgabenSammlung = erzeugeAufgabenSammlung;
