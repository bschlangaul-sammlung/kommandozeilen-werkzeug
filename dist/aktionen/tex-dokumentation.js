"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const helfer_1 = require("../helfer");
const log_1 = require("../log");
const übergeordneterPfad = path_1.default.join(helfer_1.repositoryPfad, '.tex');
const dtxPfad = path_1.default.join(übergeordneterPfad, 'dokumentation.dtx');
/**
 * @param segmente Relativ zum übergeordneten .tex-Verzeichnis
 */
function gibAbsolutenPfad(...segmente) {
    return path_1.default.join(übergeordneterPfad, ...segmente);
}
function leseTexDatei(dateiPfad) {
    (0, log_1.log)('info', `Lese Datei: ${dateiPfad}`);
    const inhalt = (0, helfer_1.leseDatei)(dateiPfad);
    const dateiName = path_1.default.basename(dateiPfad);
    const prefix = '%    \\end{macrocode}\n' +
        '% \\subsection{' +
        dateiName +
        '}\n' +
        '%    \\begin{macrocode}\n';
    return prefix + inhalt;
}
function kompiliereDtxDatei() {
    (0, helfer_1.führeAus)('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad);
    (0, helfer_1.führeAus)('makeindex -s gglo.ist -o dokumentation.gls dokumentation.glo', übergeordneterPfad);
    (0, helfer_1.führeAus)('makeindex -s gind.ist -o dokumentation.ind dokumentation.idx', übergeordneterPfad);
    (0, helfer_1.führeAus)('lualatex --shell-escape dokumentation.dtx', übergeordneterPfad);
}
function leseVerzeichnis(verzeichnis, dateiEndung) {
    const ausgabe = new helfer_1.AusgabeSammler();
    const dateinamen = glob_1.default.sync('**/*.' + dateiEndung, {
        cwd: gibAbsolutenPfad(verzeichnis)
    });
    for (const dateiname of dateinamen) {
        ausgabe.sammle(leseTexDatei(gibAbsolutenPfad(verzeichnis, dateiname)));
    }
    return ausgabe.gibText();
}
function default_1() {
    let textkörper = (0, helfer_1.leseDatei)(path_1.default.join(übergeordneterPfad, 'dokumentation_vorlage.dtx'));
    // klassen
    textkörper = textkörper.replace('{{ klassen }}', leseVerzeichnis('klassen', 'cls'));
    // pakete
    textkörper = textkörper.replace('{{ pakete }}', leseVerzeichnis('pakete', 'sty'));
    (0, helfer_1.schreibeDatei)(dtxPfad, textkörper);
    kompiliereDtxDatei();
    (0, helfer_1.öffneProgramm)('/usr/bin/xdg-open', path_1.default.join(übergeordneterPfad, 'dokumentation.pdf'));
}
exports.default = default_1;
//# sourceMappingURL=tex-dokumentation.js.map