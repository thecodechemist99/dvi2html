var path = require('path');
var fs = require('fs');
var outputPath = path.join(__dirname,'../src/tfm/fonts.json');
var execSync = require('child_process').execSync;

var desiredFonts = require('./fontlist.json');

var fonts = {};

function processTfmFile( fontname, filename ) {
  console.log( fontname, filename );

  var buffer = fs.readFileSync( filename );
  fonts[fontname] = buffer.toString('base64');
}

Object.keys(desiredFonts).forEach( function(fontname) {
  var filename = execSync('kpsewhich ' + fontname + '.tfm').toString().split("\n")[0];
  processTfmFile( fontname, filename );  
});

var outputFile = fs.openSync( outputPath, 'w' );
fs.writeFileSync( outputFile, JSON.stringify(fonts) );




