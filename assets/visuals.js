(() => {
  const figures=[...document.querySelectorAll('[data-motion]')];
  if(!figures.length)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const states=new Map();
  function update(figure) {
    const state=states.get(figure);
    const playing=!reduced.matches && state.visible && !document.hidden;
    figure.dataset.motionState=playing?'playing':'paused';
  }
  for(const figure of figures){
    states.set(figure,{visible:!('IntersectionObserver' in window)});
    update(figure);
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){states.get(entry.target).visible=entry.isIntersecting;update(entry.target);}
    },{rootMargin:'60px',threshold:0.05});
    figures.forEach(figure=>observer.observe(figure));
  }
  document.addEventListener('visibilitychange',()=>figures.forEach(update));
  reduced.addEventListener('change',()=>figures.forEach(update));
})();
