var fs = require('fs');
var dvi2html = require('./lib').dvi2html;
var Writable = require('stream').Writable;

let filename = process.argv[2];
let stream = fs.createReadStream(filename, { highWaterMark: 256 });

let svg = "";
const myWritable = new Writable({
	write(chunk, encoding, callback) {
		svg += chunk.toString();
		callback();
	}
});

(async () => {
	await dvi2html(stream, myWritable);
	fs.writeFileSync(filename.replace(/\.dvi$/, ".html"), `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>DVI2HTML Testing ${filename.replace(/\.dvi$/, "")}</title>
<link rel="stylesheet" type="text/css" href="dist/fonts.css">
<style>
.svg-container {
	margin: 10px auto;
	width: -moz-fit-content;
	width: fit-content;
	height: -moz-fit-content;
	height: fit-content;
}
.svg-container svg { overflow: visible; }
</style>
<body>
<div class="svg-container">
	${svg}
</div>
</body>
</html>
`
	);
})();
