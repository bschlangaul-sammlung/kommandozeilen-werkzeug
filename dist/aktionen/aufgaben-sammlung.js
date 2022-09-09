/**
 * Aktionen, die über eine Sammlung an Aufgaben eine Ausgabe erzeugen.
 */
import path from 'path';
import { gibAufgabenSammlung } from '../aufgabe';
import { log } from '../log';
import { gibExamenSammlung, Examen } from '../examen';
import { konfiguration, macheRepoPfad, löscheDatei, AusgabeSammler, generiereLink } from '../helfer';
import { schreibeTexDatei, machePlist } from '../tex';
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
/**
 * Erzeugen den Markdown-Code für die README-Datei.
 */
export function generiereExamensÜbersicht() {
    const examenSammlung = gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log('info', 'Konnte keinen Examensbaum aufbauen');
        return '';
    }
    return baum.besuche({
        betreteEinzelprüfungsNr(nummer) {
            return `\n### ${nummer}: ${Examen.fachDurchNummer(nummer)}\n`;
        },
        betreteExamen(examen, monat, nummer) {
            const scanLink = generiereLink('Scan.pdf', examen.scanUrl);
            const ocrLink = generiereLink('OCR.txt', examen.scanUrl);
            return `- ${examen.jahrJahreszeit}: ${scanLink} ${ocrLink} ${erzeugeAufgabenBaumMarkdown(examen)}`;
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
    const ausgabe = new AusgabeSammler();
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
            schreibeTexDatei(path.join(konfiguration.repos.examenScans.lokalerPfad, nummer.toString(), 'Examenssammlung.tex'), 'examen-scans', kopf, textKörper);
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
        löscheDatei(pfad);
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
/**
 * Erzeuge das Haupt-Dokument mit dem Dateinamen `Bschlangaul-Sammlung.tex`
 */
export function erzeugeAufgabenSammlung(opts) {
    // Damit die Aufgabensammlung in den Examensobjekten vorhanden ist.
    gibAufgabenSammlung();
    const examenSammlung = gibExamenSammlung();
    const baum = examenSammlung.examenBaum;
    if (baum == null) {
        log('info', 'Konnte keinen Examensbaum aufbauen');
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
            log('info', 'Die Aufgabe %s ist anscheinend korrekt.', aufgabe.referenz);
            let ausgabe = '';
            if (einzelprüfungsNr == null || examen.nummer !== einzelprüfungsNr) {
                log('verbose', 'Beginne neue Überschrift für Einzelprüfungs-Nummer %s.', einzelprüfungsNr);
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
    schreibeTexDatei(macheRepoPfad(ziel + '.tex'), 'sammlung', '', textkörper);
}
//# sourceMappingURL=aufgaben-sammlung.js.map