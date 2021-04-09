var execFile = require('child_process').execFile;
var fs = require('fs');
const util = require('util');
var path = require('path');

var desiredFonts = require('./fontlist.json');

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);

let command = "kpsewhich texglyphlist.txt";

function kpsewhich( s ) {
  return new Promise( (resolve, reject) => {
    execFile("kpsewhich", [s],
             function (error, stdout, stderr) {
               if (error)
                 reject(error);
               else
                 resolve(stdout.trim());
             });
  });
}

async function loadGlyphList(s) {
  let filename = await kpsewhich(s);
  let list = await readFile(filename);
  list = list.toString();
  
  let result = {};

  for(let line of list.split("\n")) {
    line = line.replace( /#.*/, '' );
    line = line.split(";");
    if (line.length >= 2) {
      let name = line[0];
      let encodings = line[1].split(",");
      encodings = encodings.filter( (e) => e.length == 4 ).map( (e) => parseInt(e,16) );
      let best = Math.min(...encodings);
      result[name] = best;
    }
  }
  return result;
}

async function loadAllGlyphs() {
  let glyphs1 = await loadGlyphList("glyphlist.txt");
  let glyphs2 = await loadGlyphList("texglyphlist.txt");
  Object.assign( glyphs1, glyphs2 );
  
  glyphs1['suppress'] = 0;
  glyphs1['mapsto'] = 0x21A6;
  glyphs1['arrowhookleft'] = 0x21A9;
  glyphs1['arrowhookright'] = 0x21AA;
  glyphs1['tie'] = 0x2040;
  return glyphs1;
}

function* tokenize(chars) {
  let iterator = chars[Symbol.iterator]();
  let ch = getNextItem(iterator);
  do {
    //ch = getNextItem(iterator);
    if (ch === '%') {
      do {
        ch = getNextItem(iterator);
      } while (ch !== '\n');
    } if ( typeof ch === 'string' && /^[\[\]\{\}]$/.test(ch)) {
      yield ch;
    } else if ((ch == '/') || isWordChar(ch)) {
      let word = '';
      do {
        word += ch;
        ch = getNextItem(iterator);
      } while (isWordChar(ch));
      yield word;
      continue;
    }
    ch = getNextItem(iterator);
    // Ignore all other characters
  } while (ch !== END_OF_SEQUENCE);
}
const END_OF_SEQUENCE = Symbol();
function getNextItem(iterator) {
    let item = iterator.next();
    return item.done ? END_OF_SEQUENCE : item.value;
}
function isWordChar(ch) {
    return typeof ch === 'string' && /^[\.A-Za-z0-9]$/.test(ch);
}

function glyphToCodepoint( glyphs, name )
{
  if (typeof glyphs[name] === 'number')
    return glyphs[name];

  if (name === '.notdef')
    return 0;

  if (/^u[0-9A-Fa-f]+$/.test(name)) {
    return parseInt(name.slice(1), 16);
  }

  throw `${name} is not a glyphname`;
}

function execute( token, stack, state, table, glyphs ) {
  if (token == 'repeat') {
    let code = stack.pop();
    let count = stack.pop();
    for( let i = 0 ; i < count; i++ ) {
      for (let c of code) {
        execute(c, stack, state, table, glyphs);
      }
    }
    return;
  }
  
  if (token[0] == '}') {
    state.brace = false;
    return;    
  }  
  
  if (state.brace) {
    stack[stack.length - 1].push( token );
    return;
  }
  
  if (token[0] == '{') {
    state.brace = true;
    stack.push( [] );
    return;    
  }
  
  if (token[0] == '[') {
    state.bracket = true;
    return;    
  }

  if (token[0] == ']') {
    state.bracket = false;
    return;    
  }  

  if (token[0] == '/') {
    if (state.bracket) {
      table.push( glyphToCodepoint(glyphs, token.slice(1)) );
    }
    
    stack.push( token );
    return;    
  }
  
  if (/^[0-9]+$/.test(token)) {
    stack.push( parseInt(token) );
    return;    
  }

}

async function loadEncoding(s, glyphs) {
  let filename = await kpsewhich(s);  
  let encoding = (await readFile(filename)).toString();
  let tokens = [...tokenize(encoding)];
  let stack = [];
  let state = {};
  let table = [];
  for (let token of tokens) {
    execute( token, stack, state, table, glyphs );    
  }
  return new Uint16Array(table);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

async function main() {
  let glyphs = await loadAllGlyphs();
  let tables = {}
  
  let encodings = Object.values(desiredFonts).filter(onlyUnique);
  for(let encoding of encodings) {
    console.log(`Processing ${encoding}...`);
    let table = await loadEncoding(encoding + ".enc", glyphs);
    if (table.length != 256)
      throw `Expected 256 codepoints but received ${table.length}`;
    tables[encoding] = table;
  }
  
  var outputPath = path.join(__dirname,'../src/tfm/encodings.json');
  var outputFile = fs.openSync( outputPath, 'w' );
  fs.writeFileSync( outputFile, JSON.stringify(tables) );
}

main();

