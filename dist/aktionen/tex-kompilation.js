"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const helfer_1 = require("../helfer");
const fehler = [];
function default_1(opts) {
    let cwd;
    if (opts.unterVerzeichnis != null) {
        cwd = path_1.default.join(helfer_1.repositoryPfad, opts.unterVerzeichnis);
    }
    else if (opts.examen != null && opts.examen) {
        cwd = path_1.default.join(helfer_1.repositoryPfad, 'Staatsexamen');
    }
    else if (opts.module != null && opts.module) {
        cwd = path_1.default.join(helfer_1.repositoryPfad, 'Module');
    }
    else {
        cwd = helfer_1.repositoryPfad;
    }
    console.log(`Kompiliere alle TeX-Dateien im Verzeichnis: ${cwd}`);
    const dateien = glob_1.default.sync('**/*.tex', { cwd });
    for (let pfad of dateien) {
        pfad = path_1.default.join(cwd, pfad);
        if (opts.ausschliessen != null && pfad.includes(opts.ausschliessen)) {
            console.log('ausgeschossen: ' + pfad);
        }
        else {
            let ergebnis;
            if (opts.trockenerLauf != null && opts.trockenerLauf) {
                ergebnis = child_process_1.default.spawnSync('cat', [pfad], {
                    encoding: 'utf-8'
                });
            }
            else {
                ergebnis = child_process_1.default.spawnSync('latexmk', ['-shell-escape', '-cd', '--lualatex', pfad], {
                    encoding: 'utf-8'
                });
            }
            if (ergebnis.status === 0) {
                console.log(chalk_1.default.green(pfad));
            }
            else {
                fehler.push(pfad);
                console.log(chalk_1.default.yellow(ergebnis.stdout));
                console.log(chalk_1.default.red(ergebnis.stderr));
                if (opts.oeffneEditor != null && opts.oeffneEditor) {
                    (0, helfer_1.öffneVSCode)(pfad);
                }
                console.log(chalk_1.default.red(pfad));
            }
        }
    }
    for (const pfad of fehler) {
        console.log(chalk_1.default.red(pfad));
    }
}
exports.default = default_1;
