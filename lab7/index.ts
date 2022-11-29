/* eslint-disable no-throw-literal */
export type Term = { type: 'term', value: string };
export type Nterm = { type: 'nterm', value: string };

export type Rule = (Term | Nterm)[]
export type Rules = Rule[]

export type Language = {
	axiom: string,
	nterms: Record<string, Rules>,
}

const join = <T>(a: Set<T>, b: Set<T> | T[]) => b.forEach((v) => a.add(v));

const EPSILON = Symbol('EPSILON');

const smartFirst = (
	first: Record<string, Set<string | typeof EPSILON>>,
) => {
	const F = (
		rule: Rule,
	): [string] | [typeof EPSILON] | Set<string | typeof EPSILON> => {
		if (rule.length === 0) return [EPSILON];
		if (rule[0].type === 'term') return [rule[0].value];
		if (!first[rule[0].value].has(EPSILON)) return first[rule[0].value];
		const copy = new Set(first[rule[0].value]);
		copy.delete(EPSILON);
		join(copy, F(rule.slice(1)));
		return copy;
	};
	return F;
};

const createFirst = (lang: Language): Record<string, Set<string | typeof EPSILON>> => {
	const allNterms = Object.keys(lang.nterms);
	const first: Record<string, Set<string | typeof EPSILON>> = Object.fromEntries(
		allNterms.map((nameNterm) => [nameNterm, new Set()]),
	);

	const F = smartFirst(first);

	let wasChange;
	do {
		wasChange = false;
		// eslint-disable-next-line no-loop-func
		allNterms.forEach((nameNterm) => lang.nterms[nameNterm]
			.forEach((rule) => F(rule).forEach((v) => {
				if (!first[nameNterm].has(v)) {
					wasChange = true;
					first[nameNterm].add(v);
				}
			})));
	} while (wasChange);

	// console.log('CREATE_FIRST');
	// console.dir(first, { depth: null });

	return first;
};

const EOF = Symbol('EOF');

const createFollow = (
	lang: Language,
	first = createFirst(lang),
): Record<string, Set<string | typeof EOF>> => {
	const allNterms = Object.keys(lang.nterms);
	const follow: Record<string, Set<string | typeof EOF>> = Object.fromEntries(
		allNterms.map((nameNterm) => [nameNterm, new Set()]),
	);

	follow[lang.axiom].add(EOF);

	const pairHasEpsilon: [string, string][] = [];

	const F = smartFirst(first);
	allNterms.forEach((nameNterm) => lang.nterms[nameNterm]
		.forEach((rule) => rule.forEach(({ type, value }, i) => {
			if (type === 'nterm') {
				const f = F(rule.slice(i + 1));
				let hasEpsilon = false;
				if (Array.isArray(f)) {
					if (f[0] !== EPSILON) join(follow[value], f);
					else hasEpsilon = true;
				} else {
					f.forEach((v) => {
						if (v !== EPSILON) follow[value].add(v);
						else hasEpsilon = true;
					});
				}
				if (hasEpsilon) {
					pairHasEpsilon.push([nameNterm, value]);
				}
			}
		})));

	let wasChange;
	do {
		wasChange = false;
		// eslint-disable-next-line no-loop-func
		pairHasEpsilon.forEach(([x, y]) => follow[x].forEach((v) => {
			if (!follow[y].has(v)) {
				wasChange = true;
				follow[y].add(v);
			}
		}));
	} while (wasChange);

	// console.log('CREATE_FOLLOW');
	// console.dir(follow, { depth: null });

	return follow;
};

const createFirstAndFollow = (lang: Language) => {
	const first = createFirst(lang);
	return { first, follow: createFollow(lang, first) };
};

// const getTerminals = (lang: Language) => new Set(
// 	Object.values(lang.nterms).flatMap((rules) => rules.flatMap(
// 		(rule) => rule.filter(({ type }) => type === 'term').map(({ value }) => value),
// 	)),
// );

export const createTable = (
	lang: Language, { first, follow } = createFirstAndFollow(lang),
) => {
	// const terms = getTerminals(lang);
	const F = smartFirst(first);
	const deta: Record<
		string,
		Record<
			string | typeof EOF,
			(Term | Nterm)[] | undefined
		> | undefined
	> = {};

	const addTable = (X: string, a: string | typeof EOF, u: Rule) => {
		// eslint-disable-next-line no-multi-assign
		const detaX = deta[X] ??= {} as NonNullable<typeof deta[string]>;
		if (detaX[a] !== undefined) {
			// eslint-disable-next-line no-throw-literal
			throw {
				message: 'not LL(1) grammar', X, a, value: [detaX[a], u],
			};
		}
		detaX[a] = u;
	};

	Object.entries(lang.nterms).forEach(([X, rules]) => rules.forEach(
		(u) => {
			const FIRSTu = F(u);
			let hasEpsilon = false;
			FIRSTu.forEach((a) => {
				if (a === EPSILON) {
					hasEpsilon = true;
				} else {
					addTable(X, a, u);
				}
			});
			if (hasEpsilon) {
				follow[X].forEach((b) => addTable(X, b, u));
			}
		},
	));

	// console.log('CREATE_TABLE');
	// console.dir(deta, { depth: null });

	return deta;
};

// console.dir(createTable(defLang), { depth: null });

