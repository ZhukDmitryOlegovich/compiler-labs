import fs from 'fs';
import { compiler, loadTable } from '.';
import { calculatorAnalyzer, calculatorAggregate } from './calc';

const readt = fs.readFileSync(process.argv[2], 'utf-8');
const readf = fs.readFileSync(process.argv[3], 'utf-8');

console.log(compiler({
	lexer: calculatorAnalyzer,
	table: loadTable(readt),
	axiom: 'E',
	aggregate: calculatorAggregate,
})(readf).res);
