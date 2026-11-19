"""Check the imported content against the original archived pages, not against fixtures."""
from pathlib import Path
import sys,re,json,collections
from urllib.parse import urlsplit,parse_qs
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'.tools'))
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
config=json.loads((ROOT/'content/site.json').read_text(encoding='utf8'))
def norm(text): return re.sub(r'\s+','',text)
def url(url):
 u=urlsplit(url)
 if u.hostname in ('www.google.com','google.com') and u.path=='/url':return parse_qs(u.query).get('q',[url])[0]
 return url
errors=[];report=[]
for page in config['navigation']:
 slug=page['slug']
 original=BeautifulSoup((ROOT/'source-snapshot'/f'{slug}.html').read_text(encoding='utf8'),'html.parser')
 copied=BeautifulSoup((ROOT/'content/pages'/f'{slug}.html').read_text(encoding='utf8'),'html.parser')
 for n in original.select('.PPhIP'):n.decompose()
 for n in copied.select('.video-link'):n.decompose()
 source_text=''.join(s.get_text() for s in original.select('section'))
 copied_text=''.join(s.get_text() for s in copied.select('section'))
 text_ok=norm(source_text)==norm(copied_text)
 if not text_ok:errors.append(slug+': text differs')
 source_links=collections.Counter(url(a['href']) for a in original.select('section a[href]'))
 dest_links=collections.Counter(a['href'] for a in copied.select('section a[href]'))
 if source_links!=dest_links:errors.append(slug+': links differ '+str(source_links-dest_links))
 images=len(original.select('section img'))==len(copied.select('section img'))
 videos=[urlsplit(x['src']).path for x in original.select('section iframe')]==[urlsplit(x['src']).path for x in copied.select('section iframe')]
 if not images or not videos:errors.append(slug+': media differs')
 report.append({'page':slug,'text_match':text_ok,'source_characters':len(norm(source_text)),'links':sum(source_links.values()),'images_match':images,'videos_match':videos})
(ROOT/'qa').mkdir(exist_ok=True)
(ROOT/'qa/content-verification.json').write_text(json.dumps({'pages':report,'errors':errors},indent=2),encoding='utf8')
print(json.dumps({'pages':report,'errors':errors},ensure_ascii=True))
if errors:raise SystemExit(1)
