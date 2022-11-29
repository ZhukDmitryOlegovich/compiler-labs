/* eslint-disable consistent-return, no-continue, no-labels, default-case, max-len */
import {
	Language, lexicalAnalyzer, Nterm, nterm, Term, term,
} from '.';
import {
	EpsilonF, getFirst, NtermF, RulesAndF, RulesOrF, RulesPF, RulesQF, RulesZF, TermF,
} from './first';

enum TokenType {
	EQ = '=',
	END = '.',
	OR = '|',
	Q = '?',
	P = '+',
	Z = '*',
	SO = '[',
	SC = ']',
	NTERM = 'nterm',
	TERM = 'term',
}

type Lexema<K, V> = { type: K, value: V };

type Lexems = Lexema<TokenType, string>;

export const grammarAnalyzer = lexicalAnalyzer<Lexems>({
	reg: /^(?:(?<comment>;.*)|(?<space>\s+)|(?<eq>=)|(?<end>\.)|(?<or>\|)|(?<q>\?)|(?<p>\+)|(?<z>\*)|(?<so>\[)|(?<sc>\])|\((?<nterm>[a-zA-Z][a-zA-Z0-9]*)\)|(?<term>\\.|[^\s()|.=[\]]+)|(?<error>.))/,
	rules: {
		eq: (value) => ({ value, type: TokenType.EQ }),
		end: (value) => ({ value, type: TokenType.END }),
		or: (value) => ({ value, type: TokenType.OR }),
		q: (value) => ({ value, type: TokenType.Q }),
		p: (value) => ({ value, type: TokenType.P }),
		z: (value) => ({ value, type: TokenType.Z }),
		so: (value) => ({ value, type: TokenType.SO }),
		sc: (value) => ({ value, type: TokenType.SC }),
		nterm: (value) => ({ value, type: TokenType.NTERM }),
		term: (value) => ({ value: value.replace(/^\\/, ''), type: TokenType.TERM }),
	},
});

export const grammarLang: Language = {
	axiom: 'Init',
	nterms: {
		Init: [
			[nterm('Nterm'), nterm('Nterms')],
		],
		Nterms: [
			[nterm('Nterm'), nterm('Nterms')],
			[],
		],
		Nterm: [
			[term('nterm'), term('='), nterm('RulesOr'), term('.')],
		],
		RulesOr: [
			[nterm('RulesAnd'), nterm('RulesOrHelp')],
		],
		RulesOrHelp: [
			[term('|'), nterm('RulesAnd'), nterm('RulesOrHelp')],
			[],
		],
		RulesAnd: [
			[nterm('Expr'), nterm('Operator'), nterm('RulesAnd')],
			[],
		],
		Expr: [
			[term('term')],
			[term('nterm')],
			[term('['), nterm('RulesOr'), term(']')],
		],
		Operator: [
			[term('?')],
			[term('+')],
			[term('*')],
			[],
		],
	},
};

export const EPSILON = Symbol('EPSILON');

export const grammarAggregate = {
	// (Init) = (Nterm) (Nterms) .
	Init: (...args: [[string, getFirst], [string, getFirst][]]) => Object.fromEntries([args[0], ...args[1]]),

	// (Nterms) = (Nterm) (Nterms) | .
	Nterms: (...args: [] | [[string, getFirst], [string, getFirst][]]) => (args.length === 0 ? [] : [args[0], ...args[1]]),

	// (Nterm) = nterm \= (RulesOr) \. .
	Nterm: (...args: [Nterm, any, getFirst, any]): any => [args[0].value, args[2]],

	// (RulesOr) = (RulesAnd) (RulesOrHelp) .
	RulesOr: (...args: [getFirst, getFirst[]]) => args[1].reduce((a, b) => new RulesOrF(a, b), args[0]),

	// (RulesOrHelp) = \| (RulesAnd) (RulesOrHelp) | .
	RulesOrHelp: (...args: [] | [any, getFirst, getFirst[]]) => {
		if (args.length === 0) return [];
		return [args[1], ...args[2]];
	},

	// (RulesAnd) = (Expr) (Operator) (RulesAnd) | .
	RulesAnd: (...args: [] | [getFirst, '+' | '?' | '*' | null, getFirst]) => {
		if (args.length === 0) return new EpsilonF();
		let arg: getFirst;
		switch (args[1]) {
			case '*': arg = new RulesZF(args[0]); break;
			case '?': arg = new RulesQF(args[0]); break;
			case '+': arg = new RulesPF(args[0]); break;
			default: [arg] = args;
		}
		if (args[2] instanceof EpsilonF) return arg;
		return new RulesAndF(arg, args[2]);
	},

	// (Expr) = term | nterm | \[ (RulesOr) \] .
	Expr: (...args: [Nterm] | [Term] | [any, getFirst, any]) => {
		if (args.length === 3) return args[1];
		return (args[0].type === 'nterm' ? new NtermF(args[0]) : new TermF(args[0]));
	},

	// (Operator) = \? | \+ | \* | .
	Operator: (...args: [] | [{ value: string, type: '+' | '?' | '*' }]) => (args.length === 0 ? null : args[0].type),
};

export const buildGrammar = (lexems: Lexems[], I = 0, name = grammarLang.axiom, isMain = true): any => {
	a: for (const rules of grammarLang.nterms[name]) {
		let j = I;
		let err = null;
		const res = [];
		for (const rule of rules) {
			if (rule.type === 'term') {
				if (rule.value !== lexems[j]?.type) {
					// console.log('1', [rule.value, lexems[j]]);
					// console.log('x', name, j, res);
					if (res.length !== 0) {
						err = `find "${lexems[j]?.type}", but need "${rule.value}"`;
						break;
					}
					continue a;
				}
				res.push(lexems[j]);
				j++;
			} else {
				const calc = buildGrammar(lexems, j, rule.value, false);
				if (!calc.ok) {
					// console.log('2', calc);
					// console.log('x', name, j, res);
					if (res.length !== 0) {
						err = `fail in calc ${rule.value}`;
						break;
					}
					continue a;
				}
				res.push(calc.res);
				j = calc.j;
			}
		}

		if (isMain && lexems[j]) {
			err = `not finish parse in ${JSON.stringify(lexems[j])}`;
		}

		if (err) {
			if (res.length !== 0) console.dir(res[0], { depth: null });
			console.dir(lexems[j], { depth: null });
			throw new Error(`${name}: ${err}`);
		}

		// console.log('O', name, j, res);
		return { ok: true, res: (grammarAggregate as any)[name](...res), j };
	}
	// console.log('X', name, i);
	return { ok: false };
};

export const calcFirst = (lang: Record<string, getFirst>) => {
	const values = Object.values(lang);
	for (let before = NaN, after = 0; before !== after;) {
		before = after;
		after = 0;
		values.forEach((f) => { after += f.getFirst(lang).size; });
	}
	return Object.fromEntries(Object.entries(lang).map(([k, v]) => [k, v.getFirst(lang)]));
};
