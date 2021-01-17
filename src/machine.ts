//  var path = execSync('kpsewhich ' + name + '.tfm').toString().split("\n")[0];

import { Tfm } from './tfm/tfm';
import { loadFont } from './tfm/index';
import Matrix from './matrix';

export interface Rule {
  a : number;
  b : number;
}

class Position {
  h: number;
  v: number;
  w: number;
  x: number;
  y: number;
  z: number;
  
  constructor(properties? : Position) {
    if (properties) {
      this.h = properties.h;
      this.v = properties.v;
      this.w = properties.w;
      this.x = properties.x;
      this.y = properties.y;
      this.z = properties.z;
    } else {
      this.h = this.v = this.w = this.x = this.y = this.z = 0;      
    }
  }
}

export class DviFont {
  name: string;
  checksum: number;
  scaleFactor: number;
  designSize: number;
  metrics: Tfm;
  
  constructor(properties : DviFont) {
    this.name = properties.name;
    this.checksum = properties.checksum;
    this.scaleFactor = properties.scaleFactor;
    this.designSize = properties.designSize;
  }
}

export class Machine {
  fonts : DviFont[];
  font : DviFont;
  stack : Position[];
  position : Position;
  matrix: Matrix;

  constructor () {
    this.fonts = [];
	this.matrix = new Matrix();
  }
  
  preamble ( numerator : number, denominator : number, magnification : number, comment : string ) {
  }

  pushColor( c : string ) {
  }

  popColor( ) {
  }  

  setPapersize( width : number, height : number ) {
  }
    
  push() {
    this.stack.push(new Position(this.position));
  }

  pop() {
    this.position = this.stack.pop();
  }

  beginPage( page : any ) {
    this.stack = [];
    this.position = new Position();
  }

  endPage() { }  

  post( p : any ) { }
  
  postPost( p : any ) { }

  getCurrentPosition(): [number, number] { return [this.position.h, this.position.v]; }
  
  setCurrentPosition(x: number, y: number) { this.position.h = x; this.position.v = y; }

  putRule( rule : Rule ) {
  }

  moveRight( distance : number ) {
    this.position.h += distance;
  }

  moveDown( distance : number ) {
    this.position.v += distance;
  }

  setFont( font : DviFont ) {
    this.font = font;
  }

  putSVG( svg : string ) {
  }

  putHTML( html : string ) {
  }
  
  // Returns the width of the text
  putText( text : Buffer ) : number {
    return 0;
  }  

  loadFont( properties : any ) : DviFont {
    var f = new DviFont(properties);
    f.metrics = loadFont(properties.name);
    return f;
  }
}

