import {
	createTable,
	Language, lexicalAnalyzer, nterm, Rule, Rules, term,
} from '.';

enum TokenType {
	EQ = '=',
	END = '.',
	OR = '|',
	AXIOM = 'axiom',
	NTERM = 'nterm',
	TERM = 'term',
}

type Lexema<K, V> = { type: K, value: V };

type Lexems =
	| Lexema<TokenType.EQ, string>
	| Lexema<TokenType.END, string>
	| Lexema<TokenType.OR, string>
	| Lexema<TokenType.AXIOM, string>
	| Lexema<TokenType.NTERM, string>
	| Lexema<TokenType.TERM, string>
	;

export const grammarAnalyzer = lexicalAnalyzer<Lexems>({
	reg: /^(?:(?<comment>;.*)|(?<space>\s+)|(?<eq>=)|(?<end>\.)|(?<or>\|)|\(axiom[ \t]+(?<axiom>[a-zA-Z][a-zA-Z0-9]*)\)|\((?<nterm>[a-zA-Z][a-zA-Z0-9]*)\)|(?<term>\\.|[^\s()|.=]+)|(?<error>.))/,
	rules: {
		eq: (value) => ({ value, type: TokenType.EQ }),
		end: (value) => ({ value, type: TokenType.END }),
		or: (value) => ({ value, type: TokenType.OR }),
		axiom: (value) => ({ value, type: TokenType.AXIOM }),
		nterm: (value) => ({ value, type: TokenType.NTERM }),
		term: (value) => ({ value: value.replace(/^\\/, ''), type: TokenType.TERM }),
	},
});

export const grammarLang = {
	axiom: 'Init',
	nterms: {
		Init: [[nterm('Nterm'), nterm('Nterms')]],
		Nterms: [
			[nterm('Nterm'), nterm('Nterms')],
			[],
		],
		Nterm: [
			[term('nterm'), term('='), nterm('Rule'), nterm('Rules')],
			[term('axiom'), term('='), nterm('Rule'), nterm('Rules')],
		],
		Rules: [
			[term('|'), nterm('Rule'), nterm('Rules')],
			[term('.')],
		],
		Rule: [
			[term('nterm'), nterm('Rule')],
			[term('term'), nterm('Rule')],
			[],
		],
	},
};

type Nterm = {
	isAxiom: boolean;
	name: string;
	rules: Rule[];
};

export const grammarAggregate = {
	Init: (...args: [Nterm, Nterm[]]) => {
		const nterms = [args[0], ...args[1]];
		const axioms = nterms.filter(({ isAxiom }) => isAxiom);

		if (axioms.length !== 1) {
			throw new Error(`not one axioms: found [${axioms.map(({ name }) => name).join(', ')}]`);
		}

		return createTable({
			axiom: axioms[0].name,
			nterms: Object.fromEntries(nterms.map(({ name, rules }) => [name, rules])),
		});
	},
	Nterms: (...args: [] | [Nterm, Nterm[]]) => (args.length === 0 ? [] : [args[0], ...args[1]]),
	Nterm: (...args: [{type: 'axiom' | 'nterm', value: string}, any, Rule, Rules]): Nterm => {
		const isAxiom = args[0].type === 'axiom';
		return { isAxiom, name: args[0].value, rules: [args[2], ...args[3]] };
	},
	Rules: (...args: [any] | [any, Rule, Rules]) => (
		args.length === 1 ? [] : [args[1], ...args[2]]
	),
	Rule: (...args: [] | [{ value: string, type: 'nterm' | 'term' }, Rule]) => {
		if (args.length === 0) return [];
		return [(args[0].type === 'nterm' ? nterm : term)(args[0].value), ...args[1]];
	},
};
