import { DviCommand, merge } from '../parser';
import { Machine } from '../machine';

class HTML extends DviCommand {
  html : string;
  
  constructor(html) {
    super({});
    this.html = html;
  }

  execute(machine : Machine) {
    machine.putHTML( this.html );
  }
}

async function* specialsToHTML(commands) {
  for await (const command of commands) {
    if (! command.special) {
      yield command;
    } else {
      if (! command.x.startsWith('html ')) {
	yield command;
      } else {
	let html = command.x.replace(/^html /, '');
	yield new HTML(html);
      }
    }
  }
}
    
export default function (commands) {
  return merge( specialsToHTML(commands),
		command => command.html,
		function*(commands) {
		  let html = commands
		    .map( command => command.html )
		    .join('');
		  yield new HTML( html );
		});
}
