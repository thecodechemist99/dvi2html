var fs = require('fs');

var execSync = require('child_process').execSync;
var TFMParser = require('./tfm/parser');
function loadFont(name) {
  var path = execSync('kpsewhich ' + name + '.tfm').toString().split("\n")[0];
  var tfm = TFMParser.parse(name, path);
  return tfm;
}

var debug = true;

function log(message, color, force) {
  if(!debug && (force || color) !== true ) return;
  if(color === true) color = '';

  console.log(
    '%s %s %s',
    color ? '\033[' + color + 'm' : '',
    message,
    color ? '\033[0m' : ''
  );
}

var output = "";
var conversionFactor = 1.0;
var dviUnit = 1.0;

var f;
var stack = [];
//          h  v  w  x  y  z  
var pos = [ 0, 0, 0, 0, 0, 0 ];
var metadata = { num: 0, den: 0, mag: 0, s: 0 };
var fonts = [];
var pictureStack = [ ];

/**
 * scaleDim(measurement)
 *
 * Scales the given measurement by the documents specified `num`, `den`,
 * and `mag` properties (defined in the preamble).
 * 
 */
function scaleDim(measurement) {
  //  `7227` TeX units in `254` cm
  //  den = 7227 * 2^16
  // 0.035277778 pts = 1 cm
  return ((measurement * metadata.num) / (metadata.mag * metadata.den)) * 0.035277778;
}

