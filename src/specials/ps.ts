import { DviCommand, merge } from '../parser';
import { Machine } from '../machine';
import PSInterpreter from './psinterpreter';

class PS extends DviCommand {
	ps: string;

	constructor(ps) {
		super({});
		this.ps = ps;
	}

	execute(machine: Machine) {
		let interpreter = new PSInterpreter(machine, this.ps);
		interpreter.interpret(machine);
	}

	toString(): string {
		return `PS: ${this.ps}`;
	}
}

async function* specialsPS(commands) {
	for await (const command of commands) {
		if (!command.special) {
			yield command;
		} else {
			if (!command.x.startsWith('ps: ')) {
				yield command;
			} else {
				let ps = command.x.replace(/^ps: /, '');
				yield new PS(ps);
			}
		}
	}
}

export default function (commands) {
	return merge(specialsPS(commands),
				 command => command.ps,
				 function*(commands) {
					 let ps = commands.map(command => command.ps).join(' ');
					 yield new PS(ps);
				 });
}
