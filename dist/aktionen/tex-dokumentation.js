import glob from 'glob';
import path from 'path';
import { repositoryPfad, leseDatei, schreibeDatei, führeAus, öffneProgramm, AusgabeSammler } from '../helfer';
import { log } from '../log';
const übergeordneterPfad = path.join(repositoryPfad, '..', 'latex_vorlagen');
const dtxPfad = path.join(übergeordneterPfad, 'dokumentation.dtx');
/**
 * @param segmente Relativ zum übergeordneten .tex-Verzeichnis
 */
function gibAbsolutenPfad(...segmente) {
    return path.join(übergeordneterPfad, ...segmente);
}
function leseTexDatei(dateiPfad) {
    log('info', `Lese Datei: ${dateiPfad}`);
    const inhalt = leseDatei(dateiPfad);
    const dateiName = path.basename(dateiPfad);
    const prefix = '%    \\end{macrocode}\n' +
        '% \\subsection{' +
        dateiName +
        '}\n' +
        '%    \\begin{macrocode}\n';
    return prefix + inhalt;
}
function kompiliereDtxDatei() {
    führeAus('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad);
    führeAus('makeindex -s gglo.ist -o dokumentation.gls dokumentation.glo', übergeordneterPfad);
    führeAus('makeindex -s gind.ist -o dokumentation.ind dokumentation.idx', übergeordneterPfad);
    führeAus('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad);
}
function leseVerzeichnis(verzeichnis, dateiEndung) {
    const ausgabe = new AusgabeSammler();
    const dateinamen = glob.sync('**/*.' + dateiEndung, {
        cwd: gibAbsolutenPfad(verzeichnis)
    });
    for (const dateiname of dateinamen) {
        ausgabe.sammle(leseTexDatei(gibAbsolutenPfad(verzeichnis, dateiname)));
    }
    return ausgabe.gibText();
}
export default function () {
    let textkörper = leseDatei(path.join(übergeordneterPfad, 'dokumentation_vorlage.dtx'));
    // klassen
    textkörper = textkörper.replace('{{ klassen }}', leseVerzeichnis('klassen', 'cls'));
    // pakete
    textkörper = textkörper.replace('{{ pakete }}', leseVerzeichnis('pakete', 'sty'));
    schreibeDatei(dtxPfad, textkörper);
    kompiliereDtxDatei();
    öffneProgramm('/usr/bin/xdg-open', path.join(übergeordneterPfad, 'dokumentation.pdf'));
}
//# sourceMappingURL=tex-dokumentation.js.map