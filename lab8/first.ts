/* eslint-disable class-methods-use-this, no-multi-assign, no-empty-function, no-useless-constructor */
import { Nterm, Term } from '.';
import { EPSILON } from './grammar';

export interface getFirst {
	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON>,
}

export class TermF implements getFirst {
	casheFirst: Set<string | typeof EPSILON>;

	constructor(public term: Term) { this.casheFirst = new Set([term.value]); }

	getFirst() { return this.casheFirst; }

	toString() { return `term(${this.term.value})`; }
}

export class NtermF implements getFirst {
	constructor(public nterm: Nterm) { }

	getFirst(global: Record<string, getFirst>) {
		// console.log(this.nterm);
		// console.log(Object.keys(global));
		if (!global[this.nterm.value]) {
			console.dir(this.nterm);
			throw new Error(`undefined nterm (${this.nterm.value}): ${JSON.stringify(this.nterm)}`);
		}
		return global[this.nterm.value].getFirst(global);
	}

	toString() { return `nterm(${this.nterm.value})`; }
}

export class RulesAndF implements getFirst {
	casheFirst: Set<string | typeof EPSILON> | false = false;

	isCalc = false;

	constructor(public u: getFirst, public v: getFirst) { }

	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON> {
		if (this.casheFirst && this.isCalc) return this.casheFirst;

		this.isCalc = true;
		const s = this.casheFirst ||= new Set();
		const sU = this.u.getFirst(global);

		let hasEpsilon = false;
		sU.forEach((v) => {
			if (v === EPSILON) hasEpsilon = true;
			else s.add(v);
		});

		if (hasEpsilon) {
			const sV = this.v.getFirst(global);
			sV.forEach((v) => s.add(v));
		}

		this.isCalc = false;
		return this.casheFirst;
	}

	toString() { return `${this.u} ${this.v}`; }
}

export class RulesOrF implements getFirst {
	casheFirst: Set<string | typeof EPSILON> | false = false;

	isCalc = false;

	constructor(public u: getFirst, public v: getFirst) { }

	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON> {
		if (this.casheFirst && this.isCalc) return this.casheFirst;

		this.isCalc = true;
		const s = this.casheFirst ||= new Set();
		const sU = this.u.getFirst(global);
		const sV = this.v.getFirst(global);

		sU.forEach((v) => s.add(v));
		sV.forEach((v) => s.add(v));

		this.isCalc = false;
		return this.casheFirst;
	}

	toString(needScobe = true) {
		// @ts-ignore
		return `${needScobe ? '[ ' : ''}${this.u.toString(false)} | ${this.v.toString(false)}${needScobe ? ' ]' : ''}`;
	}
}

export class RulesZF implements getFirst {
	casheFirst: Set<string | typeof EPSILON> | false = false;

	isCalc = false;

	constructor(public u: getFirst) { }

	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON> {
		if (this.casheFirst && this.isCalc) return this.casheFirst;

		this.isCalc = true;
		const s = this.casheFirst ||= new Set();
		const sU = this.u.getFirst(global);

		sU.forEach((v) => s.add(v));
		s.add(EPSILON);

		this.isCalc = false;
		return this.casheFirst;
	}

	toString() { return `{ ${this.u} }*`; }
}

export class RulesPF implements getFirst {
	constructor(public u: getFirst) { }

	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON> {
		return this.u.getFirst(global);
	}

	toString() { return `{ ${this.u} }+`; }
}

export class RulesQF implements getFirst {
	casheFirst: Set<string | typeof EPSILON> | false = false;

	isCalc = false;

	constructor(public u: getFirst) { }

	getFirst(global: Record<string, getFirst>): Set<string | typeof EPSILON> {
		if (this.casheFirst && this.isCalc) return this.casheFirst;

		this.isCalc = true;
		const s = this.casheFirst ||= new Set();
		const sU = this.u.getFirst(global);

		sU.forEach((v) => s.add(v));
		s.add(EPSILON);

		this.isCalc = false;
		return this.casheFirst;
	}

	toString() { return `{ ${this.u} }?`; }
}

export class EpsilonF implements getFirst {
	constructor() { }

	getFirst(): Set<string | typeof EPSILON> { return new Set([EPSILON]); }

	toString() { return 'eps'; }
}
