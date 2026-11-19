"""Convert the archived Google Sites pages into editable, independent HTML fragments.
Run deliberately after crawl.py; this replaces content/pages with the source snapshot.
The website itself needs only Node.js, not these migration dependencies.
"""
from pathlib import Path
import sys, json, re, html, hashlib
from urllib.parse import urlsplit, urljoin, parse_qs
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
from bs4 import BeautifulSoup
from PIL import Image
import requests

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://sites.google.com/site/donghwanleehome'
inventory = json.loads((ROOT/'source-snapshot/inventory.json').read_text(encoding='utf8'))
ASSETS = inventory['assets']
WIDTHS = {'uQSCkd':12,'EehZO':10,'OiUrBf':8,'qWD73c':6,'wNfPc':5,'II5mzb':4,'c5RTEf':3,'ibL1re':2,'R6PoUb':1}
(ROOT/'content/pages').mkdir(parents=True,exist_ok=True)
home = BeautifulSoup((ROOT/'source-snapshot/home.html').read_text(encoding='utf8'),'html.parser')
nav = [{'slug':a['href'].rstrip('/').split('/')[-1], 'label':a.get_text(' ',strip=True)} for a in home.select('a[data-navtype]')]
logo = ASSETS[home.select_one('img[aria-label="Site home"]')['src']]['path']

def rewrite(url):
    u=urlsplit(url)
    if u.hostname in ('www.google.com','google.com') and u.path == '/url':
        url=parse_qs(u.query).get('q',[url])[0]
    u=urlsplit(urljoin(BASE+'/',url))
    if u.hostname=='sites.google.com' and u.path.rstrip('/').startswith('/site/donghwanleehome'):
        slug=u.path[len('/site/donghwanleehome'):].strip('/') or 'home'
        if slug in {p['slug'] for p in nav}:
            return ('index.html' if slug=='home' else slug+'.html')+('#'+u.fragment if u.fragment else '')
    return url

def clean_rich(node, title=False):
    s=BeautifulSoup(str(node),'html.parser')
    for n in s.select('.PPhIP, script, style, svg'):
        n.decompose()
    for n in list(s.find_all(True)):
        if n.name is None: continue
        old=dict(n.attrs)
        keep={k:v for k,v in old.items() if k in ('id','href','title','colspan','rowspan','start','value','lang','dir')}
        if n.name=='a':
            keep['href']=rewrite(old.get('href',''))
            if old.get('target')=='_blank': keep.update(target='_blank',rel='noopener noreferrer')
        style=old.get('style','')
        safe=[]
        for rule in style.split(';'):
            if ':' not in rule: continue
            key,val=[p.strip() for p in rule.split(':',1)]
            if key in ('color','font-weight','font-style','font-size','text-decoration','vertical-align','text-align','list-style-type') and 'url(' not in val:
                safe.append(key+': '+val)
        if safe: keep['style']='; '.join(safe)
        if n.name=='h1' and not title: n.name='h2'
        if n.name=='span' and not keep: n.unwrap(); continue
        if n.name=='div' and not keep: n.unwrap(); continue
        n.attrs=keep
    return ''.join(str(x) for x in s.contents)

def block(b,slug,i):
    img=b.select_one('img[src]')
    if img:
        a=ASSETS[img['src']]
        path=a['path']
        with Image.open(ROOT/path) as im: w,h=im.size
        labels={'home':['Reinforced Decision Intelligence Lab — REDI','Human and machine intelligence','Foundations of reinforcement learning','Safe and robust learning-based control','Autonomous and industrial intelligence','Research collaboration','Reinforcement Learning book cover'],
                'books':['Reinforcement learning book cover','Reinforcement Learning: Mathematical Foundations and Algorithmic Principles'],
                'pi':['Donghwan Lee']}
        alt=img.get('alt') or img.get('aria-label') or (labels.get(slug,[])[i] if i<len(labels.get(slug,[])) else f'{slug.replace("-"," ").title()} illustration')
        return f'<figure><img src="{path}" alt="{html.escape(alt,quote=True)}" width="{w}" height="{h}" loading="{"eager" if slug=="home" and i==0 else "lazy"}" decoding="async"></figure>'
    frame=b.select_one('iframe[src]')
    if frame:
        u=urlsplit(frame['src']); src=frame['src']
        title=frame.get('aria-label','Embedded video').removeprefix('YouTube Video, ')
        watch=''
        if u.hostname in ('www.youtube.com','youtube.com') and u.path.startswith('/embed/'):
            video=u.path.split('/')[-1]
            src='https://www.youtube.com/embed/'+video
            watch=f'<a class="video-link" href="https://www.youtube.com/watch?v={video}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>'
        return f'<div class="video"><iframe src="{html.escape(src,quote=True)}" title="{html.escape(title,quote=True)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'+watch
    if 'N0neUc' in b.get('class',[]):
        a=b.select_one('a[href]')
        if a: return f'<a class="button" href="{html.escape(rewrite(a["href"]),quote=True)}" target="_blank" rel="noopener noreferrer">{html.escape(a.get_text(" ",strip=True))}</a>'
    if b.select_one('.iwQgFb'): return '<hr>'
    if 'mGzaTb' in b.get('class',[]):
        return '<div class="rich-text">'+clean_rich(b,title='lkHyyc' in b.get('class',[]))+'</div>'
    if b.get_text(strip=True): raise ValueError('Unrecognized content block: '+str(b)[:160])
    return ''

