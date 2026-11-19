"""Archive the public source site and its image assets for a one-time migration."""
from pathlib import Path
import sys, json, hashlib, re, mimetypes
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlsplit, parse_qs, unquote
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools'))
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://sites.google.com/site/donghwanleehome'
SNAP = ROOT / 'source-snapshot'
SNAP.mkdir(exist_ok=True)
(ROOT / 'assets' / 'images').mkdir(parents=True, exist_ok=True)

def get(url):
    r = requests.get(url, timeout=45)
    r.raise_for_status()
    return r

def unwrap(url):
    u = urlsplit(url)
    if u.hostname in ('www.google.com', 'google.com') and u.path == '/url':
        return parse_qs(u.query).get('q', [url])[0]
    return url

def page(url):
    r = get(url)
    html = r.content.decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    slug = urlsplit(url).path[len('/site/donghwanleehome'):].strip('/') or 'home'
    path = SNAP / (slug.replace('/', '__') + '.html')
    path.write_text(html, encoding='utf-8')
    links = []
    for a in soup.select('a[href]'):
        full = unwrap(urljoin(url, a['href']))
        u = urlsplit(full)
        if u.hostname == 'sites.google.com' and u.path.startswith('/site/donghwanleehome/'):
            if '/system/' not in u.path and not re.search(r'\.[a-zA-Z0-9]{2,5}$', u.path):
                links.append('https://sites.google.com' + u.path.rstrip('/'))
    images = [urljoin(url, img['src']) for img in soup.select('img[src]')]
    for node in soup.select('[style]'):
        images.extend(urljoin(url, u) for u in re.findall(r'url\([\"\x27]?(.*?)[\"\x27]?\)', node['style']))
    sections = soup.select('section')
    return {'slug':slug, 'url':url, 'title':soup.title.get_text() if soup.title else slug,
            'file':str(path.relative_to(ROOT)).replace('\\','/'), 'links':list(dict.fromkeys(links)),
            'images':list(dict.fromkeys(images)), 'sections':len(sections),
            'text_length':sum(len(s.get_text()) for s in sections)}

pages, seen, queue = [], set(), [BASE + '/home']
while queue:
    batch = [u for u in queue if u not in seen]
    queue = []
    seen.update(batch)
    with ThreadPoolExecutor(max_workers=6) as pool:
        for f in as_completed([pool.submit(page,u) for u in batch]):
            p = f.result(); pages.append(p)
            print('PAGE',p['slug'],p['sections'],p['text_length'],flush=True)
            queue.extend(u for u in p['links'] if u not in seen)
    queue = list(dict.fromkeys(queue))

asset_urls = sorted(set(u for p in pages for u in p['images'] if u.startswith('http')))
def asset(url):
    r = get(url)
    mime = r.headers.get('content-type','').split(';')[0]
    if not mime.startswith('image/'):
        raise ValueError('Expected image: ' + mime)
    ext = {'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','image/svg+xml':'.svg'}.get(mime, mimetypes.guess_extension(mime) or '.img')
    path = 'assets/images/' + hashlib.sha256(r.content).hexdigest()[:20] + ext
    (ROOT/path).write_bytes(r.content)
    return {'url':url,'path':path,'bytes':len(r.content),'mime':mime}
assets, failures = {}, []
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(asset,u):u for u in asset_urls}
    for f in as_completed(futures):
        try:
            a=f.result(); assets[a['url']]=a
        except Exception as e:
            failures.append({'url':futures[f],'error':str(e)})
report = {'source':BASE,'pages':sorted(pages,key=lambda p:p['slug']), 'assets':assets,'failures':failures}
(SNAP/'inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'pages':len(pages),'image_urls':len(assets),'unique_images':len({a['path'] for a in assets.values()}),'failures':failures},ensure_ascii=True))
