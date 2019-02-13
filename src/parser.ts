import * as fs from "fs";
import { execSync } from "child_process";
import * as TFMParser from "./tfm";

//  var path = execSync('kpsewhich ' + name + '.tfm').toString().split("\n")[0];

enum Opcode {
  set_char = 0,
  set1 = 128,
  set2 = 129,
  set3 = 130,
  set4 = 131,
  set_rule = 132,
  put_char = 133,
  put2 = 134,
  put3 = 135,
  put4 = 136,
  put_rule = 137,
  nop = 138,
  bop = 139,
  eop = 140,
  push = 141,
  pop = 142,
  right = 143,
  right2 = 144,
  right3 = 145,
  right4 = 146,
  w = 147,
  w1 = 148,
  w2 = 149,
  w3 = 150,
  w4 = 151,
  x = 152,
  x1 = 153,
  x2 = 154,
  x3 = 155,
  x4 = 156,
  down = 157,
  down2 = 158,
  down3 = 159,
  down4 = 160,
  y = 161,
  y1 = 162,
  y2 = 163,
  y3 = 164,
  y4 = 165,
  z = 166,
  z1 = 167,
  z2 = 168,
  z3 = 169,
  z4 = 170,
  fnt = 171,
  fnt1 = 235,
  fnt2 = 236,
  fnt3 = 237,
  fnt4 = 238,
  xxx = 239,
  xxx2 = 240,
  xxx3 = 241,
  xxx4 = 242,    
  fnt_def = 243,
  fnt_def2 = 244,
  fnt_def3 = 245,
  fnt_def4 = 246,    
  pre = 247,
  post = 248,
  post_post = 249
}

export class DviCommand {
  length: number;
  special: boolean;
  
  constructor(properties) {
    this.special = false;
    Object.assign(this, properties);
  }
}

// 0...127	set_char_i		typeset a character and move right
// 128	set1	c[1]	                typeset a character and move right
// 129	set2	c[2]
// 130	set3	c[3]
// 131	set4	c[4]

class SetChar extends DviCommand {
  opcode: Opcode.set_char;
  c: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.set_char;
  }
}

class SetText extends DviCommand {
  t: string;
  constructor(properties) {
    super(properties);
  }
}

// 132	set_rule	a[4], b[4]	typeset a rule and move right

class SetRule extends DviCommand {
  opcode: Opcode.set_rule;
  a: number;
  b: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.set_rule;
  }
}

// 133	put1	c[1]	typeset a character
// 134	put2	c[2]
// 135	put3	c[3]
// 136	put4	c[4]

class PutChar extends DviCommand {
  opcode: Opcode.put_char;
  c: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.put_char;
  }
}

// 137	put_rule	a[4], b[4]	typeset a rule

class PutRule extends DviCommand {
  opcode: Opcode.put_rule;
  a: number;
  b: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.put_rule;
  }
}

// 138	nop		no operation

class Nop extends DviCommand {
  opcode: Opcode.nop;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.nop;
  }  
}

// 139	bop	c_0[4]..c_9[4], p[4]	beginning of page

class Bop extends DviCommand {
  opcode: Opcode.bop;
  c_0: number;
  c_1: number;
  c_2: number;
  c_3: number;
  c_4: number;
  c_5: number;
  c_6: number;
  c_7: number;
  c_8: number;
  c_9: number;  
  p: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.bop;
  }  
}

// 140	eop		ending of page

class Eop extends DviCommand {
  opcode: Opcode.eop;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.eop;
  }  
}

// 141	push		save the current positions

class Push extends DviCommand {
  opcode: Opcode.push;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.push;
  }  
}

// 142	pop		restore previous positions

class Pop extends DviCommand {
  opcode: Opcode.pop;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.pop;
  }  
}

// 143	right1	b[1]	move right
// 144	right2	b[2]
// 145	right3	b[3]
// 146	right4	b[4]

class MoveRight extends DviCommand {
  opcode: Opcode.right;
  b: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.right;
  }  
}

// 147	w0		move right by w
// 148	w1	b[1]	move right and set w
// 149	w2	b[2]
// 150	w3	b[3]
// 151	w4	b[4]

class MoveW extends DviCommand {
  opcode: Opcode.w;
  b: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.w;
  }  
}

