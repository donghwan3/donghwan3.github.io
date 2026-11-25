(() => {
  const siteRoot = new URL('../', document.currentScript.src);
  const korean = document.documentElement.lang === 'ko';
  const text=(en,ko)=>korean?ko:en;
  const menu = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.site-nav');
  const backdrop = document.querySelector('.menu-backdrop');
  const resourceMenu = document.querySelector('.resource-menu');
  const mobile = matchMedia('(max-width: 1280px)');
  const main = document.querySelector('main');
  const footer = document.querySelector('.site-footer');
  function closeMenu() {
    sidebar.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', text('Open navigation','메뉴 열기'));
    backdrop.hidden = true;
    main.removeAttribute('inert');
    footer.removeAttribute('inert');
    main.removeAttribute('aria-hidden');
    footer.removeAttribute('aria-hidden');
    document.body.style.overflow = '';
  }
  menu.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? text('Close navigation','메뉴 닫기') : text('Open navigation','메뉴 열기'));
    backdrop.hidden = !open;
    main.toggleAttribute('inert', open);
    footer.toggleAttribute('inert', open);
    if (open) { main.setAttribute('aria-hidden', 'true'); footer.setAttribute('aria-hidden', 'true'); }
    else { main.removeAttribute('aria-hidden'); footer.removeAttribute('aria-hidden'); }
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) resourceMenu.open = true;
  });
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (sidebar.classList.contains('open')) { closeMenu(); menu.focus(); }
      if (!mobile.matches && resourceMenu.open) { resourceMenu.open = false; resourceMenu.querySelector('summary').focus(); }
    }
    if (event.key === 'Tab' && sidebar.classList.contains('open')) {
      const links = [...document.querySelectorAll('.site-header a,.site-header button')].filter(el => el.getClientRects().length);
      const first = links[0], last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function adaptNavigation() { closeMenu(); resourceMenu.open = mobile.matches; }
  mobile.addEventListener('change', adaptNavigation);
  adaptNavigation();
  document.addEventListener('click', event => {
    if (!mobile.matches && !resourceMenu.contains(event.target)) resourceMenu.open = false;
  });
  sidebar.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  const dialog = document.querySelector('#search-dialog');
  const input = document.querySelector('#site-search');
  const status = document.querySelector('.search-status');
  const results = document.querySelector('.search-results');
  let pages = null;
  let loading = null;
  async function loadIndex() {
    if (pages) return;
    if (!loading) loading = fetch(new URL(korean?'assets/search-index.ko.json':'assets/search-index.json',siteRoot)).then(r => {
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
    if (!q) { status.textContent = text('Type a word or a paper title.','검색어 또는 논문 제목을 입력하세요.'); return; }
    try { await loadIndex(); } catch { status.textContent = text('Search could not load. Please use the page menu or try again.','검색을 불러오지 못했습니다. 메뉴를 이용하거나 다시 시도해 주세요.'); return; }
    if (q !== input.value.trim().toLocaleLowerCase()) return;
    const words = q.split(/\s+/);
    const matches = pages.filter(p => words.every(word => (p.title+' '+p.text).toLocaleLowerCase().includes(word)));
    status.textContent = matches.length ? (korean?`${matches.length}개 페이지를 찾았습니다.`:`${matches.length} page${matches.length === 1 ? '' : 's'} found.`) : text('No matching pages found.','일치하는 페이지가 없습니다.');
    for (const page of matches) {
      const a = document.createElement('a'); a.href = new URL(page.href,siteRoot);
      const title = document.createElement('strong'); title.textContent = page.title;
      const p = document.createElement('p');
      const start = Math.max(0, page.text.toLocaleLowerCase().indexOf(words[0]) - 70);
      p.textContent = (start ? '…' : '') + page.text.slice(start, start + 240) + (start + 240 < page.text.length ? '…' : '');
      a.append(title, p); results.append(a);
    }
  }
  const searchToggle = document.querySelector('.search-toggle');
  searchToggle.addEventListener('click', () => { closeMenu(); if (!mobile.matches) resourceMenu.open = false; dialog.showModal(); input.focus(); });
  document.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => searchToggle.focus());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box=dialog.getBoundingClientRect(); if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) dialog.close(); } });
  input.addEventListener('input', search);
})();
