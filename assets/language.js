// Preserve the current section and query when switching languages; no forced redirects.
document.querySelectorAll('.language-switch').forEach(link=>{
  link.addEventListener('click',()=>{
    const destination=new URL(link.href);
    destination.search=location.search;destination.hash=location.hash;
    link.href=destination.href;
  });
});
