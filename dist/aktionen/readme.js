import fs from 'fs';
import nunjucks from 'nunjucks';
import { Aufgabe } from '../aufgabe';
import { gibStichwortVerzeichnis } from '../stichwort-verzeichnis';
import { leseRepoDatei, gibRepoPfad } from '../helfer';
import { erzeugeExamensÜbersicht } from './aufgaben-sammlung';
function erzeugeMarkdownAufgabenListe(aufgabenListe) {
    const aufgaben = Array.from(aufgabenListe);
    aufgaben.sort(Aufgabe.vergleichePfade);
    const teil = [];
    for (const aufgabe of aufgaben) {
        teil.push('- ' + aufgabe.link);
    }
    return teil.join('\n');
}
function ersetzeStichwörterInReadme(stichwort) {
    return erzeugeMarkdownAufgabenListe(gibStichwortVerzeichnis().gibAufgabenMitStichwortUnterBaum(stichwort));
}
export function erzeugeReadmeExamenScans() {
    let inhalt = leseRepoDatei('README_template.md', 'examenScans');
    inhalt = nunjucks.renderString(inhalt, {
        uebersicht: erzeugeExamensÜbersicht(false)
    });
    fs.writeFileSync(gibRepoPfad('README.md', 'examenScans'), inhalt);
}
export function erzeugeReadmeHaupt() {
    let inhalt = leseRepoDatei('README_template.md');
    inhalt = nunjucks.renderString(inhalt, {
        gibAufgabenListe: ersetzeStichwörterInReadme,
        stichwortverzeichnis: leseRepoDatei('Stichwortverzeichnis.yml'),
        staatsexamen: erzeugeExamensÜbersicht()
    });
    fs.writeFileSync(gibRepoPfad('README.md'), inhalt);
}
//# sourceMappingURL=readme.js.map