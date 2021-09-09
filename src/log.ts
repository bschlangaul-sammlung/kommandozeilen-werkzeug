/**
 * Similarly, npm logging levels are prioritized from 0 to 6 (highest to lowest):
 * ```js
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   http: 3,
 *   verbose: 4,
 *   debug: 5,
 *   silly: 6
 * }
 * ```
 */

import winston from 'winston'

const console = new winston.transports.Console({
  format: winston.format.simple(),
  level: 'info'
})

export const logger = winston.createLogger({
  level: 'info',
  transports: [console]
})

export function setzeLogEbene (
  ebene: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'
): void {
  console.level = ebene
}
