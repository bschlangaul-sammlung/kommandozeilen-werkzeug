#! /usr/bin/env node
"use strict";
/**
 * Mit Hilfe des Pakets `commander` ein Kommandozeilen-Interface bereitstellen.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const aktionen_1 = __importDefault(require("./aktionen"));
const log_1 = require("./log");
const aufgabe = __importStar(require("./aufgabe"));
function steigereRedseligkeit(dummyValue, verbosity) {
    verbosity = verbosity + 1;
    if (verbosity === 1) {
        (0, log_1.setzeLogEbene)('info');
    }
    else if (verbosity === 2) {
        (0, log_1.setzeLogEbene)('verbose');
    }
    else {
        (0, log_1.setzeLogEbene)('debug');
    }
    return verbosity;
}
function konvertierteGradFeldFürHilfe(grad) {
    const ausgabe = [];
    for (let index = 0; index < grad.length; index++) {
        const value = grad[index];
        ausgabe.push(`${index}: ${value}`);
    }
    return ausgabe.join(', ');
}
const programm = new commander_1.Command()
    .description('Ein Kommandozeilen-Tool (Werkzeug), um verschiedene administrative Aufgaben, wie z. B. das Erzeugen von Aufgaben-Sammlungen, TeX-Vorlagen etc. zu erledigen.')
    .name('bschlangaul-werkzeug')
    .version('0.1.0')
    .option('-v, --verbose', 'Die mehrmalige Angabe der Option steigert die Redseligkeit.', steigereRedseligkeit, 0);
programm.hook('preAction', () => {
    (0, log_1.log)('info', 'Log-Ebene: %s', (0, log_1.gibLogEbene)());
});
programm.on('command:*', function () {
    console.error('Ungültiger Befehl: %s\nBenutze das Argument --help, um eine Liste der verfügbaren Befehle anzuzeigen.', programm.args.join(' '));
    process.exit(1);
});
programm
    .command('erzeuge-aufgabe [titel]')
    .description('Erzeuge eine Aufgabe im aktuellen Arbeitsverzeichnis.')
    .alias('a')
    .action(aktionen_1.default.erzeugeAufgabenVorlage);
programm
    .command('erzeuge-examens-aufgabe <referenz> <thema> [teilaufgabe] [aufgabe]')
    .description('Erzeuge eine Examensaufgabe im Verzeichnis „Staatsexamen“.')
    .alias('e')
    .action(aktionen_1.default.erzeugeExamensAufgabeVorlage);
programm
    .command('oeffne <referenz...>')
    .description('Öffne eine Staatsexamen oder andere Materialien durch die Referenz, z. B. 66116:2020:09.')
    .alias('o')
    .action(aktionen_1.default.öffne);
programm
    .command('oeffne-stichwort <stichwort>')
    .description('Öffne Aufgaben anhand des Stichworts')
    .alias('s')
    .action(aktionen_1.default.öffneDurchStichwort);
programm
    .command('generiere-readme')
    .description('Erzeuge die README-Datei.')
    .alias('r')
    .action(aktionen_1.default.erzeugeReadme);
programm
    .command('kompiliere-tex')
    .description('Kompiliere mehrere TeX-Dateien auf einmal.')
    .alias('k')
    .option('--oeffne-editor', 'Öffne eine fehlerhafte TeX-Datei im Editor „Visual Studio Code“')
    .option('-m, --module', 'Kompiliere alle TeX-Dateien im Unterverzeichnis „Module“')
    .option('-e, --examen', 'Kompiliere alle TeX-Dateien im Unterverzeichnis „Staatsexamen“')
    .option('-x, --ausschliessen <zeichenkette>', 'Dateien ausschließen, die die gegebene Zeichenkette enthalten.')
    .option('-b, --unter-verzeichnis <relativer-pfad>', 'Nur TeX-Dateien in dem angegeben Unterverzeichnis neu kompilieren.')
    .option('-d, --trockener-lauf', 'Nichts kompilieren, nur die Dateien auflisten, die kompiliert werden.')
    .action(aktionen_1.default.kompiliereTex);
programm
    .command('sql <tex-datei>')
    .description('Führe SQL-Code in einer TeX-Datei aus. Der Code muss in \\begin{minted}{sql}…\\end{minted} eingerahmt sein.')
    .alias('s')
    .option('-a, --anfrage <nummer>', 'Führe nur die Anfrage mit der gegebenen Nummer aus.')
    .option('-n, --nicht-loeschen', 'Die Datenbank und die temporären SQL-Dateien am Ende der Ausführung nicht löschen.')
    .action(aktionen_1.default.führeSqlAus);
programm
    .command('code [glob]')
    .alias('c')
    .description('Öffne die mit glob spezifizierten Dateien in Visual Studio Code')
    .option('-n, --kein-index', 'Öffne nur die Dateien, die keinen Index haben.')
    .option('-t, --kein-titel', 'Öffne nur die Dateien, die keinen Titel haben. \\bAufgabenTitel{}.')
    .action(aktionen_1.default.öffneDurchGlobInVSCode);
programm
    .command('seiten-loeschen <pdf-datei>')
    .alias('l')
    .description('Gerade Seiten in einer PDF-Datei löschen. Die erste, dritte Seite etc. bleibt bestehen.')
    .action(aktionen_1.default.löscheGeradeSeitenInPdf);
programm
    .command('txt-exportieren <pdf-datei>')
    .alias('t')
    .description('TXT aus einer PDF-Datei exportieren.')
    .action(aktionen_1.default.exportiereTxtAusPdf);
programm
    .command('ocr <pdf-datei>')
    .description('Texterkennung in einer PDF-Datei durchführen.')
    .action(aktionen_1.default.erkenneTextInPdf);
programm
    .command('rotiere-pdf <pdf-datei>')
    .alias('r')
    .description('PDF-Datei rotieren.')
    .action(aktionen_1.default.rotierePdf);
const sammlung = new commander_1.Command('sammlungen')
    .description('Erzeuge verschiedene Sammlungen (z. B. Alle Aufgaben eines Examens)')
    .alias('sa');
sammlung
    .command('aufgaben')
    .alias('as')
    .description('Erzeuge eine Sammlung an Aufgaben, d. h. ein Dokument in dem mehrere Aufgaben nach verschiedenen Kritieren eingebunden werden.')
    .option('-b, --bearbeitungs-stand <grad>', 'Nur Aufgaben mit mindestens den Bearbeitungsstand. ' +
    konvertierteGradFeldFürHilfe(aufgabe.bearbeitungsStand))
    .option('-k, --korrektheit <grad>', 'Nur Aufgaben mit mindestens dem Grad an Korrektheit. ' +
    konvertierteGradFeldFürHilfe(aufgabe.korrektheit))
    .option('-z, --ziel <pfad>', '')
    .option('-e, --examen', 'Nur Examensaufgaben')
    .option('-m, --module', 'Nur Module')
    .action(aktionen_1.default.erzeugeAufgabenSammlung);
sammlung
    .command('examen')
    .alias('e')
    .description('Erzeuge pro Examen eine TeX-Datei. ' +
    'Das Examen muss mindestens eine gelöste Aufgabe haben')
    .action(aktionen_1.default.erzeugeExamensLösungen);
sammlung
    .command('examen-scans')
    .alias('s')
    .description('Füge mehrer Examen-Scans in einer PDF-Datei zusammen sind.')
    .action(aktionen_1.default.erzeugeExamenScansSammlung);
programm.addCommand(sammlung);
programm
    .command('enumerate-item <tex-datei>')
    .alias('ei')
    .description('a) b) ... i) iii) durch \\item ersetzen.')
    .action(aktionen_1.default.erzeugeListenElemente);
programm
    .command('flaci-to-tikz <jsonDatei>')
    .alias('flaci')
    .description('Konvertieren flaci.com Automaten to TikZ-Automaten')
    .action(aktionen_1.default.konvertiereFlaciZuTikz);
programm
    .command('dtx')
    .description('*.sty zu einem dtx zusammenfügen')
    .action(aktionen_1.default.erzeugeTexDokumentation);
programm
    .command('metadaten <texDatei>')
    .alias('m')
    .description('Erzeuge die Metadaten in einer TeX-Datei.')
    .action(aktionen_1.default.erzeugeAufgabenMetadaten);
programm
    .command('validiere')
    .alias('v')
    .description('Überprüfe / validiere ob es die Stichwörter in \\index{} gibt. ' +
    'Ob es die Werte für die Metadaten-Schlüssel BearbeitungsStand und ' +
    'Korrektheit in den Metadaten gibt')
    .action(aktionen_1.default.validiere);
exports.default = programm;