report=[]
for item in nav:
    slug=item['slug']
    s=BeautifulSoup((ROOT/'source-snapshot'/f'{slug}.html').read_text(encoding='utf8'),'html.parser')
    output=[]; image_index=0
    for sec in s.select('section'):
        cols=[]
        for col in sec.select('.LS81yb > div'):
            width=next((WIDTHS[c.split('-')[-1]] for c in col.get('class',[]) if c.startswith('hJDwNd-AhqUyc-')),12)
            blocks=[]
            for b in col.select('.tyJCtd'):
                rendered=block(b,slug,image_index)
                if b.select_one('img'): image_index+=1
                if rendered: blocks.append(rendered)
            cols.append(f'<div class="column span-{width}{" spacer" if not blocks else ""}">\n'+ '\n'.join(blocks)+'\n</div>')
        is_title='LB7kq' in sec.get('class',[])
        is_divider=bool(sec.select_one('.iwQgFb'))
        cls='page-title' if is_title else 'divider-section' if is_divider else 'content-section'
        output.append(f'<section class="{cls}" id="{sec.get("id",slug)}">\n<div class="section-grid">\n'+'\n'.join(cols)+'\n</div>\n</section>')
    fragment='\n\n'.join(output)+'\n'
    (ROOT/'content/pages'/f'{slug}.html').write_text(fragment,encoding='utf8')
    report.append({'slug':slug,'label':item['label'],'source':BASE+'/'+slug,
                   'sections':len(s.select('section')),'images':len(s.select('section img')),
                   'videos':len(s.select('section iframe')), 'links':len(s.select('section a[href]:not([aria-label="Copy heading link"])'))})

config={'title':'Reinforced Decision Intelligence','description':'Reliable reinforcement learning and learning-based control with mathematical guarantees for autonomous and industrial systems.','logo':logo,'source':BASE,'navigation':nav}
(ROOT/'content/site.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'content/migration.json').write_text(json.dumps({'source':BASE,'pages':report,'images':list({v['path']:{'path':v['path'],'bytes':v['bytes']} for v in ASSETS.values()}.values()),'external_content':'YouTube players, publisher/arXiv links, and the existing Drive CV link remain external.'},ensure_ascii=False,indent=2)+'\n',encoding='utf8')

# Store the same font locally so the copied pages do not depend on Google Sites.
fontdir=ROOT/'assets/fonts';fontdir.mkdir(exist_ok=True)
r=requests.get('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..700;1,400..700&display=swap',headers={'User-Agent':'Mozilla/5.0'},timeout=30)
r.raise_for_status(); css=r.text
for url in set(re.findall(r'url\((https[^)]+)\)',css)):
    data=requests.get(url,timeout=30);data.raise_for_status()
    suffix=urlsplit(url).path.split('.')[-1]
    name=hashlib.sha256(data.content).hexdigest()[:16]+'.'+suffix
    (fontdir/name).write_bytes(data.content)
    css=css.replace(url,'fonts/'+name)
(ROOT/'assets/fonts.css').write_text(css,encoding='utf8')
license=requests.get('https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt',timeout=30)
license.raise_for_status();(fontdir/'OFL.txt').write_bytes(license.content)
print(json.dumps({'imported':report,'font_files':len(list(fontdir.glob('*')))},ensure_ascii=True))
