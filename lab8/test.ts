import fs from 'fs';
import { getFirst } from './first';
import { buildGrammar, calcFirst, grammarAnalyzer } from './grammar';

const a = [...grammarAnalyzer(fs.readFileSync(0, 'utf8'))];
// console.log(a.map(({ value, type }) => [value, type]));
const b = buildGrammar(a).res as Record<string, getFirst>;
console.dir(b, { depth: null });
console.log(Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.toString()])));
console.log(calcFirst(b));
