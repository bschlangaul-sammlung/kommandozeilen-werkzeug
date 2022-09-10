import path from 'path';
import fs from 'fs';
import nunjucks from 'nunjucks';
import { Aufgabe } from '../aufgabe';
import { gibStichwortVerzeichnis } from '../stichwort-verzeichnis';
import { hauptRepoPfad, leseRepoDatei } from '../helfer';
import { generiereExamensÜbersicht } from './aufgaben-sammlung';
function generiereMarkdownAufgabenListe(aufgabenListe) {
    const aufgaben = Array.from(aufgabenListe);
    aufgaben.sort(Aufgabe.vergleichePfade);
    const teil = [];
    for (const aufgabe of aufgaben) {
        teil.push('- ' + aufgabe.link);
    }
    return teil.join('\n');
}
function ersetzeStichwörterInReadme(stichwort) {
    return generiereMarkdownAufgabenListe(gibStichwortVerzeichnis().gibAufgabenMitStichwortUnterBaum(stichwort));
}
export default function () {
    let inhalt = leseRepoDatei('README_template.md');
    inhalt = nunjucks.renderString(inhalt, {
        gibAufgabenListe: ersetzeStichwörterInReadme,
        stichwortverzeichnis: leseRepoDatei('Stichwortverzeichnis.yml'),
        staatsexamen: generiereExamensÜbersicht()
    });
    fs.writeFileSync(path.join(hauptRepoPfad, 'README.md'), inhalt);
}
//# sourceMappingURL=readme.js.map