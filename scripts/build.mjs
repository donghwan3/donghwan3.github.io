import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pagePath = slug => slug === 'home' ? 'index.html' : `${slug}.html`;
await mkdir(out, { recursive: true });
await cp(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });

function document(page, content) {
  const title = page.slug === 'home' ? site.title : `${page.label} | ${site.title}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#1c1c1c">
  <meta name="description" content="${escape(page.slug === 'home' ? site.description : page.label + ' — ' + site.title + ' Lab, KAIST.')}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(site.description)}">
  <meta property="og:type" content="website">
  <title>${escape(title)}</title>
  <link rel="icon" href="${site.logo}">
  <link rel="stylesheet" href="assets/fonts.css">
  <link rel="stylesheet" href="assets/style.css">
  <script src="assets/site.js" defer></script>
</head>
<body data-page="${page.slug}">
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="mobile-header">
    <a href="index.html" aria-label="Reinforced Decision Intelligence home"><img src="${site.logo}" alt="" width="36" height="36"><span>REDI Lab</span></a>
    <button class="menu-toggle" type="button" aria-controls="site-sidebar" aria-expanded="false" aria-label="Open navigation"><span></span><span></span><span></span></button>
  </header>
  <aside class="sidebar" id="site-sidebar" aria-label="Site navigation">
    <a class="brand" href="index.html"><img src="${site.logo}" width="42" height="42" alt="REDI Lab logo"><span>Reinforced<br>Decision<br>Intelligence</span></a>
    <nav aria-label="Main navigation">${site.navigation.map(item => `
      <a href="${pagePath(item.slug)}"${item.slug === page.slug ? ' aria-current="page"' : ''}>${escape(item.label)}</a>`).join('')}
    </nav>
  </aside>
  <button class="menu-backdrop" type="button" aria-label="Close navigation" hidden></button>
  <button class="search-toggle" type="button" aria-label="Search this site" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></button>
  <main id="main" tabindex="-1">
    ${page.slug === 'home' ? '<h1 class="visually-hidden">Reinforced Decision Intelligence Lab</h1>' : ''}
    ${content}
  </main>
  <footer class="site-footer"><span>Reinforced Decision Intelligence Lab</span><a href="#main">Back to top</a></footer>
  <dialog id="search-dialog" aria-labelledby="search-title">
    <div class="search-heading"><h2 id="search-title">Search this site</h2><button class="search-close" type="button" aria-label="Close search">×</button></div>
    <label class="visually-hidden" for="site-search">Search pages, publications and people</label>
    <input id="site-search" type="search" placeholder="Search pages, publications and people" autocomplete="off">
    <p class="search-status" aria-live="polite">Type a word or a paper title.</p>
    <div class="search-results"></div>
  </dialog>
</body>
</html>
`;
}

const search = [];
for (const page of site.navigation) {
  const content = await readFile(path.join(root, 'content/pages', `${page.slug}.html`), 'utf8');
  await writeFile(path.join(out, pagePath(page.slug)), document(page, content));
  // Keep the old /home.html route as a working alias too.
  if (page.slug === 'home') await writeFile(path.join(out, 'home.html'), document(page, content));
  search.push({ title: page.label, href: pagePath(page.slug), html: content });
}
await writeFile(path.join(out, 'assets/search-index.json'), JSON.stringify(search));
await writeFile(path.join(out, '.nojekyll'), '');
await writeFile(path.join(out, '404.html'), document({ slug:'not-found',label:'Page not found' }, '<section class="content-section"><h1>Page not found</h1><p>This page may have moved. Choose a page from the menu or return to <a href="index.html">Home</a>.</p></section>'));
console.log(`Built ${site.navigation.length} pages with local images and fonts in dist/.`);