// 152	x0		move right by x
// 153	x1	b[1]	move right and set x
// 154	x2	b[2]
// 155	x3	b[3]
// 156	x4	b[4]

class MoveX extends DviCommand {
  opcode: Opcode.x;
  b: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.x;
  }  
}

// 157	down1	a[1]	move down
// 158	down2	a[2]
// 159	down3	a[3]
// 160	down4	a[4]

class MoveDown extends DviCommand {
  opcode: Opcode.down;
  a: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.down;
  }  
}

// 161	y0		move down by y
// 162	y1	a[1]	move down and set y
// 163	y2	a[2]
// 164	y3	a[3]
// 165	y4	a[4]

class MoveY extends DviCommand {
  opcode: Opcode.y;
  a: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.y;
  }  
}

// 166	z0		move down by z
// 167	z1	a[1]	move down and set z
// 168	z2	a[2]
// 169	z3	a[3]
// 170	z4	a[4]

class MoveZ extends DviCommand {
  opcode: Opcode.z;
  a: number;
    constructor(properties) {
    super(properties);
    this.opcode = Opcode.z;
  }  
}

// 171...234	fnt_num_i		set current font to i
// 235	fnt1	k[1]	set current font
// 236	fnt2	k[2]
// 237	fnt3	k[3]
// 238	fnt4	k[4]

class Font extends DviCommand {
  opcode: Opcode.fnt;
  k: number;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.fnt;
  }  
}

// 239	xxx1	k[1], x[k]	extension to DVI primitives
// 240	xxx2	k[2], x[k]
// 241	xxx3	k[3], x[k]
// 242	xxx4	k[4], x[k]

class Special extends DviCommand {
  opcode: Opcode.xxx;
  x: string;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.xxx;
    this.special = true;
  }  
}


// 243	fnt_def1	k[1], c[4], s[4], d[4], 
// a[1], l[1], n[a+l]	define the meaning of a font number
// 244	fnt_def2	k[2], c[4], s[4], d[4], 
// a[1], l[1], n[a+l]
// 245	fnt_def3	k[3], c[4], s[4], d[4], 
// a[1], l[1], n[a+l]
// 246	fnt_def4	k[4], c[4], s[4], d[4], 
// a[1], l[1], n[a+l]

class FontDefinition extends DviCommand {
  opcode: Opcode.fnt_def;
  k: number;
  c: number;
  s: number;
  d: number;
  a: number;
  l: number;
  n: string;
    constructor(properties) {
    super(properties);
    this.opcode = Opcode.fnt_def;
  }  
}

// 247	pre	i[1], num[4], den[4], mag[4],  k[1], x[k]	preamble

class Preamble extends DviCommand {
  opcode: Opcode.pre;
  i: number;
  num: number;
  den: number;
  mag: number;
  x: string;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.pre;
  }  
}

// 248	post	p[4], num[4], den[4], mag[4], l[4], u[4], s[2], t[2]
// < font definitions >	postamble beginning

class Post extends DviCommand {
  opcode: Opcode.post;
    constructor(properties) {
    super(properties);
    this.opcode = Opcode.post;
  }  
}

// 249	post_post	q[4], i[1]; 223's	postamble ending

class PostPost extends DviCommand {
  opcode: Opcode.post_post;
  constructor(properties) {
    super(properties);
    this.opcode = Opcode.post_post;
  }  
}

// 250...255	undefined	

// cat src/parser.ts | grep interface | sed 's/interface //g' | tr -d ' {' | tr '\n' '|' | sed 's/|/ | /g' | xsel -b

type Command =
  SetChar | SetRule | PutChar | PutRule | Nop | Bop | Eop | Push | Pop |
  MoveRight | MoveW | MoveX | MoveDown | MoveY | MoveZ | Font | Special |
  FontDefinition | Preamble | Post | PostPost;

