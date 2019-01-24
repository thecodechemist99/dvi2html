import * as fs from "fs";
import { execSync } from "child_process";
import { dvi2html } from "./src/parser";

console.log("Testing dvi2html");

execSync("latex sample/sample.tex");

let filename = 'sample.dvi';
let stat = fs.statSync(filename);
console.log(stat);
let buffer = new Buffer(stat.size);
let fd = fs.openSync( filename, 'r' );
fs.readSync( fd, buffer, 0, stat.size, 0 );

let fonts = "";
fonts = fonts + `@font-face { font-family: esint10; src: url('./esint10.ttf'); }\n`;
fs.readdirSync('./bakoma/ttf').forEach(file => {
  let name = file.replace(/.ttf/, '');
  fonts = fonts + `@font-face { font-family: ${name}; src: url('bakoma/ttf/${file}'); }\n`;
});
fs.writeFileSync("fonts.css", fonts);

let html = "";
html = html + "<html>\n";
html = html + "<head>\n";
html = html + '<link rel="stylesheet" type="text/css" href="fonts.css">\n';
html = html + '<link rel="stylesheet" type="text/css" href="base.css">\n';
html = html + "</head>\n";
html = html + '<body>\n';
html = html + '<div style="position: absolute;">\n';

html = html + dvi2html( buffer );

html = html + '</div>\n';
html = html + '</body>\n';
html = html + "</html>\n";

fs.writeFileSync("index.html", html);

