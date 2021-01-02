import { Machine, Rule } from "./machine";
import { Writable } from 'stream';

export default class HTMLMachine extends Machine {
  output : Writable;
  pointsPerDviUnit : number;

  svgDepth : number;
  color : string;
  colorStack : string[];

  paperwidth : number;
  paperheight : number;
    
  pushColor( c : string ) {
    this.colorStack.push(this.color);
    this.color = c;
  }

  popColor( ) {
    this.color = this.colorStack.pop();
  }

  setPapersize( width : number, height : number ) {
    this.paperwidth = width;
    this.paperheight = height;  
  }

  putHTML( html : string ) {
    this.output.write( html );
  }
  
  putSVG( svg : string ) {
    let left = this.position.h * this.pointsPerDviUnit;
    let top = this.position.v * this.pointsPerDviUnit;

    this.svgDepth += (svg.match(/<svg>/g) || []).length;
    this.svgDepth -= (svg.match(/<\/svg>/g) || []).length;
    
    if (this.svgDepth > 1) {
        // In this case we are inside another svg element so drop the svg start tags.
        svg = svg.replace("<svg>", "");
    } else {
        svg = svg.replace("<svg>", `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" ` +
                          `xmlns:xlink="http://www.w3.org/1999/xlink" ` +
                          `width="${this.paperwidth + 1}pt" height="${this.paperheight + 1}pt" ` +
                          `viewBox="-73 -73 ${this.paperwidth + 1} ${this.paperheight + 1}" ` +
                          `style="overflow:visible">`);
    }

    if (this.svgDepth > 0) {
        // In this case we are inside another svg element so drop the svg end tags.
        svg = svg.replace("<\/svg>", "");
    }
    
    svg = svg.replace(/{\?x}/g, left.toString());
    svg = svg.replace(/{\?y}/g, top.toString());

    this.output.write( svg );
  }
  
  constructor( o : Writable ) {
    super();
    this.output = o;
    this.color = 'black';
    this.colorStack = [];
    this.svgDepth = 0;
  }

  preamble ( numerator : number, denominator : number, magnification : number, comment : string ) {
    let dviUnit = magnification * numerator / 1000.0 / denominator;
    
    let resolution = 300.0; // ppi
    let tfm_conv = (25400000.0 / numerator) * (denominator / 473628672) / 16.0;
    let conv = (numerator / 254000.0) * (resolution / denominator);
    conv = conv * (magnification / 1000.0);
    
    this.pointsPerDviUnit = dviUnit * 72.27 / 100000.0 / 2.54;
  }
  
  putRule( rule : Rule ) {
    let a = rule.a * this.pointsPerDviUnit;
    let b = rule.b * this.pointsPerDviUnit;
    let left = this.position.h * this.pointsPerDviUnit;
    let bottom = this.position.v * this.pointsPerDviUnit;
    let top = bottom - a;
    
    this.output.write(`<rect x="${left}" y="${top}" width="${b}" height="${a}" style="fill:${this.color};"></rect>\n`);
  }
    
  putText( text : Buffer ) : number {
    let textWidth = 0;
    let textHeight = 0;
    let textDepth = 0;

    var htmlText = "";
    
    for( let i = 0; i < text.length; i++ ) {
      let c = text[i];
      let metrics = this.font.metrics.characters[c];
      if (metrics === undefined){
        //TODO: Handle this better. Error only happens for c === 127
	      console.error(`Could not find font metric for ${c}`);
	      metrics = this.font.metrics.characters[126];
      }
      
      textWidth += metrics.width;
      textHeight = Math.max(textHeight, metrics.height);
      textDepth = Math.max(textDepth, metrics.depth);

      // This is ridiculous.
      if ((c >= 0) && (c <= 9)) {
        htmlText += `&#${161 + c};`;
      } else if ((c >= 10) && (c <= 19)) {
	htmlText += `&#${173 + c - 10};`;
      } else if (c == 20) {
	htmlText += `&#${8729};`; // O RLLY?!
      } else if ((c >= 21) && (c <= 32)) {
	htmlText += `&#${184 + c - 21};`;
      } else if (c == 127) {
	htmlText += `&#${196};`;
      } else {
	htmlText += String.fromCharCode(c);
      }
    }
    
    // tfm is based on 1/2^16 pt units, rather than dviunit which is 10^−7 meters
    var dviUnitsPerFontUnit = this.font.metrics.designSize / 1048576.0 * 65536 / 1048576;
    
    var top = (this.position.v - textHeight * dviUnitsPerFontUnit) * this.pointsPerDviUnit;
    let left = this.position.h * this.pointsPerDviUnit;

    var width = textWidth * this.pointsPerDviUnit * dviUnitsPerFontUnit;
    var height = textHeight * this.pointsPerDviUnit * dviUnitsPerFontUnit;
    var depth = textDepth * this.pointsPerDviUnit * dviUnitsPerFontUnit;
    var top = this.position.v * this.pointsPerDviUnit;

    let fontsize = (this.font.metrics.designSize / 1048576.0) * this.font.scaleFactor / this.font.designSize;

    if (this.svgDepth == 0) {
	this.output.write( `<span style="line-height: 0; color: ${this.color}; font-family: ${this.font.name}; font-size: ${fontsize}pt; position: absolute; top: ${top - height}pt; left: ${left}pt; overflow: visible;"><span style="margin-top: -${fontsize}pt; line-height: ${0}pt; height: ${fontsize}pt; display: inline-block; vertical-align: baseline; ">${htmlText}</span><span style="display: inline-block; vertical-align: ${height}pt; height: ${0}pt; line-height: 0;"></span></span>\n` );
    } else {
      let bottom = this.position.v * this.pointsPerDviUnit;
      // No 'pt' on fontsize since those units are potentially scaled
      this.output.write( `<text alignment-baseline="baseline" y="${bottom}" x="${left}" style="font-family: ${this.font.name};" font-size="${fontsize}">${htmlText}</text>\n` );
    }
    
    return textWidth * dviUnitsPerFontUnit * this.font.scaleFactor / this.font.designSize;
  }
}