function parseCommand( opcode : Opcode, buffer : Buffer ) : Command | void {

  if ((opcode >= Opcode.set_char) && (opcode < Opcode.set1)) {
    return new SetChar({c : opcode, length: 1});
  }

  if ((opcode >= Opcode.fnt) && (opcode < Opcode.fnt1))
    return new Font({ k : opcode - 171, length: 1 });

  // Technically these are undefined opcodes, but we'll pretend they are NOPs
  if ((opcode >= 250) && (opcode <= 255)) {
    throw 'Undefined opcode';
    return new Nop({ length: 1 });
  }
  
  switch(opcode) {
    case Opcode.set1:
    case Opcode.set2:
    case Opcode.set3:
    case Opcode.set4:
      if (buffer.length < opcode - Opcode.set1 + 1) return undefined;
      return new SetChar({
	c : buffer.readIntBE(0, opcode - Opcode.set1 + 1),
	length : opcode - Opcode.set1 + 1 + 1
      });

    case Opcode.set_rule:
      if (buffer.length < 8) return undefined;
      return new SetRule({
	a: buffer.readIntBE(0,4),
	b: buffer.readIntBE(4,4),
	length: 9
      });
      
    case Opcode.put_char:
    case Opcode.put2:
    case Opcode.put3:
    case Opcode.put4:
      if (buffer.length < opcode - Opcode.put_char + 1) return undefined;
      return new PutChar({
	c : buffer.readIntBE(0, opcode - Opcode.put_char + 1),
	length : opcode - Opcode.put_char + 1 + 1
      });
      
    case Opcode.put_rule:
      if (buffer.length < 8) return undefined;      
      return new PutRule({
	a: buffer.readIntBE(0,4),
	b: buffer.readIntBE(4,4),
	length: 9
      });
      
    case Opcode.nop:
      return new Nop({ length: 1 });
      
    case Opcode.bop:
      if (buffer.length < 44) return undefined;
      return new Bop({
	c_0 : buffer.readIntBE(0, 4),
	c_1 : buffer.readIntBE(4, 4),
	c_2 : buffer.readIntBE(8, 4),
	c_3 : buffer.readIntBE(12, 4),
	c_4 : buffer.readIntBE(16, 4),
	c_5 : buffer.readIntBE(20, 4),
	c_6 : buffer.readIntBE(24, 4),
	c_7 : buffer.readIntBE(28, 4),
	c_8 : buffer.readIntBE(32, 4),
	c_9 : buffer.readIntBE(36, 4),
	p   : buffer.readIntBE(40, 4),
	length : 45
      });

    case Opcode.eop:
      return new Eop({ length: 1 });

    case Opcode.push:
      return new Push({ length: 1 });

    case Opcode.pop:
      return new Pop({ length: 1 });

    case Opcode.right:
    case Opcode.right2:
    case Opcode.right3:
    case Opcode.right4:      
      if (buffer.length < opcode - Opcode.right + 1) return undefined;
      return new MoveRight({
	b : buffer.readIntBE(0, opcode - Opcode.right + 1),
	length : opcode - Opcode.right + 1 + 1
      });

    case Opcode.w:
      return new MoveW({ b : 0, length: 1 });

    case Opcode.w1:
    case Opcode.w2:
    case Opcode.w3:
    case Opcode.w4:                 
      if (buffer.length < opcode - Opcode.w) return undefined;
      return new MoveW({
	b : buffer.readIntBE(0, opcode - Opcode.w),
	length : opcode - Opcode.w + 1
      });

    case Opcode.x:
      return new MoveX({ b : 0, length: 1 });

    case Opcode.x1:
    case Opcode.x2:
    case Opcode.x3:
    case Opcode.x4:                 
      if (buffer.length < opcode - Opcode.x) return undefined;
      return new MoveX({
	b : buffer.readIntBE(0, opcode - Opcode.x),
	length : opcode - Opcode.x + 1
      });
      
    case Opcode.down:
    case Opcode.down2:
    case Opcode.down3:
    case Opcode.down4:      
      if (buffer.length < opcode - Opcode.down + 1) return undefined;
      return new MoveDown({
	a : buffer.readIntBE(0, opcode - Opcode.down + 1),
	length : opcode - Opcode.down + 1 + 1
      });

    case Opcode.y:
      return new MoveY({ a : 0, length: 1 });

    case Opcode.y1:
    case Opcode.y2:
    case Opcode.y3:
    case Opcode.y4:                 
      if (buffer.length < opcode - Opcode.y) return undefined;
      return new MoveY({
	a : buffer.readIntBE(0, opcode - Opcode.y),
	length : opcode - Opcode.y + 1
      });

    case Opcode.z:
      return new MoveZ({ a : 0, length: 1 });

    case Opcode.z1:
    case Opcode.z2:
    case Opcode.z3:
    case Opcode.z4:                 
      if (buffer.length < opcode - Opcode.z) return undefined;
      return new MoveZ({
	a : buffer.readIntBE(0, opcode - Opcode.z),
	length : opcode - Opcode.z + 1
      });

    case Opcode.fnt1:
    case Opcode.fnt2:
    case Opcode.fnt3:
    case Opcode.fnt4:
      if (buffer.length < opcode - Opcode.fnt1 + 1) return undefined;
      return new Font({
	k : buffer.readIntBE(0, opcode - Opcode.fnt1 + 1),
	length : opcode - Opcode.fnt1 + 1 + 1
      });

    case Opcode.xxx:
    case Opcode.xxx2:
    case Opcode.xxx3:
    case Opcode.xxx4: {
      let i = opcode - Opcode.xxx + 1;
      if (buffer.length < i) return undefined;      
      let k = buffer.readIntBE(0, i);
      if (buffer.length < i + k) return undefined;
      return new Special({
	x: buffer.slice(i, i+k).toString(),
	length: i+k+1
      });
    }

    case Opcode.fnt_def:
    case Opcode.fnt_def2:
    case Opcode.fnt_def3:
    case Opcode.fnt_def4: {
      let i = opcode - Opcode.fnt_def + 1;
      if (buffer.length < i) return undefined;
      let k = buffer.readIntBE(0, i);
      if (buffer.length < i + 14) return undefined;
      let c = buffer.readIntBE(i+0, 4);
      let s = buffer.readIntBE(i+4, 4);
      let d = buffer.readIntBE(i+8, 4);
      let a = buffer.readUInt8(i+12);
      let l = buffer.readUInt8(i+13);
      if (buffer.length < i+14+a+l) return undefined;
      let n = buffer.slice(i+14, i+14+a+l).toString();
      return new FontDefinition({
	k: k,
	c: c,
	s: s,
	d: d,
	a: a,
	l: l,
	n: n,
	length: i+14+a+l+1,
      });
    }

    case Opcode.pre: {
      if (buffer.length < 14) return undefined;
      let i = buffer.readUInt8(0);
      let num = buffer.readIntBE(1, 4);
      let den = buffer.readIntBE(5, 4);
      let mag = buffer.readIntBE(9, 4);
      let k = buffer.readUInt8(13);
      if (buffer.length < 14 + k) return undefined;
      console.log( "preamble: ",buffer.slice(14,14+k).toString());
      return new Preamble({
	i: i,
	num: num,
	den: den,
	mag: mag,
	x: buffer.slice(14,14+k).toString(),
	length: 14+k+1
      });
    }

    case Opcode.post:
      return new Post({ length: 1 });

    case Opcode.post_post:
      return new PostPost({ length: 1 });
  }

  return undefined;
}