type Position = { line: number, pos: number, abs: number };
export type Lexema<K, V> = { type: K, value: V };
type SmartLexems<L extends { type: string }> = L & { from: Position, to: Position };
type InputLexicalAnalyzer<L> = {
	reg: RegExp,
	rules: Record<string, undefined | ((_: string) => L | null)>,
	def?: (_: string) => L | null,
};

export const lexicalAnalyzer = <L extends { type: string }>({
	reg,
	rules,
	def = () => null,
}: InputLexicalAnalyzer<L>) => (s: string) => ({
		* [Symbol.iterator](): Generator<SmartLexems<L>> {
			let fromLine = 1;
			let fromPos = 1;
			let fromAbs = 0;
			let toLine = 1;
			let toPos = 1;
			let toAbs = 0;

			const buildToken = (l: L): SmartLexems<L> => ({
				...l,
				from: { line: fromLine, pos: fromPos, abs: fromAbs },
				to: { line: toLine, pos: toPos, abs: toAbs },
			});

			for (let e = reg.exec(s); e?.groups; e = reg.exec(s)) {
				const groups = Object.entries(e.groups).filter(([, value]) => value);
				if (groups.length !== 1 || e[0].length === 0 || e.groups.error) {
					throw {
						message: 'match not one group or value zero or error',
						groups,
						from: { line: fromLine, pos: fromPos, abs: fromAbs },
						to: { line: toLine, pos: toPos, abs: toAbs },
					};
				}

				fromLine = toLine;
				fromPos = toPos;
				fromAbs = toAbs;

				s = s.slice(e.index + e[0].length);
				toAbs += e[0].length;
				const split = e[0].split('\n');
				if (split.length === 1) {
					toPos += e[0].length;
				} else {
					toLine += split.length - 1;
					toPos = split[split.length - 1].length + 1;
				}

				const [[key, value]] = groups;
				const res = rules[key]?.(value) ?? def(value);
				if (res !== null) {
					yield buildToken(res);
				}
			}
		},
	});

class Wrapper<L extends { type: string }> {
	// eslint-disable-next-line class-methods-use-this
	lexicalAnalyzer(e: InputLexicalAnalyzer<L>) {
		return lexicalAnalyzer<L>(e);
	}
}

export const compiler = <L extends { type: string }>({
	// eslint-disable-next-line no-console
	lexer, table, aggregate = {}, axiom = 'E',
	print = (s) => console.log(s.replace(/^/gm, '> ')),
}: {
	lexer: ReturnType<Wrapper<L>['lexicalAnalyzer']>,
	table: ReturnType<typeof createTable>,
	axiom: string,
	aggregate?: Record<string, ((...args: any[]) => any) | undefined>,
	print?: (s: string) => void,
}) => (s: string): { ok: true, res: any } | { ok: false, res: undefined } => {
		let lexems: SmartLexems<L>[];
		try {
			lexems = [...lexer(s)];
		} catch ({
			message, groups, from, to,
		}) {
			print(`Lexer Error: ${message}}`);
			print(`             groups: ${JSON.stringify(groups)}`);
			print(`             from: ${JSON.stringify(from)}`);
			print(`             to: ${JSON.stringify(to)}`);
			return { ok: false, res: undefined };
		}

		let indexLexem = 0;
		const calc = (nterm: string): any => {
			const currentLexem = lexems.at(indexLexem);
			const currentLexemType = currentLexem ? currentLexem.type : EOF;
			const detaXA = table[nterm]?.[currentLexemType];
			// console.dir({
			// 	nterm,
			// 	currentLexem,
			// 	currentLexemType,
			// 	detaXA,
			// });

			if (detaXA === undefined) {
				throw {
					message: 'no transition between nterm & term',
					nterm,
					term: currentLexem,
				};
			}

			const res = detaXA.map((v) => {
				if (v.type === 'term') {
					const now = lexems.at(indexLexem);
					if (v.value !== now?.type) {
						throw {
							message: 'unexpected term',
							nterm,
							term: [v.value, now],
						};
					}
					indexLexem++;
					return now;
				}
				return calc(v.value);
			});

			const aggreg = aggregate[nterm];
			// console.log(res);
			if (aggreg) {
				return aggreg(...res);
			}
			// @ts-ignore
			res.nterm = nterm;
			return res;
		};

		let res;
		try {
			res = calc(axiom);
		} catch ({ message, nterm, currentLexem }) {
			print(`Calc Error: ${message}`);
			print(`            nterm: ${JSON.stringify(nterm)}`);
			print(`            term: ${JSON.stringify(currentLexem)}`);
			return { ok: false, res: undefined };
		}

		return { ok: true, res };
	};

export const term = (value: string): Term => ({ type: 'term', value });
export const nterm = (value: string): Nterm => ({ type: 'nterm', value });

export const saveTable = (t: ReturnType<typeof createTable>) => {
	Object.values(t).forEach((a) => {
		if (a && a[EOF]) {
			a[''] = a[EOF];
			delete a[EOF];
		}
	});
	return JSON.stringify(t);
};

export const loadTable = (dupl: any) => {
	const t: ReturnType<typeof createTable> = JSON.parse(dupl);
	Object.values(t).forEach((a) => {
		if (a && a['']) {
			a[EOF] = a[''];
			delete a[''];
		}
	});
	return t;
};
