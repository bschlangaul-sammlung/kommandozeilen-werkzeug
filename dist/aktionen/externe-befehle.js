/**
 * Rufe externe Kommandzeilen-Befehle auf.
 */
import childProcess from 'child_process';
import fs from 'fs';
export function erkenneTextInPdf(datei) {
    const process = childProcess.spawnSync('ocrmypdf', [
        '--deskew',
        '--rotate-pages',
        '--force-ocr',
        '-l',
        'deu+eng',
        '--sidecar',
        `${datei}.txt`,
        datei,
        datei
    ], { encoding: 'utf-8' });
    if (process.status !== 0) {
        console.log(process.stderr);
    }
}
export function rotierePdf(datei) {
    const process = childProcess.spawnSync('pdftk', [
        datei,
        'cat',
        '1-endeast',
        'output',
        '--sidecar',
        `${datei}_rotated.pdf`
    ]);
    if (process.status !== 0) {
        console.log(process.stderr);
    }
}
export function exportiereTxtAusPdf(datei) {
    if (datei.includes('.pdf')) {
        console.log(datei);
        const txt = datei.replace('.pdf', '.txt');
        if (!fs.existsSync(txt)) {
            childProcess.spawnSync('pdftotext', [datei]);
        }
    }
}
export function löscheGeradeSeitenInPdf(datei) {
    childProcess.spawnSync('pdftk', [
        `A=${datei}`,
        'cat',
        'Aodd',
        'output',
        `${datei}_ungerade.pdf`
    ]);
}
//# sourceMappingURL=externe-befehle.js.map