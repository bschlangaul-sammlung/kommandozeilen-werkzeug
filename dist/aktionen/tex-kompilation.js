import childProcess from 'child_process';
import glob from 'glob';
import path from 'path';
import chalk from 'chalk';
import { öffneVSCode } from '../helfer';
import { gibAufgabenSammlung } from '../aufgabe';
const fehler = [];
export default function (opts) {
    const cwd = process.cwd();
    console.log(`Kompiliere alle TeX-Dateien im Verzeichnis: ${cwd}`);
    const aufgabenSammlung = gibAufgabenSammlung();
    const dateien = glob.sync('**/*.tex', { cwd });
    for (let pfad of dateien) {
        pfad = path.join(cwd, pfad);
        const aufgabe = aufgabenSammlung.erzeugeAufgabe(pfad);
        if (aufgabe != null && aufgabe.bearbeitungsStandGrad < 3) {
            console.log('Ausgeschlossen wegen Bearbeitungsstand');
        }
        else if (opts.ausschliessen != null &&
            pfad.includes(opts.ausschliessen)) {
            console.log('ausgeschossen: ' + pfad);
        }
        else {
            let ergebnis;
            if (opts.trockenerLauf != null && opts.trockenerLauf) {
                ergebnis = childProcess.spawnSync('cat', [pfad], {
                    encoding: 'utf-8'
                });
            }
            else {
                ergebnis = childProcess.spawnSync('latexmk', ['-shell-escape', '-cd', '--lualatex', pfad], {
                    encoding: 'utf-8'
                });
            }
            if (ergebnis.status === 0) {
                console.log(chalk.green(pfad));
            }
            else {
                fehler.push(pfad);
                console.log(chalk.yellow(ergebnis.stdout));
                console.log(chalk.red(ergebnis.stderr));
                if (opts.oeffneEditor != null && opts.oeffneEditor) {
                    öffneVSCode(pfad);
                }
                console.log(chalk.red(pfad));
            }
        }
    }
    for (const pfad of fehler) {
        console.log(chalk.red(pfad));
    }
}
//# sourceMappingURL=tex-kompilation.js.map