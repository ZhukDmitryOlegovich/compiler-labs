/* eslint-disable no-console, import/prefer-default-export */
import fs from 'fs';

enum TokenType {
	IDENT = 'ident',
	DIR = 'dir',
}

export const parseToken = (s: string) => ({
	* [Symbol.iterator](): Generator<{type: TokenType, coord: [number, number], value: string}> {
		const r = /(?<ident>^\p{L}[\p{L}0-9-]*)|(?<dir>^\p{Sc}\p{Lu}+)|(?<newline>^\n)|(?<space>^\s)|(?<err>^.)/u;

		for (let e = r.exec(s), line = 1, pos = 1; e?.groups; e = r.exec(s)) {
			if (e.groups.ident) {
				yield { type: TokenType.IDENT, coord: [line, pos], value: e.groups.ident };
			} else if (e.groups.dir) {
				yield { type: TokenType.DIR, coord: [line, pos], value: e.groups.dir };
			} else if (e.groups.newline) {
				line++;
				pos = 0;
				// yield {type: 'newline', coord: [line, pos], value: e.groups.newline}
			} else if (e.groups.space) {
				// yield {type: 'space', coord: [line, pos], value: e.groups.space}
			} else if (e.groups.err) {
				console.error('err: find trash symbol in', { token: e.groups.err });
				// yield {type: 'err', coord: [line, pos], value: e.groups.err}
			}

			s = s.slice(e.index + e[0].length);
			pos += e[0].length;
		}
	},
});

console.log([...parseToken(fs.readFileSync(process.argv[2], { encoding: 'utf8' }))]);
