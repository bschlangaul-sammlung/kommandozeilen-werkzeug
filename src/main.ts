#! /usr/bin/env -S node --experimental-specifier-resolution=node
// https://unix.stackexchange.com/a/657774

import programm from './kommando-zeile'

programm.parse(process.argv)
