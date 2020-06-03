import color from "./specials/color";
import svg from "./specials/svg";
import html from "./specials/html";
import papersize from "./specials/papersize";
import title from "./specials/title";
import ximera from "./specials/ximera";

import VDomMachine from "./vdom";
import HTMLMachine from "./html";
import TextMachine from "./text";

export var Machines = { HTML: HTMLMachine,
                        vdom: VDomMachine,
			text: TextMachine };

import { dviParser, execute, mergeText } from "./parser";
export { dviParser, execute, mergeText };

export var specials = {
  color: color,
  svg: svg,
  html: html,
  papersize: papersize
};

function dvi2html( dviStream, htmlStream ) {
  let parser = ximera(title(papersize(html(svg(color(mergeText(dviParser(dviStream))))))));

  let machine = new HTMLMachine( htmlStream );

  execute( parser, machine );

  return machine;
}

function dvi2vdom( dviStream, h, callback ) {
  let parser = ximera(title(papersize(html(svg(color(mergeText(dviParser(dviStream))))))));

  let machine = new VDomMachine( h, callback );

  execute( parser, machine );

  return machine;
}

import { tfmData } from "./tfm/index";
export { tfmData, dvi2html, dvi2vdom };
