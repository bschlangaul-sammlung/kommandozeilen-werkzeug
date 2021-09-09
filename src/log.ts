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

const console = new winston.transports.Console({
  format: format.combine(format.colorize(), format.splat(), format.simple()),
  level: 'error'
})

winston.addColors(customLevels.colors)

export const logger = winston.createLogger({
  level: 'error',
  transports: [console],
  levels: customLevels.levels
})

export function setzeLogEbene (
  ebene: 'error' | 'warn' | 'info' | 'verbose' | 'debug'
): void {
  console.level = ebene
}
