import chalk from 'chalk';
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
export function leseDatei(pfad) {
    return fs.readFileSync(pfad, { encoding: 'utf-8' });
}
export function löscheDatei(pfad) {
    if (!fs.existsSync(pfad)) {
        return;
    }
    fs.unlinkSync(pfad);
}
/**
 * @param pfad - Der Dateipfad, an dem die Text-Datei erzeugt werden soll.
 * @param inhalt - Der Text-Inhalt, der in die Datei geschrieben werden soll.
 */
export function schreibeDatei(pfad, inhalt) {
    fs.mkdirSync(path.dirname(pfad), { recursive: true });
    fs.writeFileSync(pfad, inhalt, { encoding: 'utf-8' });
}
export function zeigeFehler(meldung) {
    console.error(chalk.red(meldung));
    process.exit(1);
}
function leseKonfigurationsDateiJson() {
    return JSON.parse(leseDatei(path.join(path.sep, 'etc', 'bschlangaul.json')));
}
export const konfiguration = leseKonfigurationsDateiJson();
export const repositoryPfad = konfiguration.repos.examensAufgabenTex.lokalerPfad;
const githubRawUrl = konfiguration.github.rawUrl.replace('<name>', 'examens-aufgaben-tex');
/**
 * Erzeuge einen zum Git-Repository relativen Pfad.
 *
 * @param pfad Ein möglicherweise absoluter Pfad.
 *
 * @returns z. B. `Examen/66116.../`
 */
export function macheRelativenPfad(pfad) {
    pfad = pfad.replace(repositoryPfad, '');
    return pfad.replace(/^\//, '');
}
/**
 * Lese eine Text-Datei. Die Pfad kann in Segmenten angegeben werden. Handelt es
 * sich um keinen absoluten Pfad, wird angenommen, dass er relativ zum
 * Haupt-Repository liegt.
 *
 * @param args - Pfad-Segmente
 *
 * @returns Der Inhalt der Text-Datei als String.
 */
export function leseRepoDatei(...args) {
    let elternPfad = repositoryPfad;
    // Überprüfe, ob es sich bereits um einen absoluten Pfad handelt
    if (args[0].charAt(0) === path.sep) {
        elternPfad = '';
    }
    if (args[0].includes(repositoryPfad)) {
        return leseDatei(path.join(...args));
    }
    return leseDatei(path.join(elternPfad, ...args));
}
export function macheRepoPfad(...args) {
    if (args[0].includes(repositoryPfad)) {
        return path.join(...args);
    }
    return path.join(repositoryPfad, ...args);
}
/**
 * Generiere einen Markdown- oder HTML-Link.
 *
 * @param text Der Text, der als Link gesetzt werden soll.
 * @param pfad Der Datei-Pfad, zu dem gelinkt werden soll.
 *
 * @returns Ein Link zu einer Datei auf Github, entweder im Markdown- oder im
 * HTML-Format.
 */
export function generiereLink(text, pfad, einstellung) {
    let linkePdf = true;
    if (typeof (einstellung === null || einstellung === void 0 ? void 0 : einstellung.linkePdf) === 'boolean') {
        linkePdf = einstellung.linkePdf;
    }
    pfad = pfad.replace(repositoryPfad, '');
    pfad = pfad.replace(/^\//, '');
    if (linkePdf) {
        pfad = pfad.replace(/\.[\w]+$/, '.pdf');
    }
    return `[${text}](${githubRawUrl}/${pfad})`;
}
export function führeAus(programm, cwd) {
    const process = childProcess.spawnSync(programm, {
        cwd: cwd,
        encoding: 'utf-8',
        shell: true
    });
    if (process.status !== 0)
        throw Error(process.stderr + process.stdout);
    console.log(process.stdout);
}
export function öffneProgramm(programm, pfad) {
    const subprocess = childProcess.spawn(programm, [pfad], {
        detached: true,
        stdio: 'ignore'
    });
    subprocess.unref();
}
export function öffneVSCode(pfad) {
    öffneProgramm('/usr/bin/code', macheRepoPfad(pfad));
}
/**
 * Kleine Helfer-Klasse um Strings zu sammeln in einem Array zu speichern
 * und dann per Join über Zeileumbrüche zusammenzufügen.
 */
export class AusgabeSammler {
    constructor(redselig = false) {
        this.speicher = [];
        this.redselig = redselig;
    }
    /**
     * Sammle Textausgaben. Sie werden nur gesammelt, wenn sie nicht null und kein
     * leerer String ist.
     *
     * @param ausgabe - Die Textausgabe, die gespeichert werden soll.
     */
    sammle(ausgabe) {
        if (this.redselig) {
            console.log(ausgabe);
        }
        if (ausgabe != null && ausgabe !== '') {
            this.speicher.push(ausgabe);
        }
    }
    /**
     * Leeren den Ausgabenspeicher. Dabei wir keine neues Feld erzeugt, sondern
     * alle Einträge aus dem Array gelöscht.
     */
    leere() {
        this.speicher.splice(0, this.speicher.length);
    }
    /**
     * Gib die gesammelten Textschnipsel zusammengefügt als ein String zurück.
     *
     * @returns Die einzelnen Einträge des Felds mit `\n` zusammengefügt.
     */
    gibText() {
        return this.speicher.join('\n');
    }
}
//# sourceMappingURL=helfer.js.map