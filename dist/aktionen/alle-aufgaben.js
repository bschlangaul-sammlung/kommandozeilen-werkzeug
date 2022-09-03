import path from 'path';
import fs from 'fs';
import nunjucks from 'nunjucks';
import { Aufgabe } from '../aufgabe';
import { gibAufgaben } from '../stichwort-verzeichnis';
import { repositoryPfad, leseRepoDatei } from '../helfer';
const verwendeteAufgaben = new Set();
function generiereAufgabenListe(aufgabenListe, stichwort, ueberschrift = 0) {
    const zeilen = [];
    if (ueberschrift > 0) {
        let makro;
        switch (ueberschrift) {
            case 1:
                makro = 'chapter';
                break;
            case 2:
                makro = 'section';
                break;
            case 3:
                makro = 'subsection';
                break;
            case 4:
                makro = 'subsubsection';
                break;
            default:
                makro = 'section';
                break;
        }
        zeilen.push(`\\${makro}{${stichwort}}`);
    }
    const aufgaben = Array.from(aufgabenListe);
    aufgaben.sort(Aufgabe.vergleichePfade);
    for (const aufgabe of aufgaben) {
        if (!verwendeteAufgaben.has(aufgabe.relativerPfad)) {
            zeilen.push(aufgabe.einbindenTexMakro);
            verwendeteAufgaben.add(aufgabe.relativerPfad);
        }
    }
    return zeilen.join('\n');
}
function ersetzeStichwörterInReadme(stichwort, überschrift = 0) {
    return generiereAufgabenListe(gibAufgaben(stichwort), stichwort, überschrift);
}
export default function () {
    let inhalt = leseRepoDatei('Alle-Aufgaben.tex_template');
    inhalt = nunjucks.renderString(inhalt, {
        gibAufgabenListe: ersetzeStichwörterInReadme
    });
    console.log(inhalt);
    fs.writeFileSync(path.join(repositoryPfad, 'Alle-Aufgaben.tex'), inhalt);
}
//# sourceMappingURL=alle-aufgaben.js.map