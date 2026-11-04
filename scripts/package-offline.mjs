import fs from 'node:fs';
import path from 'node:path';
const assets=fs.readdirSync('dist/assets');
const js=fs.readFileSync(path.join('dist/assets',assets.find(f=>f.endsWith('.js'))),'utf8');
const css=fs.readFileSync(path.join('dist/assets',assets.find(f=>f.endsWith('.css'))),'utf8').replace(/@import\s*(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/g,'');
const source=fs.readFileSync('../outputs/Verdi-Temporal-Flow-Source.zip').toString('base64');
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verdi Temporal Flow Explorer</title><style>${css}</style></head><body><div id="root"></div><script>window.__SOURCE_ARCHIVE__=${JSON.stringify(source)};</script><script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
const output=path.resolve('../outputs/Verdi-Temporal-Flow-Explorer.html');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);console.log(output);
