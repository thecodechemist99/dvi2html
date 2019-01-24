var fs = require('fs');

console.log("Testing dvi2html");

var execSync = require('child_process').execSync;
execSync("latex sample/sample.tex");

var filename = 'sample.dvi';
var stat = fs.statSync(filename);
console.log(stat);
var buffer = new Buffer(stat.size);
var fd = fs.openSync( filename, 'r' );
fs.readSync( fd, buffer, 0, stat.size, 0 );

var fonts = "";
fs.readdirSync('./bakoma/ttf').forEach(file => {
  name = file.replace(/.ttf/, '');
  fonts = fonts + `@font-face { font-family: ${name}; src: url('bakoma/ttf/${file}'); }\n`;
});
fs.writeFileSync("fonts.css", fonts);

var html = "";
html = html + "<html>\n";
html = html + "<head>\n";
html = html + '<link rel="stylesheet" type="text/css" href="fonts.css">\n';
html = html + '<link rel="stylesheet" type="text/css" href="base.css">\n';
html = html + "</head>\n";
html = html + '<body>\n';
html = html + '<div style="position: absolute;">\n';

var parser = require('./src/parser');
html = html + parser.dvi2html( buffer );

html = html + '</div>\n';
html = html + '</body>\n';
html = html + "</html>\n";

fs.writeFileSync("index.html", html);

