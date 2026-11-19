import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const files=(await readdir(root)).filter(f=>f.endsWith('.html'));
const errors=[];let references=0;
for(const name of files){
  const html=await readFile(path.join(root,name),'utf8');
  if(!html.includes('<meta charset="utf-8">')) errors.push(`${name}: missing UTF-8 declaration`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const url=match[1];
    if(/^(https?:|mailto:|tel:|data:)/i.test(url)) continue;
    const [target,fragment]=url.split('#');
    const file=path.resolve(root,decodeURIComponent(target||name));
    if(file!==root&&!file.startsWith(root+path.sep)){errors.push(`${name}: invalid path ${url}`);continue;}
    try{
      if(!(await stat(file)).isFile()) throw new Error();
      if(fragment&&file.endsWith('.html')){
        const dest=await readFile(file,'utf8');
        if(!dest.includes(`id="${fragment}"`)) errors.push(`${name}: missing anchor ${url}`);
      }
    }catch{errors.push(`${name}: missing local resource ${url}`);}
    references++;
  }
  if(/sites\.google\.com\/sitesv-images/.test(html)) errors.push(`${name}: image still depends on Google Sites`);
  if(/jscontroller=|jsaction=/.test(html)) errors.push(`${name}: Google application handlers remain`);
}
const index=JSON.parse(await readFile(path.join(root,'assets/search-index.json'),'utf8'));
if(index.length!==11) errors.push('Search index does not contain every migrated page');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`PASS: ${files.length} HTML files, ${references} local references, 11 searchable pages; all internal links and assets resolve.`);
