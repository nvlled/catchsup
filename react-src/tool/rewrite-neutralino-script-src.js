import { JSDOM } from "jsdom";
import fs from "fs";

const htmlFile = "react-src/index.html";
const htmlContents = fs.readFileSync(htmlFile);
const dom = new JSDOM(htmlContents);
const scripts = dom.window.document.querySelectorAll("script");
for (const script of scripts) {
  if (!script.src.match(/\/?__neutralino_globals.js$/)) {
    continue;
  }
  script.src = "__neutralino_globals.js";
}

fs.writeFileSync(htmlFile, dom.serialize(), { encoding: "utf8" });
console.log(dom.serialize());
