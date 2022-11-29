import {
	Lexema, lexicalAnalyzer, nterm, term,
} from '.';

enum CalculatorType {
	PLUS = '+',
	MUL = '*',
	N = 'n',
	OPEN = '(',
	CLOSE = ')',
}

type CalculatorLexems =
	| Lexema<'+', string>
	| Lexema<'*', string>
	| Lexema<'n', number>
	| Lexema<'(', string>
	| Lexema<')', string>
	;

export const calculatorAnalyzer = lexicalAnalyzer<CalculatorLexems>({
	reg: /^(?:(?<plus>\+)|(?<n>\d+)|(?<mul>\*)|(?<open>\()|(?<close>\))|(?<space>\s+)|(?<error>.))/,
	rules: {
		plus: (value) => ({ value, type: CalculatorType.PLUS }),
		mul: (value) => ({ value, type: CalculatorType.MUL }),
		n: (value) => ({ value: +value, type: CalculatorType.N }),
		open: (value) => ({ value, type: CalculatorType.OPEN }),
		close: (value) => ({ value, type: CalculatorType.CLOSE }),
	},
});

export const calculatorLang = {
	axiom: 'E',
	nterms: {
		F: [
			[term('n')],
			[term('('), nterm('E'), term(')')],
		],
		T: [[nterm('F'), nterm('T1')]],
		T1: [
			[term('*'), nterm('F'), nterm('T1')],
			[],
		],
		E: [[nterm('T'), nterm('E1')]],
		E1: [
			[term('+'), nterm('T'), nterm('E1')],
			[],
		],
	},
};

export const calculatorAggregate = {
	F: (...args: [{ value: number }] | [any, number, any]) => (
		args.length === 3 ? args[1] : args[0].value
	),
	T: (a: number, b: number) => a * b,
	T1: (...args: [] | [any, number, number]) => (args.length === 0 ? 1 : args[1] * args[2]),
	E: (a: number, b: number) => a + b,
	E1: (...args: [] | [any, number, number]) => (args.length === 0 ? 0 : args[1] + args[2]),
};