function getParamOffset(opcode, offset, file) {
  //  preamble values
  var fmt, num, den, mag, k;
  // general command values (character, width, height, vertical, x, y, z, font)
  var ch, w, h, v, x, y, z;
  var i, p, l, u, s, t;

  var c = [];
  
  switch(opcode) {
    case 137:
      // put_rule, identical to following set_rule (no change in `h`)
    case 132:
      // `set_rule; a[4], b[4]`
      var a = file.slice(offset, offset + 4).readIntBE(0, 4); offset += 4;
      var b = file.slice(offset, offset + 4).readIntBE(0, 4); offset += 4;
      // bottom left corner of box at (h,v)

      a = a * conversionFactor;
      b = b * conversionFactor;    
    
      var left = pos[0] * conversionFactor;
    var bottom = pos[1] * conversionFactor;
    var top = bottom - a;
    if ((a > 0) && (b > 0)) {
      log(`Set rule at (${left},${bottom}) and size (${a},${b})`);
      output = output + `<span style="background: black; position: absolute; top: ${top}pt; left: ${left}pt; width:${b}pt; height: ${a}pt;"></span>\n`;
    }

    if(opcode === 132) pos[0] += b;

    break;
    case 138:
      log('NOP', 35);
    break;
    case 139:
      // Beginning of a page (BOP):
      // Set stack empty 
      stack = [];
      // and (h,v,w,x,y,z):=(0,0,0,0,0,0)
      pos   = [ 0, 0, 0, 0, 0, 0 ];
    
      // BADBAD: Set font to undefined value
      // f = null;
    
      // Get the page information (10 4-byte sequences, + 1 byte)
      c = [];
      i = 0;

      while(i < 10) {
        c[i++] = file.slice(offset, offset + 4).readUInt32BE(0);
        offset += 4;
      }

      log('\n==== BOP ====');
      log('[ ' + c.join(', ') + ' ]\n');
    break;
    case 140:
      // End of a page (EOP):
      // Stack should be empty
      if(stack.length) log('STACK IS NOT EMPTY', 32);
      log('\n==== EOP ====\n');
      // PRINT what we have since last BOP
    break;
    case 141:
      stack.push(Object.assign({}, pos));
      log('PUSH', 33);
      //output = output + "<div>";
      console.log('h: %s, v: %s, w: %s, x: %s, y: %s, z: %s', pos[0], pos[1], pos[2], pos[3], pos[4], pos[5]);
      pos = [ pos[0], pos[1], pos[2], pos[3], pos[4], pos[5] ];
    break;
    case 142:
      // pop and assign values to current h,v,w,x,y,z
      pos = stack.pop();
      log('POP!', 33);
      //output = output + "</div>\n";
      console.log('h: %s, v: %s, w: %s, x: %s, y: %s, z: %s', pos[0], pos[1], pos[2], pos[3], pos[4], pos[5]);
    break;
    case 247:
      // PREAMBLE !!
      // i[1]
      i   = file.slice(offset,offset+1); offset += 1;
      // num[4]
      num = file.slice(offset,offset+4); offset += 4;
      // den[4]
      den = file.slice(offset,offset+4); offset += 4;
      // mag[4]
      mag = file.slice(offset,offset+4); offset += 4;
      //  k[1]
      k   = file.slice(offset,offset+1).readUInt8(0); offset += 1;
      x   = file.slice(offset,offset+k); offset += k;

      metadata.num = num.readUInt32BE(0);
      metadata.den = den.readUInt32BE(0);
      metadata.mag = mag.readUInt32BE(0);

      if(num <= 0) throw Error('Invalid numerator (must be > 0)');
      if(den <= 0) throw Error('Invalid Denominator (must be > 0)');

       dviUnit = metadata.mag * metadata.num / 1000.0 / metadata.den;
    console.log("dviUnit",dviUnit);
      var resolution = 300.0; // ppi
      var tfm_conv = (25400000.0 / num.readUInt32BE(0)) * ( den.readUInt32BE(0) / 473628672 ) / 16.0;
      var conv = (num.readUInt32BE(0)/254000.0) * (resolution/den.readUInt32BE(0));
      var true_conv = conv;
      conv = true_conv * (mag.readUInt32BE(0)/1000.0);
      //conversionFactor = conv * 0.3;
      //conversionFactor = conv * 0.3;
      conversionFactor = dviUnit * 72.27 / 100000.0 / 2.54;
      log('\n=== PREAMBLE ===\n', 36, true);
      log([
        'Format:', i.readUInt8(0), '\n',
        'Numerator:', num.readUInt32BE(0), '\n',
        'Denominator:', den.readUInt32BE(0), '\n',
        'Magnification:', mag.readUInt32BE(0), '\n',
        'Conversion:', conv, ' points per DVI Unit\n',
        'Comment:', x.toString('ascii'), '\n'
      ].join(' '), 36, true);
    break;
    case 248:
      // POSTAMBLE!!!!
      // p[4], num[4], den[4], mag[4], l[4], u[4], s[2], t[2];
      p = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4;  // final `bop`
      num = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4; // see pre
      den = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4; // see pre
      mag = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4; // see pre
      l = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4; // height+depth of tallest page
      u = file.slice(offset, offset+4).readIntBE(0, 4); offset += 4; // width of widest page
      s = file.slice(offset, offset+2).readIntBE(0, 2); offset += 2; // max stack depth
      t = file.slice(offset, offset+2).readIntBE(0, 2); offset += 2; // page count

      log('\n=== POSTAMBLE ===\n', 36, true);
      log([
        'Last BOP:', p, '\n',
        'Numerator:', num, '\n',
        'Denominator:', den, '\n',
        'Magnification:', mag, '\n',
        'Tallest Page:', l, '\n',
        'Widest Page:', u, '\n',
        'Max Stack:', s, '\n',
        'Pages:', t, '\n'
      ].join(' '), 36, true);
    break;
    case 249:
      // POST POST
      // q[4], i[1]; 223's
      q = file.slice(offset, offset+4); offset += 4; // pointer to beginning of postamble
      i = file.slice(offset, offset+1); offset += 1; // see preamble
      offset = file.length;
    break;
    default:
      if(opcode >= 0 && opcode <= 127) {
        // `set_char_i`
        i = opcode;
        c = String.fromCharCode(i);
	
        log('set_char_i: "' + c + '" with code ' + i + ' and font ' + f);
	
	if (i < 32)
	  //c = `&#${160 + i};`;
	  c = `&#${127 + i + 32 + 4};`;

        var m = fonts[f].metrics.get_char(i);
	var left = pos[0] * conversionFactor;
	console.log(pos);
	var fontname = fonts[f].name;
        var fontsize = 1 * (fonts[f].metrics.design_font_size/1048576.0) * fonts[f].scaleFactor / fonts[f].designSize ;
        // tfm is based on 1/2^16 pt units, rather than dviunit which is 10^−7 meters
        var tfm2dvi = fonts[f].metrics.design_font_size/(1048576.0) * 65536 / 1048576;
	//var top = (pos[1] - m.height*tfm2dvi) * conversionFactor;
        var top = (pos[1] - m.height*tfm2dvi) * conversionFactor;
        pos[0] += m.width * tfm2dvi;
        
        var width = m.width * conversionFactor * tfm2dvi;
        var height = (m.height) * conversionFactor * tfm2dvi;
        var depth = (m.depth) * conversionFactor * tfm2dvi;// (-m.height) * conversionFactor;

        // BOX
        //output = output + `<span style="font-family: ${fontname}; font-size: ${fontsize}pt; position: absolute; top: ${top}pt; left: ${left}pt; background: #EEE; overflow: visible; width:${width}pt; line-height: ${fontsize}pt; height: ${height+depth}pt;"></span>`;

        var top = (pos[1]) * conversionFactor;
        if (pictureStack.length == 0) {
          output = output + `<span style="font-family: ${fontname}; font-size: ${fontsize}pt; position: absolute; top: ${top-height}pt; left: ${left}pt; overflow: visible;"><span style="margin-top: -${fontsize}pt; line-height: ${0}pt; height: ${fontsize}pt; display: inline-block; vertical-align: baseline; ">${c}</span><span style="display: inline-block; vertical-align: ${height}pt; height: ${0}pt; line-height: 0;"></span></span>`;
        } else {
          bottom = (pos[1]) * conversionFactor;
          // No 'pt' on fontsize since those units are potentially scaled
          output = output + `<text alignment-baseline="baseline" y="${bottom}" x="${left}" style="font-family: ${fontname}; font-size: ${fontsize};">${c}</text>`;
        }
        
      }
      else if(opcode >= 128 && opcode <= 131) {
        // `seti c[i]`, set0 = set_char_0, set1 = setting for 128 <= c < 256
        i = opcode - 128;
        // set0 is set_char_0
        if(i === 0) console.log('set_char_0');
        // set1 is range 128-255
        // set2 is range beyond 255
        if(i > 0) ch = file.slice(offset,offset+1).readUInt8(0); offset += 1;
        log('seti: ' + String.fromCharCode(i) + '\n');
      }
      else if(opcode >= 133 && opcode <= 136) {
        // `puti (1 <= i <= 4); c[i]`
        i = opcode - 132;
        //  typset char at (h, v)
        ch = file.slice(offset, offset + i).readIntBE(0, i); offset += i;
        // log('Setting Character ' + String.fromCharCode(ch) + '\n');
      }
      else if(opcode >= 143 && opcode <= 146) {
        //  righti
        //  arg is up to next 4 bytes (in 2's compliment)
        i = opcode - 142; // 1 <= i <= 4
        //  update the horizontal point
        b = file.slice(offset, offset + i).readIntBE(0, i); offset += i;
        
        var left = pos[0] * conversionFactor;
        var top = pos[1] * conversionFactor;
        
        pos[0] += b;
        log('righti: ' + pos[0]);
	console.log(pos);

        if (b * conversionFactor > 1.0)
        output = output +`<span style="position: absolute; top: ${top}pt; left: ${left}pt; overflow: visible; line-height: 0; font-size: 0;">&nbsp;</span>`;        
      }
      else if(opcode >= 147 && opcode <= 151) {
        // wi
        i = opcode - 147; // 0 <= i <= 4
        
        if(i > 0) {
          pos[2] = file.slice(offset, offset + i).readIntBE(0, i);
          offset += i;
        }

        var left = pos[0] * conversionFactor;
        var top = pos[1] * conversionFactor;
        
        pos[0] += pos[2];
        log('wi: ' + pos[0]);

        if (pos[2] * conversionFactor > 1.0)
        output = output +`<span style="position: absolute; top: ${top}pt; left: ${left}pt; overflow: visible; line-height: 0; font-size: 0;">&nbsp;</span>`;
      }
      else if(opcode >= 152 && opcode <= 156) {
        // xi
        // This command changes the current x spacing and moves right by b.
        i = opcode - 152; // 1 <= i <= 4

        if(i > 0) {
          pos[3] = file.slice(offset, offset + i).readIntBE(0, i);
          offset += i;
	}
        
        var left = pos[0] * conversionFactor;
        var top = pos[1] * conversionFactor;
        
        pos[0] += pos[3];
        log('xi: ' + pos[0]);

        if (pos[3] * conversionFactor > 1.0)
        output = output + `<span style="position: absolute; top: ${top}pt; left: ${left}pt; overflow: visible; line-height: 0; font-size: 0;">&nbsp;</span>`;

      }
      else if(opcode >= 157 && opcode <= 160) {
        // downi
        i = opcode - 156; // 1 <= i <= 4
        a = file.slice(offset, offset + i).readIntBE(0, i); offset += i;
        pos[1] += a;
        log('downi: ' + pos[1]);
      }
      else if(opcode >= 161 && opcode <= 165) {
        // yi
        i = opcode - 161; // 0 <= i <= 4

        if(i > 0) {
          pos[4] = file.slice(offset, offset + i).readIntBE(0, i);
          offset += i;
        }

        pos[1] += pos[4];
        log('yi: ' + pos[1]);
      }
      else if(opcode >= 166 && opcode <= 170) {
        // zi
        i = opcode - 166; // 0 <= i <= 4

        if(i > 0) {
          pos[5] = file.slice(offset, offset + i).readIntBE(0, i);
          offset += i;
        }

        pos[1] += pos[5];
        log('Y size: ' + pos[1]); 
      }
      else if(opcode >= 171 && opcode <= 234) {
        // `fnt_num_i (0 <= i <= 63)`
        f = opcode - 171; // check if font was defined via `fnt_def`
        log('Set font to: ' + f);
      }
      else if(opcode >= 235 && opcode <= 238) {
        //  `fnti`
        i = opcode - 234; // (1 <= i <= 4);
        f = file.slice(offset, offset + i).readIntBE(0, i); offset += i;
        log('Set font to: ' + f);
      }
      else if(opcode >= 239 && opcode <= 242) {
        // SPECIALS (used for graphics, non-text/block related visuals)
        // This command is undefined in general; it functions as a k+i+1$-byte
        // nop unless special DVI-reading programs are being used.
        i = opcode - 238; // 1 <= i <= 4
        k = file.slice(offset, offset + i).readUIntBE(0, i); offset += i;
        x = file.slice(offset, offset + k); offset += k;
        log('Opcode:' + i);
        log('SPECIAL: ' + '"' + x.toString() + '"' );

        if (x.toString().startsWith('color ')) {
          log("COLOR: " + x);
        }

        if (x.toString() == 'ximera begin-picture') {
          pictureStack.push(Object.assign({}, pos));
        }

        if (x.toString() == 'ximera end-picture') {
          pictureStack.pop();
        }
        
        if (x.toString().startsWith('dvisvgm:raw')) {
          x = x.toString();
          x = x.replace(/{\?nl}/g, "\n");

          var left = pos[0] * conversionFactor;
          var top = pos[1] * conversionFactor;

          // BADBAD: SVG units should be in points rather than pixels
          x = x.replace("<svg>", `<svg width="10pt" height="10pt" viewBox="0 0 10 10" style="overflow: visible; position: absolute;">`);

          x = x.replace(/{\?x}/g, left.toString());
          x = x.replace(/{\?y}/g, top.toString());
          output = output + x.substr(x.indexOf(" ") + 1);
        }
        //offset += 1;
      }
      else if(opcode >= 243 && opcode <= 246) {
        // `fnt_defi (1 <= i <= 4);
        i = opcode - 242;
        // k[i]     - font ()
        f = file.slice(offset, offset + i).readIntBE(0, i); offset += i;
        // c[4]     - check sum of `.tfm` file
        c = file.slice(offset, offset+4); offset += 4;
        // s[4]     - fixed-point scale factor (applied to char widths of font)
        s = file.slice(offset, offset+4); offset += 4;
        // d[4]     - design-size factors with the magnification (`s/1000`)
        d = file.slice(offset, offset+4); offset += 4;
        // a[1]     - length of directory path of font (`./` if a = 0)
        a = file.slice(offset, offset+1).readInt8(0); offset += 1; // UInt
        // l[1]     - length of font name
        l = file.slice(offset, offset+1).readInt8(0); offset += 1; // UInt
        // n[a+l]   - font name (first `a` bytes is dir, remaining `l` = name)
        n = file.slice(offset, offset + a + l); offset += (a + l);
        
        // Font definitions must appear before the first use of a particular
        // font number. 
        // Once font k is defined, it must not be defined again;
        log('\n==== FONT DEF ====\n');
        log([
          'Font Name:', n.toString('ascii'), '\n',
          'Font Number:', f, '\n',
          'Checksum:', c.readUInt32BE(0), '\n',
          'Scale Factor:', s.readUInt32BE(0), '\n',
          'Design Size:', d.readUInt32BE(0), '\n'
        ].join(' '), 36);

        var name = n.toString('ascii');
        var metrics = loadFont( name );

        if (metrics.checksum !== c.readUInt32BE(0)) {
          throw 'Bad checksum for font ' + name;
        }
	fonts[f] = { name: name, scaleFactor: s.readUInt32BE(0), designSize: d.readUInt32BE(0), metrics: metrics };
      }
  }

  return offset;
}

module.exports.dvi2html = function(buffer) {
   var p = 0;

  output = "";
  
  for(var i = 0; i < buffer.length; p = i) {
    i = getParamOffset(buffer.readUInt8(i++), i, buffer);
    // console.log(i-p);
  }

  while(stack.length > 0) {
    stack.pop();
    output = output + "</div>";
  }
  
  return output;
};
