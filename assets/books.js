document.querySelectorAll('.book-cover-control').forEach(cover=>{
  cover.addEventListener('click',()=>cover.setAttribute('aria-pressed',String(cover.getAttribute('aria-pressed')!=='true')));
  cover.addEventListener('keydown',event=>{if(event.key==='Escape'){cover.setAttribute('aria-pressed','false');cover.blur();}});
});
