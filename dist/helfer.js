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
export const hauptRepoPfad = konfiguration.repos[konfiguration.hauptRepo].lokalerPfad;
const githubRawUrl = konfiguration.github.rawUrl.replace('<name>', 'examens-aufgaben-tex');
function gibRepoBasisPfad(repoId) {
    if (repoId != null) {
        return konfiguration.repos[repoId].lokalerPfad;
    }
    else {
        return hauptRepoPfad;
    }
}
/**
 * Erzeuge einen zum Git-Repository relativen Pfad.
 *
 * @param pfad - Ein möglicherweise absoluter Pfad.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist, z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 *
 * @returns z. B. `Examen/66116.../`
 */
export function macheRelativenPfad(pfad, repoId) {
    return pfad.replace(gibRepoBasisPfad(repoId), '').replace(/^\//, '');
}
/**
 * Wandelt einen relativen Pfad in einen absoluten Pfad um, der in einem der
 * Bschlangaul-Repositories liegt.
 *
 * Die Pfad kann in Segmenten angegeben werden. Handelt es sich um keinen
 * absoluten Pfad, wird angenommen, dass er relativ zum Haupt-Repository oder
 * zum einem mit der `repoId` angegeben Repository liegt.
 *
 * @param pfadSegmente - Ein Pfad oder Pfad-Segmente angegeben in einem Feld.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist, z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 */
export function gibRepoPfad(pfadSegmente, repoId) {
    if (typeof pfadSegmente === 'string') {
        pfadSegmente = [pfadSegmente];
    }
    const repoPfad = gibRepoBasisPfad(repoId);
    let elternPfad = repoPfad;
    // Überprüfe, ob es sich bereits um einen absoluten Pfad handelt
    if (pfadSegmente[0].charAt(0) === path.sep) {
        elternPfad = '';
    }
    if (pfadSegmente[0].includes(repoPfad)) {
        return path.join(...pfadSegmente);
    }
    return path.join(elternPfad, ...pfadSegmente);
}
/**
 * Lese eine Text-Datei. Der Pfad kann in Segmenten angegeben werden. Handelt es
 * sich um keinen absoluten Pfad, wird angenommen, dass er relativ zum
 * Haupt-Repository oder zum einem mit der `repoId` angegeben Repository liegt.
 *
 * @param pfadSegmente - Ein Pfad oder Pfad-Segmente angegeben in einem Feld.
 * @param repoId - Die Repository-ID muss dem Schlüssel entsprechen unter dem
 *   ein Repository (`repos[repoId]`) in der Konfigurationsdatei
 *   `/etc/bschlangaul.json` angegeben ist,  z. B. `examensAufgabenTex` oder
 *   `examenScans`.
 *
 * @returns Der Inhalt der Text-Datei als String.
 */
export function leseRepoDatei(pfadSegmente, repoId) {
    return leseDatei(gibRepoPfad(pfadSegmente, repoId));
}
export function generiereLink(text, url) {
    return `[${text}](${url})`;
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
export function generiereGithubRawLink(text, pfad, einstellung) {
    let linkePdf = true;
    if (typeof (einstellung === null || einstellung === void 0 ? void 0 : einstellung.linkePdf) === 'boolean') {
        linkePdf = einstellung.linkePdf;
    }
    pfad = pfad.replace(hauptRepoPfad, '');
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
    öffneProgramm('/usr/bin/code', gibRepoPfad(pfad));
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