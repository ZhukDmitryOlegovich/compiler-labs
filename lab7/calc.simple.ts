/* eslint-disable no-console, import/prefer-default-export */
import fs from 'fs';
import { compiler } from '.';
import { calculatorAggregate, calculatorAnalyzer, calculatorLang } from './calc';

const calculatorCompiler = compiler({
	lexer: calculatorAnalyzer,
	lang: calculatorLang,
	aggregate: calculatorAggregate,
});

console.dir(calculatorCompiler(fs.readFileSync(0, 'utf-8')), { depth: null });
