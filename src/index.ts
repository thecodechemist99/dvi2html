import color from "./specials/color";
import svg from "./specials/svg";
import html from "./specials/html";
import papersize from "./specials/papersize";
import title from "./specials/title";
import ximera from "./specials/ximera";

import HTMLMachine from "./html";
import TextMachine from "./text";

export var Machines = { HTML: HTMLMachine,
			text: TextMachine };

import { dviParser, execute, mergeText } from "./parser";
export { dviParser, execute, mergeText };

export var specials = {
  color: color,
  svg: svg,
  html: html,
  papersize: papersize
};

export async function dvi2html( dviStream, htmlStream ) {
  let parser = ximera(title(papersize(html(svg(color(mergeText(dviParser(dviStream))))))));

  let machine = new HTMLMachine( htmlStream );

  await execute( parser, machine );

  return machine;
}

import { tfmData } from "./tfm/index";
export { tfmData };
