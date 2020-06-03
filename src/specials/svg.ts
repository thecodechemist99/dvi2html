import { DviCommand, merge } from '../parser';
import { Machine } from '../machine';

class SVG extends DviCommand {
  svg : string;
  
  constructor(svg) {
    super({});
    this.svg = svg;
  }

  execute(machine : Machine) {
    machine.putSVG( this.svg );
  }
}

class BeginSVG extends DviCommand {
  constructor() {
    super({});
  }

  execute(machine : Machine) {
    machine.beginSVG();
  }
}

class EndSVG extends DviCommand {
  constructor() {
    super({});
  }

  execute(machine : Machine) {
    machine.endSVG();
  }
}

function* specialsToSVG(commands) {
  for (const command of commands) {
    if (! command.special) {
      yield command;
    } else {
      if (! command.x.startsWith('dvisvgm:')) {
	yield command;
      } else {
        if (command.x.startsWith('dvisvgm:raw')) {
	  let svg = command.x.replace(/^dvisvgm:raw /, '');
	  yield new SVG(svg);
        } else if (command.x == 'dvisvgm:beginpicture') {
          yield new BeginSVG();
        } else if (command.x == 'dvisvgm:endpicture') {
          yield new EndSVG();
        } else {
          yield command;
        }
      }
    }
  }
}
    
export default function (commands) {
  return merge( specialsToSVG(commands),
		command => command.svg,
		function*(commands) {
		  let svg = commands
		    .map( command => command.svg )
		    .join('')
                    .replace(/{\?nl}/g, "\n");
		  yield new SVG( svg );
		});
}
