import yaml from 'js-yaml';
import glob from 'glob';
import { leseRepoDatei, repositoryPfad, zeigeFehler, öffneVSCode } from './helfer';
import { gibAufgabenSammlung } from './aufgabe';
import { findBestMatch } from 'string-similarity';
export class StichwortBaum {
    constructor() {
        this.flach = new Set();
        const roherBaum = yaml.load(leseRepoDatei('Stichwortverzeichnis.yml'));
        if (roherBaum == null) {
            zeigeFehler('Konnte die Konfigurationsdatei nicht lesen');
        }
        this.baum = this.normalisiereBaum(roherBaum);
    }
    fügeStichwortSicherHinzu(stichwort) {
        if (this.flach.has(stichwort)) {
            zeigeFehler(`Doppeltes Stichwort: ${stichwort}`);
        }
        else {
            this.flach.add(stichwort);
            return false;
        }
    }
    existiertStichwort(stichwort) {
        return this.flach.has(stichwort);
    }
    /**
     * Da die YAML-Datei wegen der Anzeige in der README-Datei alle
     * Stichwörter mit einem vorangstellten `- ` auflistete, ist die
     * Ausgabe aus der YAML-Datei sehr verschachtelt
     */
    normalisiereBaum(eingang, ausgang) {
        if (ausgang == null) {
            ausgang = {};
        }
        if (typeof eingang === 'string') {
            if (!this.fügeStichwortSicherHinzu(eingang)) {
                ausgang[eingang] = true;
            }
        }
        else if (Array.isArray(eingang)) {
            for (const t of eingang) {
                this.normalisiereBaum(t, ausgang);
            }
        }
        else if (typeof eingang === 'object') {
            for (const stichwort in eingang) {
                if (!this.fügeStichwortSicherHinzu(stichwort)) {
                    ausgang[stichwort] = this.normalisiereBaum(eingang[stichwort]);
                }
            }
        }
        else {
            zeigeFehler('Unbekannter Datentyp für den Stichwortbaum');
        }
        return ausgang;
    }
    gibUnterBaum(stichwort, baum) {
        if (baum == null) {
            baum = this.baum;
        }
        for (const s in baum) {
            if (s === stichwort) {
                if (typeof baum[s] === 'boolean') {
                    return { [stichwort]: true };
                }
                else {
                    return baum[s];
                }
            }
            else if (typeof baum[s] === 'object') {
                const ergebnis = this.gibUnterBaum(stichwort, baum[s]);
                if (ergebnis != null) {
                    return ergebnis;
                }
            }
        }
    }
    verflacheBaum(baum, flacherBaum) {
        if (flacherBaum == null) {
            flacherBaum = new Set();
        }
        for (const s in baum) {
            if (baum[s] === true) {
                flacherBaum.add(s);
            }
            else {
                flacherBaum.add(s);
                this.verflacheBaum(baum[s], flacherBaum);
            }
        }
        return flacherBaum;
    }
    /**
     * Das übergebene Stichwort ist in der flachen Stichwortliste enthalten.
     */
    gibFlacheListe(stichwort) {
        const unterBaum = this.gibUnterBaum(stichwort);
        if (unterBaum == null) {
            return new Set();
        }
        else {
            const flacheListe = this.verflacheBaum(unterBaum);
            flacheListe.add(stichwort);
            return flacheListe;
        }
    }
    findeÄhnliches(suche) {
        const ergebnis = findBestMatch(suche, Array.from(this.flach));
        return ergebnis.bestMatch.target;
    }
}
export class StichwortVerzeichnis {
    constructor(stichwortBaum, aufgabenSammlung) {
        this.stichwortBaum = stichwortBaum;
        this.aufgabenSammlung = aufgabenSammlung;
        const dateien = glob.sync('**/*.tex', { cwd: repositoryPfad });
        this.verzeichnis = {};
        for (const pfad of dateien) {
            if (this.aufgabenSammlung.istAufgabenPfad(pfad)) {
                const aufgabe = this.aufgabenSammlung.gib(pfad);
                for (const stichwort of aufgabe.stichwörter) {
                    if (!stichwortBaum.existiertStichwort(stichwort)) {
                        öffneVSCode(pfad);
                        console.log('Möglicherweise war dieses Stichwort gemeint: ' +
                            this.stichwortBaum.findeÄhnliches(stichwort));
                        zeigeFehler(`Das Stichwort „${stichwort}“ in der Datei „${pfad}“ gibt es nicht.`);
                    }
                    if (this.verzeichnis[stichwort] != null) {
                        this.verzeichnis[stichwort].add(aufgabe);
                    }
                    else {
                        this.verzeichnis[stichwort] = new Set();
                        this.verzeichnis[stichwort].add(aufgabe);
                    }
                }
            }
        }
    }
    gibAufgabenMitStichwort(stichwort) {
        if (this.verzeichnis[stichwort] != null) {
            return this.verzeichnis[stichwort];
        }
        return new Set();
    }
    gibAufgabenMitStichwortUnterBaum(stichwort) {
        const stichwörter = this.stichwortBaum.gibFlacheListe(stichwort);
        const aufgaben = new Set();
        for (const stichwort of stichwörter) {
            for (const aufgabe of this.gibAufgabenMitStichwort(stichwort)) {
                aufgaben.add(aufgabe);
            }
        }
        return aufgaben;
    }
}
let stichwortBaum;
export function gibStichwortBaum() {
    if (stichwortBaum == null) {
        stichwortBaum = new StichwortBaum();
    }
    return stichwortBaum;
}
let stichwortVerzeichnis;
export function gibStichwortVerzeichnis() {
    if (stichwortVerzeichnis == null) {
        stichwortVerzeichnis = new StichwortVerzeichnis(gibStichwortBaum(), gibAufgabenSammlung());
    }
    return stichwortVerzeichnis;
}
//# sourceMappingURL=stichwort-verzeichnis.js.map