import childProcess from 'child_process';
import fs from 'fs';
import chalk from 'chalk';
import { leseDatei, zeigeFehler } from '../helfer';
class TexDateiMitSql {
    constructor(pfad) {
        this.anzahlAnfragen = 0;
        this.pfad = pfad;
        this.inhalt = leseDatei(pfad);
        this.datenbankName = this.findeErzeugungsCode();
    }
    gibTemporärenPfad(bezeichner) {
        return `${this.pfad}_${bezeichner}_tmp.sql`;
    }
    gibAnfrageBezeichner(anfrageNummer) {
        const anfrageNummerFormatiert = anfrageNummer.toString().padStart(3, '0');
        return `anfrage${anfrageNummerFormatiert}`;
    }
    gibTemporärenAnfragenPfad(anfrageNummer) {
        return this.gibTemporärenPfad(this.gibAnfrageBezeichner(anfrageNummer));
    }
    gibTemporärenErzeugungsPfad() {
        return this.gibTemporärenPfad('erzeugung');
    }
    gibTemporärenLöschungsPfad() {
        return this.gibTemporärenPfad('loeschung');
    }
    schreibeTemporäreSqlDatei(bezeichner, inhalt) {
        fs.writeFileSync(`${this.pfad}_${bezeichner}_tmp.sql`, inhalt);
    }
    führePostgresqlAus(datei, redselig = true) {
        const pygmentize = childProcess.spawnSync('pygmentize', ['-l', 'sql', datei], { encoding: 'utf-8' });
        if (redselig)
            console.log(pygmentize.stdout);
        const prozess = childProcess.spawnSync('sudo', [
            '-u',
            'postgres',
            'psql',
            '--quiet',
            '-f',
            datei,
            '-v',
            'ON_ERROR_STOP=1'
        ], {
            encoding: 'utf-8',
            env: { PGPASSWORD: 'postgres' },
            shell: '/usr/bin/zsh'
        });
        if (prozess.status !== 0) {
            console.log(chalk.red(prozess.stderr));
            console.log(chalk.red(prozess.stdout));
            // zeigeFehler('Postgresql wurde mit einem Fehler beendet.')
        }
        else {
            if (redselig)
                console.log(prozess.stdout);
        }
    }
    erzeugeDatenbank() {
        this.führePostgresqlAus(this.gibTemporärenErzeugungsPfad(), false);
    }
    führeAnfrageAus(anfragenNummer) {
        this.erzeugeDatenbank();
        console.log(chalk.red(`Anfrage Nummer ${anfragenNummer}:\n`));
        this.führePostgresqlAus(this.gibTemporärenAnfragenPfad(anfragenNummer));
    }
    führeAlleAnfragenAus() {
        for (let index = 1; index <= this.anzahlAnfragen; index++) {
            this.führeAnfrageAus(index);
        }
    }
    erzeugeCodeDatenbankErstellung(datenbankName) {
        return (`DROP DATABASE IF EXISTS ${datenbankName};\n` +
            `CREATE DATABASE ${datenbankName};\n` +
            `\\c ${datenbankName}\n`); // mysql: USE name;
    }
    findeErzeugungsCode() {
        const regExp = /% ?Datenbankname: ?(\w+).*?\\begin\{minted\}\{sql\}(.*?)\\end\{minted\}/gs;
        const datenbank = regExp.exec(this.inhalt);
        if (datenbank == null) {
            zeigeFehler('Keine Erzeugungs-Code gefunden: % Datenbankname: Name\\begin{minted}{sql}…\\end{minted}');
        }
        // postgresql \c funktioniert nur mit klein geschriebenen Datenbank-Namen
        const datenbankName = datenbank[1].toLowerCase();
        const erzeugungsCode = datenbank[2];
        this.inhalt = this.inhalt.replace(regExp, '');
        this.schreibeTemporäreSqlDatei('erzeugung', this.erzeugeCodeDatenbankErstellung(datenbankName) + erzeugungsCode);
        return datenbankName;
    }
    erzeugeLöschungsCode() {
        this.schreibeTemporäreSqlDatei('loeschung', `DROP DATABASE IF EXISTS ${this.datenbankName};\n`);
    }
    findeAnfragen() {
        const re = /\\begin\{minted\}\{sql\}(.*?)\\end\{minted\}/gs;
        let übereinstimmung;
        let zähler = 0;
        do {
            übereinstimmung = re.exec(this.inhalt);
            if (übereinstimmung != null) {
                zähler++;
                this.schreibeTemporäreSqlDatei(this.gibAnfrageBezeichner(zähler), `\\c ${this.datenbankName} \n` + übereinstimmung[1]);
            }
        } while (übereinstimmung != null);
        this.anzahlAnfragen = zähler;
    }
    aufräumen() {
        this.erzeugeLöschungsCode();
        this.führePostgresqlAus(this.gibTemporärenLöschungsPfad());
        fs.unlinkSync(this.gibTemporärenErzeugungsPfad());
        for (let index = 1; index <= this.anzahlAnfragen; index++) {
            fs.unlinkSync(this.gibTemporärenAnfragenPfad(index));
        }
        fs.unlinkSync(this.gibTemporärenLöschungsPfad());
    }
}
export default function (pfad, cmdObj) {
    const datei = new TexDateiMitSql(pfad);
    datei.findeAnfragen();
    if (cmdObj.anfrage != null) {
        datei.führeAnfrageAus(parseInt(cmdObj.anfrage));
    }
    else {
        datei.führeAlleAnfragenAus();
    }
    if (cmdObj.nichtLoeschen == null) {
        datei.aufräumen();
    }
}
//# sourceMappingURL=sql.js.map