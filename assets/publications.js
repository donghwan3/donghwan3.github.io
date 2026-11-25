(() => {
  const form = document.querySelector('#publication-filters');
  if (!form) return;
  const fields = ['q','year','topic','type'].map(name=>form.elements.namedItem(name));
  const papers = [...document.querySelectorAll('[data-publication]')];
  const groups = [...document.querySelectorAll('[data-publication-group]')];
  const status = document.querySelector('.publication-status');
  const empty = document.querySelector('.publication-empty');
  const korean = document.documentElement.lang === 'ko';
  const normalize = text => text.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
  const searchable = new Map(papers.map(p=>[p,normalize(p.dataset.search)]));
  function filter() {
    const [query,year,topic,type] = fields.map(field=>field.value.trim());
    const words = normalize(query).split(' ').filter(Boolean);
    const active = Boolean(query || year || topic || type);
    let count = 0;
    for (const paper of papers) {
      const matches = words.every(word=>searchable.get(paper).includes(word)) && (!year || paper.dataset.year===year)
        && (!topic || paper.dataset.topics.split(' ').includes(topic)) && (!type || paper.dataset.types.split(' ').includes(type));
      paper.hidden = !matches;
      if (matches) count++;
    }
    for (const group of groups) {
      group.hidden = group.dataset.publicationGroup==='Selected Highlights' ? active : !group.querySelector('[data-publication]:not([hidden])');
    }
    document.querySelectorAll('.page-index a').forEach(link=>{
      const target = document.getElementById(link.hash.slice(1));
      link.hidden = Boolean(target?.closest('[data-publication-group]')?.hidden);
    });
    status.textContent = korean ? (active?`전체 ${papers.length}편 중 ${count}편이 검색되었습니다.`:`논문 ${papers.length}편 · 아래에 주요 연구도 함께 표시합니다.`) : (active ? `${count} of ${papers.length} publications match.` : `${papers.length} publications · highlights are also shown below.`);
    empty.hidden = count!==0;
  }
  form.hidden = false;
  form.addEventListener('input',filter);
  form.addEventListener('change',filter);
  form.addEventListener('submit',event=>{event.preventDefault();filter();});
  form.addEventListener('reset',()=>{for (const field of fields) field.value='';filter();fields[0].focus();});
  filter();
})();
