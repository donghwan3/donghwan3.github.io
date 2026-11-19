import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
async function htmlFiles(directory){
  const result=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isDirectory()) result.push(...await htmlFiles(file));
    else if(entry.name.endsWith('.html')) result.push(path.relative(root,file));
  }
  return result;
}
const files=await htmlFiles(root);
const errors=[];let references=0;
for(const name of files){
  const html=await readFile(path.join(root,name),'utf8');
  if(!html.includes('<meta charset="utf-8">')) errors.push(`${name}: missing UTF-8 declaration`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const url=match[1];
    if(/^(https?:|mailto:|tel:|data:|\/\/)/i.test(url)) continue;
    const [target,fragment]=url.split('#');
    const pathname=decodeURIComponent(target.split('?')[0]);
    let file=pathname.startsWith('/') ? path.resolve(root,pathname.slice(1))
      : pathname ? path.resolve(path.dirname(path.join(root,name)),pathname)
      : path.join(root,name);
    if(file!==root&&!file.startsWith(root+path.sep)){errors.push(`${name}: invalid path ${url}`);continue;}
    try{
      if((await stat(file)).isDirectory()) file=path.join(file,'index.html');
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
  if(/\{\{project(?:Style|Script)Version\}\}/.test(html)) errors.push(`${name}: unresolved project asset version`);
}
const index=JSON.parse(await readFile(path.join(root,'assets/search-index.json'),'utf8'));
if(index.length!==11) errors.push('Search index does not contain every migrated page');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`PASS: ${files.length} HTML files, ${references} local references, 11 searchable pages; all internal links and assets resolve.`);
