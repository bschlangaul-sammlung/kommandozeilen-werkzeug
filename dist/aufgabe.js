import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { leseRepoDatei, hauptRepoPfad, erzeugeGithubRawLink, macheRelativenPfad, öffneVSCode, zeigeFehler } from './helfer';
import * as helfer from './helfer';
import { sammleStichwörter, gibInhaltEinesTexMakros } from './tex';
import { Examen, gibExamenSammlung } from './examen';
function umgebeMitKlammern(text) {
    return `{${text}}`;
}
export const bearbeitungsStand = [
    'unbekannt',
    'OCR',
    'TeX-Fehler',
    'nur Angabe',
    'mit Lösung'
];
export const korrektheit = [
    'wahrscheinlich falsch',
    'unbekannt',
    'korrekt',
    'korrekt und überprüft'
];
/**
 * Eine allgemeine Aufgabe, die keinem Examen zugeordnet werden kann.
 */
export class Aufgabe {
    constructor(pfad) {
        this.stichwörter = [];
        /**
         * Zeigt an, ob die Aufgabe eine normale Aufgabe ist oder eine Examensaufgabe.
         * Dieser Wert wird in der spezialisierten Klasse Examensaufgabe auf wahr gesetzt.
         */
        this.istExamen = false;
        this.pfad = Aufgabe.normalisierePfad(pfad);
        if (!fs.existsSync(this.pfad)) {
            this.inhalt = '';
        }
        else {
            this.inhalt = leseRepoDatei(this.pfad);
        }
        this.stichwörter = sammleStichwörter(this.inhalt);
        const metaDaten = this.leseMetadatenVonTex();
        if (metaDaten != null) {
            this.metadaten_ = metaDaten;
        }
        this.validiere(this.bearbeitungsStand, bearbeitungsStand);
        this.validiere(this.korrektheit, korrektheit);
    }
    /**
     * Normalisiere den Dateipfad der Aufgabe. Er sollte immer als absoluter Pfad vorliegen.
     *
     * @param pfad - Ein möglicherweise relativer Dateipfad.
     *
     * @returns Ein absoluter Pfad.
     */
    static normalisierePfad(pfad) {
        if (pfad.charAt(0) === path.sep) {
            return pfad;
        }
        if (pfad.includes(hauptRepoPfad)) {
            return pfad;
        }
        return path.join(hauptRepoPfad, pfad);
    }
    static istAufgabe(pfad) {
        if (pfad.match(Aufgabe.pfadRegExp) != null) {
            return true;
        }
        return false;
    }
    static vergleichePfade(a, b) {
        if (a.pfad < b.pfad) {
            return -1;
        }
        if (a.pfad > b.pfad) {
            return 1;
        }
        return 0;
    }
    /**
     * ```tex
     * \bAufgabenMetadaten{
     *   Titel = {Aufgabe 5},
     *   Thematik = {Regal mit DVDs, CDs und BDs},
     *   RelativerPfad = Examen/66116/2014/09/Thema-2/Teilaufgabe-2/Aufgabe-5.tex,
     *   ZitatSchluessel = examen:66116:2014:09,
     *   EinzelpruefungsNr = 66116,
     *   Jahr = 2014,
     *   Monat = 09,
     *   ThemaNr = 2,
     *   TeilaufgabeNr = 2,
     *   AufgabeNr = 5,
     * }
     * ```
     */
    leseMetadatenVonTex() {
        function reinige(text) {
            text = text.trim();
            text = text.replace(/\}?,$/, '');
            text = text.replace(/^\{?/, '');
            text = text.trim();
            return text;
        }
        const ergebnis = {};
        const match = this.inhalt.match(/\\bAufgabenMetadaten{(.*)\n}/s);
        if (match != null) {
            const zeilen = match[1];
            for (const zeile of zeilen.split('\n')) {
                const schlüsselWert = zeile.split('=');
                if (schlüsselWert.length === 2) {
                    ergebnis[reinige(schlüsselWert[0])] = reinige(schlüsselWert[1]);
                }
            }
            return ergebnis;
        }
    }
    /**
     * Erzeuge eine Objekt, dass dem Interface AufgabenMetadaten entspricht.
     * Die Reihenfolge der Attribute sollte eingehalten werden.
     */
    erzeugeMetadaten() {
        // eslint-disable-next-line
        const meta = {
            Titel: umgebeMitKlammern(this.titel),
            Thematik: umgebeMitKlammern(this.thematik),
            Referenz: this.referenz,
            RelativerPfad: this.relativerPfad
        };
        if (this.identischeAufgabe != null) {
            meta.IdentischeAufgabe = this.identischeAufgabe;
        }
        // Zitat
        if (this.zitat != null) {
            meta.ZitatSchluessel = this.zitat[0];
            if (this.zitat.length > 1) {
                meta.ZitatBeschreibung = umgebeMitKlammern(this.zitat[1]);
            }
        }
        meta.BearbeitungsStand = this.bearbeitungsStand;
        meta.Korrektheit = this.korrektheit;
        if (this.überprüft != null) {
            meta.Ueberprueft = umgebeMitKlammern(this.überprüft);
        }
        else {
            meta.Ueberprueft = umgebeMitKlammern('unbekannt');
        }
        if (this.stichwörter.length > 0) {
            meta.Stichwoerter = umgebeMitKlammern(this.stichwörter.join(', '));
        }
        return meta;
    }
    validiere(gegebenerWert, gültigeWerte) {
        if (gegebenerWert != null && !gültigeWerte.includes(gegebenerWert)) {
            console.log('Der Wert ist nicht gültig: ' + gegebenerWert);
            console.log('Gültige Werte: ' + gültigeWerte.toString());
            öffneVSCode(this.pfad);
        }
    }
    /**
     * Der Titel einer Aufgabe. Er wird zuerst aus den TeX-Metadaten
     * `\bAufgabenMetadaten` (`Titel`) gelesen, anschließend aus dem ersten
     * `\section`-Makro. Wird kein Titel in der TeX-Datei gefunden, so lautet der
     * Titel `Aufgabe`.
     */
    get titel() {
        if (this.metadaten_ != null) {
            return this.metadaten_.Titel;
        }
        const section = this.inhalt.match(/\\section\{(.+?)[\n\\}{]/);
        if ((section === null || section === void 0 ? void 0 : section[1]) != null) {
            return section[1];
        }
        return 'Aufgabe';
    }
    /**
     * Die Thematik (wenige Wörter um sich an eine Aufgabe erinnern zu können)
     * einer Aufgabe. Er wird zuerst aus den TeX-Metadaten `\bAufgabenMetadaten`
     * (`Themaik`) gelesen, anschließend aus dem ersten `\bAufgabenTitel`-Makro.
     * Wird kein Titel in der TeX-Datei gefunden, so lautet der Titel `keine
     * Thematik`.
     */
    get thematik() {
        var _a;
        if (((_a = this.metadaten_) === null || _a === void 0 ? void 0 : _a.Thematik) != null) {
            return this.metadaten_.Thematik;
        }
        const thematik = gibInhaltEinesTexMakros('bAufgabenTitel', this.inhalt);
        if (thematik != null) {
            return thematik;
        }
        return 'keine Thematik';
    }
    /**
     * Inhalt des ersten `\footcite[ZitatBeschreibung]{ZitatSchluessel}` Makros
     * als Array `[ZitatSchluessel, ZitatBeschreibung]`.
     */
    get zitat() {
        const match = this.inhalt.match(/\\footcite(\[([^\]]+)\])?\{([^}]+)\}/);
        if (match != null) {
            const zitat = [];
            if (match[3] != null) {
                zitat.push(match[3]);
            }
            if (match[2] != null) {
                zitat.push(match[2]);
            }
            return zitat;
        }
    }
    /**
     * Siehe Dokumentation des Typs
     */
    get bearbeitungsStand() {
        var _a;
        if (((_a = this.metadaten_) === null || _a === void 0 ? void 0 : _a.BearbeitungsStand) != null) {
            return this.metadaten_.BearbeitungsStand;
        }
        return 'unbekannt';
    }
    get bearbeitungsStandGrad() {
        return bearbeitungsStand.indexOf(this.bearbeitungsStand);
    }
    /**
     * Siehe Dokumentation des Typs
     */
    get korrektheit() {
        var _a;
        if (((_a = this.metadaten_) === null || _a === void 0 ? void 0 : _a.Korrektheit) != null) {
            return this.metadaten_.Korrektheit;
        }
        return 'unbekannt';
    }
    get korrektheitGrad() {
        return korrektheit.indexOf(this.korrektheit);
    }
    /**
     * Zeigt an, ob die Aufgabe korrekt ist. Das ist der Fall wenn in den
     * Aufgabenmetadaten `korrekt` oder `korrekt und überprüft` steht.
     */
    get istKorrekt() {
        return (this.korrektheit === 'korrekt' ||
            this.korrektheit === 'korrekt und überprüft');
    }
    get überprüft() {
        var _a;
        if (((_a = this.metadaten_) === null || _a === void 0 ? void 0 : _a.Ueberprueft) != null) {
            return this.metadaten_.Ueberprueft;
        }
    }
    /**
     * Ein kurzer String, mit dem die Aufgabe eindeutig referenziert werden kann,
     * z. B. über das `\ref{}` TeX-Makro. Für die Referenz von normalen Aufgaben
     * verwenden wir den relativen Pfad und entfernen einige nicht relevante
     * Zeichenketten.
     */
    get referenz() {
        return this.relativerPfad
            .replace('Module/', '')
            .replace('Aufgabe_', '')
            .replace('.tex', '')
            .replace(/\d\d_/g, '')
            .replace(/\//g, '.');
    }
    /**
     * Siehe Dokumentation des Typs
     */
    get identischeAufgabe() {
        var _a;
        if (((_a = this.metadaten_) === null || _a === void 0 ? void 0 : _a.IdentischeAufgabe) != null) {
            return this.metadaten_.IdentischeAufgabe;
        }
    }
    get titelFormatiert() {
        let titel;
        if (this.titel != null) {
            titel = `„${this.titel}“`;
        }
        else {
            titel = 'Aufgabe';
        }
        return titel;
    }
    /**
     * `this.titel „this.thematik“`
     *
     * z. B. `Übung zum Master-Theorem` oder `Aufgabe 1 „Kleintierverein“`
     */
    get titelThematikFormatiert() {
        let ausgabe = this.titel;
        if (this.thematik !== 'keine Thematik') {
            ausgabe += ` „${this.thematik}“`;
        }
        return ausgabe;
    }
    /**
     * @returns ` (Stichwort 1, Stichwort 2)`
     */
    get stichwörterFormatiert() {
        if (this.stichwörter != null && this.stichwörter.length > 0) {
            return ` (${this.stichwörter.join(', ')})`;
        }
        return '';
    }
    /**
     * Formatierter Link zur Tex-Datei.
     */
    get linkTex() {
        return erzeugeGithubRawLink('.tex', this.pfad, { linkePdf: false });
    }
    /**
     * Formatierter Link zur PDF-Datei auf Github mit den Stichwörtern.
     */
    get link() {
        return (erzeugeGithubRawLink(this.titelThematikFormatiert, this.pfad) +
            this.stichwörterFormatiert +
            ' (' +
            this.linkTex +
            ') ');
    }
    /**
     * @return z. B. `Module/30_AUD/40_Sortieralgorithmen/Aufgabe_Haendisches-Sortieren`
     */
    get einbindenTexMakro() {
        let relativerPfad = macheRelativenPfad(this.pfad);
        relativerPfad = relativerPfad.replace('.tex', '');
        return `\\bAufgabe{${relativerPfad}}`;
    }
    get relativerPfad() {
        return macheRelativenPfad(this.pfad);
    }
    /**
     * Absoluter Pfad im lokalen Dateisystem. Alias für `this.pfad`.
     */
    get texQuelltextLokalerPfad() {
        return this.pfad;
    }
    get texQuelltextUrl() {
        return helfer.erzeugeGithubUrl('examensAufgabenTex', this.relativerPfad, false);
    }
    /**
     * Absoluter Pfad im lokalen Dateisystem.
     */
    get pdfLokalerPfad() {
        return helfer.gibRepoPfad(this.relativerPfad.replace('.tex', '.pdf'), 'examensAufgabenPdf');
    }
    get pdfUrl() {
        return helfer.erzeugeGithubUrl('examensAufgabenPdf', this.relativerPfad.replace('.tex', '.pdf'), true);
    }
}
Aufgabe.pfadRegExp = /.*Aufgabe_.*\.tex/;
/**
 * Eine Examensaufgabe
 */
