import fs from 'fs';
import { compiler } from '.';
import { grammarAggregate, grammarAnalyzer, grammarLang } from './grammar';

const grammarCompiler = compiler({
	lexer: grammarAnalyzer,
	lang: grammarLang,
	// aggregate: grammarAggregate,
});

// eslint-disable-next-line no-console
console.dir(grammarCompiler(fs.readFileSync(0, 'utf-8')), { depth: null });
