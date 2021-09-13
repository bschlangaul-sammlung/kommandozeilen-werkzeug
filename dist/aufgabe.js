"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gibAufgabenSammlung = exports.AufgabenSammlung = exports.ExamensAufgabe = exports.Aufgabe = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = __importDefault(require("glob"));
const helfer_1 = require("./helfer");
const tex_1 = require("./tex");
const examen_1 = require("./examen");
function umgebeMitKlammern(text) {
    return `{${text}}`;
}
const bearbeitungsStand = [
    'unbekannt',
    'OCR',
    'nur Angabe',
    'mit Lösung'
];
const korrektheit = [
    'wahrscheinlich falsch',
    'unbekannt',
    'korrekt',
    'korrekt und überprüft'
];
/**
 * Eine allgemeine Aufgabe, die keinem Examen zugeordnet werden kann.
 */
class Aufgabe {
    constructor(pfad) {
        this.stichwörter = [];
        /**
         * Zeigt an, ob die Aufgabe eine normale Aufgabe ist oder eine Examensaufgabe.
         * Dieser Wert wird in der spezialisierten Klasse Examensaufgabe auf wahr gesetzt.
         */
        this.istExamen = false;
        this.pfad = Aufgabe.normalisierePfad(pfad);
        if (!fs_1.default.existsSync(this.pfad)) {
            this.inhalt = '';
        }
        else {
            this.inhalt = (0, helfer_1.leseRepoDatei)(this.pfad);
        }
        this.stichwörter = (0, tex_1.sammleStichwörter)(this.inhalt);
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
     * @param pfad - Ein möglicherweise relativer Dateipfad
     * @returns Ein absoluter Pfad.
     */
    static normalisierePfad(pfad) {
        if (pfad.charAt(0) === path_1.default.sep) {
            return pfad;
        }
        if (pfad.includes(helfer_1.repositoryPfad)) {
            return pfad;
        }
        return path_1.default.join(helfer_1.repositoryPfad, pfad);
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
     *   RelativerPfad = Staatsexamen/66116/2014/09/Thema-2/Teilaufgabe-2/Aufgabe-5.tex,
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
        const match = this.inhalt.match(new RegExp(/\\bAufgabenMetadaten{(.*)\n}/, 's'));
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
        if (this.stichwörter.length > 0) {
            meta.Stichwoerter = umgebeMitKlammern(this.stichwörter.join(', '));
        }
        return meta;
    }
    validiere(gegebenerWert, gültigeWerte) {
        if (gegebenerWert != null && !gültigeWerte.includes(gegebenerWert)) {
            console.log('Der Wert ist nicht gültig: ' + gegebenerWert);
            console.log('Gültige Werte: ' + gültigeWerte.toString());
            (0, helfer_1.öffneVSCode)(this.pfad);
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
        const thematik = (0, tex_1.gibInhaltEinesTexMakros)('bAufgabenTitel', this.inhalt);
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
        return (0, helfer_1.generiereLink)('.tex', this.pfad, { linkePdf: false });
    }
    /**
     * Formatierter Link zur PDF-Datei auf Github mit den Stichwörtern.
     */
    get link() {
        return ((0, helfer_1.generiereLink)(this.titelThematikFormatiert, this.pfad) +
            this.stichwörterFormatiert +
            ' (' +
            this.linkTex +
            ') ');
    }
    get einbindenTexMakro() {
        let relativerPfad = (0, helfer_1.macheRelativenPfad)(this.pfad);
        relativerPfad = relativerPfad.replace('.tex', '');
        return `\\bAufgabe{${relativerPfad}}`;
    }
    get relativerPfad() {
        return (0, helfer_1.macheRelativenPfad)(this.pfad);
    }
}
exports.Aufgabe = Aufgabe;
Aufgabe.pfadRegExp = /.*Aufgabe_.*\.tex/;
/**
 * Eine Examensaufgabe
 */
class ExamensAufgabe extends Aufgabe {
    constructor(pfad, examen) {
        super(pfad);
        this.examen = examen;
        this.istExamen = true;
        examen.aufgaben[pfad] = this;
        const treffer = pfad.match(ExamensAufgabe.pfadRegExp);
        if (treffer == null || treffer.groups == null) {
            (0, helfer_1.zeigeFehler)(`Konnte den Pfad der Examensaufgabe nicht lesen: ${pfad}`);
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
     * @param ref z. B. `66116:2021:03`
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
        const examen = examen_1.Examen.erzeugeExamenVonReferenz(referenz);
        return new ExamensAufgabe(path_1.default.join(examen.verzeichnis, pfad), examen);
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
    gibTitelNurAufgabe(alsMarkdownLink = false) {
        const ausgabe = `Aufgabe ${this.aufgabe}${this.stichwörterFormatiert}`;
        if (alsMarkdownLink) {
            return (0, helfer_1.generiereLink)(ausgabe, this.pfad);
        }
        return ausgabe;
    }
    get dateiName() {
        const aufgabenReferenz = this.aufgabenReferenz.replace(/ /g, '-');
        return `${this.examen.dateiName}_${aufgabenReferenz}`;
    }
    get link() {
        return ((0, helfer_1.generiereLink)(this.titelKurz, this.pfad) +
            this.stichwörterFormatiert +
            ' (' +
            this.linkTex +
            ') ');
    }
    static erzeugePfad(arg1, arg2, arg3) {
        if (arg1 != null && arg2 != null && arg3 != null) {
            return path_1.default.join(`Thema-${arg1}`, `Teilaufgabe-${arg2}`, `Aufgabe-${arg3}.tex`);
        }
        else if (arg1 != null && arg2 != null && arg3 == null) {
            return path_1.default.join(`Thema-${arg1}`, `Aufgabe-${arg2}.tex`);
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
        let relativerPfad = (0, helfer_1.macheRelativenPfad)(this.pfad);
        relativerPfad = relativerPfad.replace('Staatsexamen/', '');
        relativerPfad = relativerPfad.replace('.tex', '');
        return `\\bExamensAufgabe{${relativerPfad}}`;
    }
    /**
     * Erzeugt ein TeX-Makro mit dem die Aufgabe in ein anderes Dokument
     * eingebunden werden kann. Es handelt sich hierbei um die alte Version des
     * Einbinden-Makros.
     *
     * @returns z. B. `\ExamensAufgabeTTA 66116 / 2021 / 03 : Thema 1 Teilaufgabe
     * 1 Aufgabe 1`
     */
    get einbindenTexMakroAlt() {
        let aufgabe = '';
        let suffix = '';
        const examen = `${this.examen.nummer} / ${this.examen.jahr} / ${this.examen.monat} :`;
        if (this.thema != null &&
            this.teilaufgabe != null &&
            this.aufgabe != null) {
            aufgabe = `Thema ${this.thema} Teilaufgabe ${this.teilaufgabe} Aufgabe ${this.aufgabe}`;
            suffix = 'TTA';
        }
        else if (this.thema != null &&
            this.aufgabe != null &&
            this.teilaufgabe == null) {
            aufgabe = `Thema ${this.thema} Aufgabe ${this.aufgabe}`;
            suffix = 'TA';
        }
        else {
            aufgabe = `Aufgabe ${this.aufgabe}`;
            suffix = 'A';
        }
        return `\n\\ExamensAufgabe${suffix} ${examen} ${aufgabe}`;
    }
}
exports.ExamensAufgabe = ExamensAufgabe;
ExamensAufgabe.pfadRegExp = /(?<nummer>\d{5})\/(?<jahr>\d{4})\/(?<monat>\d{2})\/(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/;
ExamensAufgabe.schwacherPfadRegExp = /(Thema-(?<thema>\d)\/)?(Teilaufgabe-(?<teilaufgabe>\d)\/)?Aufgabe-(?<aufgabe>\d+)\.tex$/;
class AufgabenSammlung {
    constructor(examenSammlung) {
        this.examenSammlung = examenSammlung;
        this.aufgaben = {};
        const dateien = glob_1.default.sync('**/*.tex', { cwd: helfer_1.repositoryPfad });
        this.aufgaben = {};
        for (const pfad of dateien) {
            const aufgabe = this.erzeugeAufgabe(pfad);
            if (aufgabe != null) {
                this.aufgaben[(0, helfer_1.macheRelativenPfad)(pfad)] = aufgabe;
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
        return this.aufgaben[(0, helfer_1.macheRelativenPfad)(pfad)];
    }
}
exports.AufgabenSammlung = AufgabenSammlung;
let aufgabenSammlung;
function gibAufgabenSammlung() {
    if (aufgabenSammlung == null) {
        aufgabenSammlung = new AufgabenSammlung((0, examen_1.gibExamenSammlung)());
    }
    return aufgabenSammlung;
}
exports.gibAufgabenSammlung = gibAufgabenSammlung;