export class ExamensAufgabe extends Aufgabe {
    constructor(pfad, examen) {
        super(pfad);
        this.examen = examen;
        this.istExamen = true;
        examen.aufgaben[pfad] = this;
        const treffer = pfad.match(ExamensAufgabe.pfadRegExp);
        if (treffer == null || treffer.groups == null) {
            zeigeFehler(`Konnte den Pfad der Examensaufgabe nicht lesen: ${pfad}`);
        }
        const gruppen = treffer.groups;
        this.aufgabe = parseInt(gruppen.aufgabe);
        if (gruppen.thema != null) {
            this.thema = parseInt(gruppen.thema);
        }
        if (gruppen.teilaufgabe != null) {
            this.teilaufgabe = parseInt(gruppen.teilaufgabe);
        }
    }
    /**
     * @param referenz z. B. `66116:2021:03`
     * @param arg1 Thema-Nummer, Teilaufgaben-Nummer oder Aufgaben-Nummer
     * @param arg2 Teilaufgabe-Nummer oder Aufgabe-Nummer
     * @param arg3 Aufgabe-Nummer
     */
    static erzeugeExamensAufgabe(referenz, arg1, arg2, arg3) {
        function gibNummer(arg) {
            if (typeof arg === 'number') {
                return arg;
            }
            else if (typeof arg === 'string') {
                return parseInt(arg);
            }
        }
        if (typeof arg1 === 'string') {
            arg1 = parseInt(arg1);
        }
        const pfad = ExamensAufgabe.erzeugePfad(arg1, gibNummer(arg2), gibNummer(arg3));
        const examen = Examen.erzeugeExamenVonReferenz(referenz);
        return new ExamensAufgabe(path.join(examen.verzeichnis, pfad), examen);
    }
    static istExamensAufgabe(pfad) {
        if (pfad.match(ExamensAufgabe.pfadRegExp) != null) {
            return true;
        }
        return false;
    }
    erzeugeMetadaten() {
        const meta = super.erzeugeMetadaten();
        meta.EinzelpruefungsNr = this.examen.nummer;
        meta.Jahr = this.examen.jahr;
        meta.Monat = this.examen.monatMitNullen;
        if (this.thema != null) {
            meta.ThemaNr = this.thema;
        }
        if (this.teilaufgabe != null) {
            meta.TeilaufgabeNr = this.teilaufgabe;
        }
        meta.AufgabeNr = this.aufgabe;
        return meta;
    }
    /**
     * z. B. `66116:2021:09`
     */
    get examensReferenz() {
        return this.examen.referenz;
    }
    get aufgabeFormatiert() {
        return `Aufgabe ${this.aufgabe}`;
    }
    /**
     * z. B. `T1 TA2 A1`
     */
    get aufgabenReferenz() {
        const output = [];
        if (this.thema != null) {
            output.push(`T${this.thema}`);
        }
        if (this.teilaufgabe != null) {
            output.push(`TA${this.teilaufgabe}`);
        }
        output.push(`A${this.aufgabe}`);
        return output.join(' ');
    }
    /**
     * Wie `this.aufgabenReferenz` bloß ohne Leerzeichen, z. B.
     */
    get aufgabenReferenzKurz() {
        return this.aufgabenReferenz.replace(/ +/g, '');
    }
    /**
     * Ein kurzer String mit der die Aufgabe eindeutig referenziert werden kann,
     * z. B. über das `\ref{}` TeX-Makro.
     *
     * `66116-2020-H.T1-TA1-A1`
     */
    get referenz() {
        return (this.examen.nummer.toString() +
            '-' +
            this.examen.jahr.toString() +
            '-' +
            this.examen.jahreszeitBuchstabe +
            '.' +
            this.aufgabenReferenz.replace(/ +/g, '-'));
    }
    /**
     * `„Greedy-Färben von Intervallen“ Examen 66115 Herbst 2017 T1 A8`
     */
    get titelKurz() {
        // `„Greedy-Färben von Intervallen“ Examen 66115 Herbst 2017 T1 A8`
        // const ausgabe = `${this.examen.titelKurz} ${this.aufgabenReferenz}`
        const ausgabe = `${this.examensReferenz} ${this.aufgabenReferenzKurz}`;
        if (this.thematik !== 'keine Thematik') {
            return `„${this.thematik}“ ${ausgabe}`;
        }
        return ausgabe;
    }
    /**
     * @returns z. B. `Aufgabe 1 (Stichwort 1, Stichwort 2)`
     */
    get aufgabeNrStichwörterFormatiert() {
        return `Aufgabe ${this.aufgabe}${this.stichwörterFormatiert}`;
    }
    get dateiName() {
        const aufgabenReferenz = this.aufgabenReferenz.replace(/ /g, '-');
        return `${this.examen.dateiName}_${aufgabenReferenz}`;
    }
    get link() {
        return (erzeugeGithubRawLink(this.titelKurz, this.pfad) +
            this.stichwörterFormatiert +
            ' (' +
            this.linkTex +
            ') ');
    }
    static erzeugePfad(arg1, arg2, arg3) {
        if (arg1 != null && arg2 != null && arg3 != null) {
            return path.join(`Thema-${arg1}`, `Teilaufgabe-${arg2}`, `Aufgabe-${arg3}.tex`);
        }
        else if (arg1 != null && arg2 != null && arg3 == null) {
            return path.join(`Thema-${arg1}`, `Aufgabe-${arg2}.tex`);
        }
        else {
            return `Aufgabe-${arg1}.tex`;
        }
    }
    /**
     * Erzeugt ein TeX-Makro mit dem die Aufgabe in ein anderes Dokument
     * eingebunden werden kann. Es handelt sich hierbei um die neue Version des
     * Einbinden-Makros.
     *
     * @returns z. B.
     * `\bExamensAufgabe{66116/2017/03/Thema-1/Teilaufgabe-1/Aufgabe-2}`
     */
    get einbindenTexMakro() {
        let relativerPfad = macheRelativenPfad(this.pfad);
        relativerPfad = relativerPfad.replace('Examen/', '');
        relativerPfad = relativerPfad.replace('.tex', '');
        return `\\bExamensAufgabe{${relativerPfad}}`;
    }
}
ExamensAufgabe.pfadRegExp = /(?<nummer>\d{5})\/(?<jahr>\d{4})\/(?<monat>\d{2})\/(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/;
ExamensAufgabe.schwacherPfadRegExp = /(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/;
export class AufgabenSammlung {
    constructor(examenSammlung) {
        this.examenSammlung = examenSammlung;
        this.aufgaben = {};
        const dateien = glob.sync('**/*.tex', { cwd: hauptRepoPfad });
        this.aufgaben = {};
        for (const pfad of dateien) {
            const aufgabe = this.erzeugeAufgabe(pfad);
            if (aufgabe != null) {
                this.aufgaben[macheRelativenPfad(pfad)] = aufgabe;
            }
        }
    }
    istAufgabenPfad(pfad) {
        return ExamensAufgabe.istExamensAufgabe(pfad) || Aufgabe.istAufgabe(pfad);
    }
    erzeugeAufgabe(pfad) {
        if (ExamensAufgabe.istExamensAufgabe(pfad)) {
            return new ExamensAufgabe(pfad, this.examenSammlung.gibDurchPfad(pfad));
        }
        else if (Aufgabe.istAufgabe(pfad)) {
            return new Aufgabe(pfad);
        }
    }
    gib(pfad) {
        return this.aufgaben[macheRelativenPfad(pfad)];
    }
}
let aufgabenSammlung;
export function gibAufgabenSammlung() {
    if (aufgabenSammlung == null) {
        aufgabenSammlung = new AufgabenSammlung(gibExamenSammlung());
    }
    return aufgabenSammlung;
}
//# sourceMappingURL=aufgabe.js.map