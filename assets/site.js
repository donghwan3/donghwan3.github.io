(() => {
  const menu = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.menu-backdrop');
  function closeMenu() {
    sidebar.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    backdrop.hidden = true;
  }
  menu.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    backdrop.hidden = !open;
  });
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  const dialog = document.querySelector('#search-dialog');
  const input = document.querySelector('#site-search');
  const status = document.querySelector('.search-status');
  const results = document.querySelector('.search-results');
  let pages = null;
  let loading = null;
  async function loadIndex() {
    if (pages) return;
    if (!loading) loading = fetch('assets/search-index.json').then(r => {
      if (!r.ok) throw new Error('Search unavailable');
      return r.json();
    }).then(items => {
      pages = items.map(item => {
        const doc = new DOMParser().parseFromString(item.html, 'text/html');
        doc.querySelectorAll('p,h1,h2,h3,h4,li').forEach(node => node.append(' '));
        return { title:item.title, href:item.href, text:doc.body.textContent.replace(/\s+/g, ' ').trim() };
      });
    }).catch(error => { loading = null; throw error; });
    await loading;
  }
  async function search() {
    const q = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!q) { status.textContent = 'Type a word or a paper title.'; return; }
    try { await loadIndex(); } catch { status.textContent = 'Search could not load. Please use the page menu or try again.'; return; }
    if (q !== input.value.trim().toLocaleLowerCase()) return;
    const words = q.split(/\s+/);
    const matches = pages.filter(p => words.every(word => (p.title+' '+p.text).toLocaleLowerCase().includes(word)));
    status.textContent = matches.length ? `${matches.length} page${matches.length === 1 ? '' : 's'} found.` : 'No matching pages found.';
    for (const page of matches) {
      const a = document.createElement('a'); a.href = page.href;
      const title = document.createElement('strong'); title.textContent = page.title;
      const p = document.createElement('p');
      const start = Math.max(0, page.text.toLocaleLowerCase().indexOf(words[0]) - 70);
      p.textContent = (start ? '…' : '') + page.text.slice(start, start + 240) + (start + 240 < page.text.length ? '…' : '');
      a.append(title, p); results.append(a);
    }
  }
  document.querySelector('.search-toggle').addEventListener('click', () => { closeMenu(); dialog.showModal(); input.focus(); });
  document.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box=dialog.getBoundingClientRect(); if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) dialog.close(); } });
  input.addEventListener('input', search);
})();
