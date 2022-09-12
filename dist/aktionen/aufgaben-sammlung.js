/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */
import path from 'path';
import { gibAufgabenSammlung } from '../aufgabe';
import { log } from '../log';
import { gibExamenSammlung, Examen } from '../examen';
import * as helfer from '../helfer';
import { schreibeTexDatei, machePlist } from '../tex';
import gibAuszeichnung from '../auszeichnungssprache';
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
        log('debug', 'Examen hat keine Aufgaben');
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
            let ausgabe;
            if (aufgabe != null) {
                ausgabe =
                    helfer.erzeugeLink(aufgabe.aufgabeNrStichwörterFormatiert, aufgabe.pdfUrl) +
                        ' (' +
                        helfer.erzeugeLink('.tex', aufgabe.texQuelltextUrl) +
                        ')';
            }
            else {
                ausgabe = `Aufgabe ${nummer}`;
            }
            return rückeEin() + ausgabe;
        }
    });
    if (ausgabe == null) {
        return '';
    }
    return '\n' + ausgabe;
}
/**
 * Erzeugen den Markdown-Code für die README-Datei.
 */
export function erzeugeExamensÜbersicht(mitAufgaben = true) {
    const examenSammlung = gibExamenSammlung();
    const a = gibAuszeichnung('markdown');
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log('info', 'Konnte keinen Examensbaum aufbauen');
        return '';
    }
    return baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            return ('\n' +
                a.überschrift(`${nummer}: ${Examen.fachDurchNummer(nummer)}`, 3)
                    .auszeichnung);
        },
        betreteExamen(examen, monat, nummer) {
            const scanLink = a.link('Scan.pdf', examen.scanUrl).auszeichnung;
            const ocrLink = a.link('OCR.txt', examen.ocrUrl).auszeichnung;
            let aufgaben = ' ';
            if (mitAufgaben) {
                aufgaben += erzeugeAufgabenBaumMarkdown(examen);
            }
            return `- ${examen.jahrJahreszeit}: ${scanLink} ${ocrLink}${aufgaben}`;
        }
    });
}
/**
 * Erzeugt eine TeX-Datei, die alle Examens-Scans eines bestimmten Fachs (z. B.
 * 65116) als eine PDF-Datei zusammenfasst.
 */
export function erzeugeExamenScansSammlung() {
    const examenSammlung = gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log('info', 'Konnte keinen Examensbaum aufbauen');
        return;
    }
    const ausgabe = new helfer.AusgabeSammler();
    baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            ausgabe.leere();
            return undefined;
        },
        betreteExamen(examen, monat, nummer) {
            ausgabe.sammle(`\n\\bTrennSeite{${examen.jahreszeit} ${examen.jahr}}`);
            const relativerPfad = path.join(examen.nummer.toString(), examen.jahr.toString(), examen.monatMitNullen, 'Scan.pdf');
            ausgabe.sammle(`\\bBindePdfEin{${relativerPfad}}`);
            return undefined;
        },
        verlasseEinzelprüfungsNr(nummer) {
            const textKörper = ausgabe.gibText();
            const kopf = `\\bPruefungsNummer{${nummer}}\n` +
                `\\bPruefungsTitel{${Examen.fachDurchNummer(nummer)}}\n`;
            schreibeTexDatei(path.join(helfer.konfiguration.repos.examenScans.lokalerPfad, nummer.toString(), 'Examenssammlung.tex'), 'examen-scans', kopf, textKörper);
            return undefined;
        }
    });
}
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
    log('debug', 'Besuche Examen %s', examen.referenz);
    const baum = examen.aufgabenBaum;
    if (baum == null) {
        log('debug', 'Examen hat keine Aufgaben');
        return;
    }
    log('verbose', examen.pfad);
    const textKörper = baum.besuche({
        betreteThema(nummer) {
            return `\n\n\\bSetzeThemaNr{${nummer}}`;
        },
        betreteTeilaufgabe(nummer) {
            return `\n\\bSetzeTeilaufgabeNr{${nummer}}\n`;
        },
        betreteAufgabe(aufgabe, nummer) {
            if (aufgabe.bearbeitungsStandGrad > 3) {
                return `\\bBindeAufgabeEin{${nummer}}`;
            }
        }
    });
    const kopf = machePlist('bMetaSetze', {
        EinzelpruefungsNr: examen.nummer,
        ExamenFach: examen.fach,
        Jahr: examen.jahr,
        Monat: examen.monatMitNullen,
        Jahreszeit: examen.jahreszeit
    });
    const pfad = examen.machePfad('Examen.tex');
    if (textKörper != null) {
        log('info', 'Schreibe %s', pfad);
        schreibeTexDatei(pfad, 'examen', kopf, textKörper);
    }
    else {
        log('verbose', 'Lösche %s', pfad);
        helfer.löscheDatei(pfad);
    }
}
/**
 * Erzeugt pro Examen eine TeX-Datei, die alle zum diesem Examen gehörenden
 * Aufgaben samt Lösungen einbindet.
 */
export function erzeugeExamensLösungen() {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    gibAufgabenSammlung();
    const examenSammlung = gibExamenSammlung();
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
//# sourceMappingURL=aufgaben-sammlung.js.map