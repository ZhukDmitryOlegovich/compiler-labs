import fs from 'fs';
import { compiler, loadTable, saveTable } from '.';
import { grammarAggregate, grammarAnalyzer } from './grammar';

const readt = fs.readFileSync(process.argv[2], 'utf-8');
const readf = fs.readFileSync(process.argv[3], 'utf-8');

console.log(saveTable(compiler({
	lexer: grammarAnalyzer,
	table: loadTable(readt),
	axiom: 'Init',
	aggregate: grammarAggregate,
})(readf).res));
