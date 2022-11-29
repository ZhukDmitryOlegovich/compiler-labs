/* eslint-disable no-console */
import fs from 'fs';
import { compiler, createTable, saveTable } from '.';
import { grammarAggregate, grammarAnalyzer, grammarLang } from './grammar';

// console.log(process.argv);

const read3 = fs.readFileSync(process.argv[2], 'utf-8');
// console.dir({ read0, read3 });

const { res } = compiler({
	lexer: grammarAnalyzer,
	table: createTable(grammarLang),
	axiom: grammarLang.axiom,
	aggregate: grammarAggregate,
})(read3);

console.log(saveTable(res));
