const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
let html = fs.readFileSync(path.join(root,"page.html"),"utf8");
for (const [marker,file] of [["STYLES","style.css"],["ENGINE","engine.js"],["MAP","map.js"],["APP","app.js"]]) {
  html = html.replace("/* "+marker+" */",()=>fs.readFileSync(path.join(root,file),"utf8"));
}
fs.writeFileSync(path.join(root,"index.html"),html);
