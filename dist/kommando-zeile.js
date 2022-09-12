#! /usr/bin/env node
/**
 * Mit Hilfe des Pakets `commander` ein Kommandozeilen-Interface bereitstellen.
 */
import { Command } from 'commander';
import aktionen from './aktionen';
import { setzeLogEbene, gibLogEbene, log } from './log';
function steigereRedseligkeit(dummyValue, verbosity) {
    verbosity = verbosity + 1;
    if (verbosity === 1) {
        setzeLogEbene('info');
    }
    else if (verbosity === 2) {
        setzeLogEbene('verbose');
    }
    else {
        setzeLogEbene('debug');
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
const programm = new Command()
    .description('Ein Kommandozeilen-Tool (Werkzeug), um verschiedene administrative Aufgaben, wie z. B. das Erzeugen von Aufgaben-Sammlungen, TeX-Vorlagen etc. zu erledigen.')
    .name('bschlangaul-werkzeug')
    .version('0.1.0')
    .option('-v, --verbose', 'Die mehrmalige Angabe der Option steigert die Redseligkeit.', steigereRedseligkeit, 0);
programm.hook('preAction', () => {
    log('info', 'Log-Ebene: %s', gibLogEbene());
});
programm.on('command:*', function () {
    console.error('Ungültiger Befehl: %s\nBenutze das Argument --help, um eine Liste der verfügbaren Befehle anzuzeigen.', programm.args.join(' '));
    process.exit(1);
});
programm
    .command('erzeuge-aufgabe [titel]')
    .description('Erzeuge eine Aufgabe im aktuellen Arbeitsverzeichnis.')
    .alias('a')
    .action(aktionen.erzeugeAufgabenVorlage);
programm
    .command('erzeuge-examens-aufgabe <referenz> <thema> [teilaufgabe] [aufgabe]')
    .description('Erzeuge eine Examensaufgabe im Verzeichnis „Examen“.')
    .alias('e')
    .action(aktionen.erzeugeExamensAufgabeVorlage);
programm
    .command('oeffne <referenz...>')
    .description('Öffne eine Examen oder andere Materialien durch die Referenz, z. B. 66116:2020:09.')
    .alias('o')
    .action(aktionen.öffne);
programm
    .command('oeffne-stichwort <stichwort>')
    .description('Öffne Aufgaben anhand des Stichworts')
    .alias('s')
    .action(aktionen.öffneDurchStichwort);
const readme = new Command('readme').description('Erzeuge die README-Dateien für verschiedene Repositories');
readme
    .command('haupt')
    .description('Erzeuge die README-Datei für das Haupt-Repository „examens-aufgaben-tex“.')
    .action(aktionen.erzeugeReadmeHaupt);
readme
    .command('scans')
    .description('Erzeuge die README-Datei für das Repository „examen-scans“.')
    .action(aktionen.erzeugeReadmeExamenScans);
programm.addCommand(readme);
programm
    .command('kompiliere-tex')
    .description('Kompiliere mehrere TeX-Dateien auf einmal.')
    .alias('k')
    .option('--oeffne-editor', 'Öffne eine fehlerhafte TeX-Datei im Editor „Visual Studio Code“')
    .option('-x, --ausschliessen <zeichenkette>', 'Dateien ausschließen, die die gegebene Zeichenkette enthalten.')
    .option('-d, --trockener-lauf', 'Nichts kompilieren, nur die Dateien auflisten, die kompiliert werden.')
    .action(aktionen.kompiliereTex);
programm
    .command('sql <tex-datei>')
    .description('Führe SQL-Code in einer TeX-Datei aus. Der Code muss in \\begin{minted}{sql}…\\end{minted} eingerahmt sein.')
    .alias('s')
    .option('-a, --anfrage <nummer>', 'Führe nur die Anfrage mit der gegebenen Nummer aus.')
    .option('-n, --nicht-loeschen', 'Die Datenbank und die temporären SQL-Dateien am Ende der Ausführung nicht löschen.')
    .action(aktionen.führeSqlAus);
programm
    .command('code [glob]')
    .alias('c')
    .description('Öffne die mit glob spezifizierten Dateien in Visual Studio Code')
    .option('-n, --kein-index', 'Öffne nur die Dateien, die keinen Index haben.')
    .option('-t, --kein-titel', 'Öffne nur die Dateien, die keinen Titel haben. \\bAufgabenTitel{}.')
    .action(aktionen.öffneDurchGlobInVSCode);
programm
    .command('seiten-loeschen <pdf-datei>')
    .alias('l')
    .description('Gerade Seiten in einer PDF-Datei löschen. Die erste, dritte Seite etc. bleibt bestehen.')
    .action(aktionen.löscheGeradeSeitenInPdf);
programm
    .command('txt-exportieren <pdf-datei>')
    .alias('t')
    .description('TXT aus einer PDF-Datei exportieren.')
    .action(aktionen.exportiereTxtAusPdf);
programm
    .command('ocr <pdf-datei>')
    .description('Texterkennung in einer PDF-Datei durchführen.')
    .action(aktionen.erkenneTextInPdf);
programm
    .command('rotiere-pdf <pdf-datei>')
    .alias('r')
    .description('PDF-Datei rotieren.')
    .action(aktionen.rotierePdf);
const sammlung = new Command('sammlungen')
    .description('Erzeuge verschiedene Sammlungen (z. B. Alle Aufgaben eines Examens)')
    .alias('sa');
sammlung
    .command('haupt')
    .alias('h')
    .description('Erzeuge die Haupt-PDF-Datei „Bschlangaul-Sammlung.tex“')
    .action(aktionen.erzeugeHauptBschlangaulSammlungTex);
sammlung
    .command('examen')
    .alias('e')
    .description('Erzeuge pro Examen eine TeX-Datei. ' +
    'Das Examen muss mindestens eine gelöste Aufgabe haben')
    .action(aktionen.erzeugeExamensLösungen);
sammlung
    .command('examen-scans')
    .alias('s')
    .description('Füge mehrer Examen-Scans in einer PDF-Datei zusammen sind.')
    .action(aktionen.erzeugeExamenScansSammlung);
programm.addCommand(sammlung);
programm
    .command('enumerate-item <tex-datei>')
    .alias('ei')
    .description('a) b) ... i) iii) durch \\item ersetzen.')
    .action(aktionen.erzeugeListenElemente);
programm
    .command('flaci-to-tikz <jsonDatei>')
    .alias('flaci')
    .description('Konvertieren flaci.com Automaten to TikZ-Automaten')
    .action(aktionen.konvertiereFlaciZuTikz);
programm
    .command('dtx')
    .description('*.sty zu einem dtx zusammenfügen')
    .action(aktionen.erzeugeTexDokumentation);
programm
    .command('metadaten <texDateiOderGlob>')
    .alias('m')
    .description('Erzeuge die Metadaten in einer TeX-Datei.')
    .action(aktionen.erzeugeAufgabenMetadaten);
programm
    .command('validiere')
    .alias('v')
    .description('Überprüfe / validiere ob es die Stichwörter in \\index{} gibt. ' +
    'Ob es die Werte für die Metadaten-Schlüssel BearbeitungsStand und ' +
    'Korrektheit in den Metadaten gibt')
    .action(aktionen.validiere);
export default programm;
//# sourceMappingURL=kommando-zeile.js.map