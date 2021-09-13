/**
 * ```js
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 * }
 * ```
 */

import winston, { format } from 'winston'

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    verbose: 'cyan',
    debug: 'magenta'
  }
}

/**
 * Die Log-Ebenen.
 */
type LogEbene = 'error' | 'warn' | 'info' | 'verbose' | 'debug'

const console = new winston.transports.Console({
  format: format.combine(format.colorize(), format.splat(), format.simple()),
  level: 'error'
})

winston.addColors(customLevels.colors)

const logger = winston.createLogger({
  level: 'error',
  transports: [console],
  levels: customLevels.levels
})

/**
 * ```js
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 * }
 * ```
 */
export function log (level: LogEbene, message: string, ...meta: any[]): void {
  logger.log(level, message, ...meta)
}

export function setzeLogEbene (ebene: LogEbene): void {
  console.level = ebene
}

export function gibLogEbene (): string | undefined {
  return console.level
}