export async function* dviParser(stream) {
  let f;
  let stack = [];
  let pos = { h: 0, v: 0, w: 0, x: 0, y: 0, z: 0 };
  let metadata = { num: 0, den: 0, mag: 0, s: 0 };
  let fonts = [];
  let pictureDepth = 0;

  let buffer = Buffer.alloc(0);
  
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
    let offset = 0;
    
    while(offset < buffer.length) {
      let opcode : Opcode = buffer.readUInt8(offset);
      
      let command = parseCommand( opcode, buffer.slice(offset+1) );

      if (command) {
	yield command;
	offset += command.length;
      } else
	break;
    }

    buffer = buffer.slice(offset);
  }
}

export async function* merge(commands, filter, merge) {
  let queue = [];
  console.log("merge");

  for await (const command of commands) {
    if (filter(command)) {
      queue.push( command );
    } else {
      if (queue.length > 0) {
	yield merge(queue);
	queue = [];
      }

      yield command;
    }
  }

  if (queue.length > 0) yield merge(queue);
}

export function combineSetChar(commands) {
  return merge( commands,
	 command => (command.opcode === Opcode.set_char),
	 function(queue) {
	   let text = queue
	     .map( command => String.fromCharCode(command.c) )
	     .join();
	   return new SetText({t:text});
	 });
}
