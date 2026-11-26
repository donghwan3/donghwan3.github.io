// Preserve the current section and query when switching languages; no forced redirects.
document.querySelectorAll('.language-switch').forEach(link=>{
  link.addEventListener('click',()=>{
    const destination=new URL(link.href);
    destination.search=location.search;destination.hash=location.hash;
    link.href=destination.href;
  });
});

// REDI lab assistant: available from every page using this shared script.
(() => {
 if (document.body.dataset.page === 'neural-face') {
 const script=document.createElement('script'); script.src=new URL('neuri-chat.js?v=2',document.currentScript.src); document.head.append(script); return;
 }
 if (document.querySelector('script[data-redi-chat]') || document.querySelector('script[src*="lab-chatbot.js"]')) return;
 const base = new URL('.', document.currentScript.src);
 const script=document.createElement('script');
 script.src=new URL('lab-chatbot.js?v=redi-20261126b',base); script.dataset.rediChat='true';
 document.head.append(script);
})();
