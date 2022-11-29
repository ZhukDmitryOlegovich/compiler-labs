/* eslint-disable no-console */
import fs from 'fs';
import { compiler } from '.';
import { calculatorAggregate, calculatorAnalyzer } from './calc';
import { grammarAggregate, grammarAnalyzer, grammarLang } from './grammar';

const lang = grammarLang;
for (let i = 0; i < 10; i++) {
	const { res } = compiler({
		lexer: grammarAnalyzer,
		lang,
		aggregate: grammarAggregate,
	})(fs.readFileSync('grammar.ini', 'utf-8'));

	if (JSON.stringify(lang) !== JSON.stringify(res)) {
		console.error(`error: ${i}`);
		console.dir(lang);
		console.dir(res);
	} else {
		console.log(`ok: ${i}`);
	}
}

// console.dir(grammarCompiler(fs.readFileSync(0, 'utf-8')), { depth: null });

console.dir(compiler({
	lexer: calculatorAnalyzer,
	lang: compiler({
		lexer: grammarAnalyzer,
		lang: compiler({
			lexer: grammarAnalyzer,
			lang: grammarLang,
			aggregate: grammarAggregate,
		})(fs.readFileSync('grammar.ini', 'utf-8')).res,
		aggregate: grammarAggregate,
	})(fs.readFileSync('calc.ini', 'utf-8')).res,
	aggregate: calculatorAggregate,
})(fs.readFileSync('calc.test.ini', 'utf-8')), { depth: null });
