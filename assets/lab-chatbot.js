(() => {
  if (document.getElementById('lab-chat-launch')) return;
  const base = new URL('.', document.currentScript.src);
  const css = document.createElement('link'); css.rel='stylesheet'; css.href=new URL('lab-chatbot.css',base); document.head.append(css);
  const host=document.createElement('div'); host.id='lab-chat';
  host.innerHTML='<button id="lab-chat-launch" aria-expanded="false" aria-controls="lab-chat-panel"><img class="lab-chat-mascot" alt="" aria-hidden="true"><span>✦ 레디봇 · 연구실 챗봇</span></button><section id="lab-chat-panel" aria-label="레디봇 · 연구실 AI 챗봇" hidden><header><img class="lab-chat-robot" alt="웃는 연구실 로봇"><div><strong>레디봇 · 연구실 AI 챗봇</strong><small>LAB ASSISTANT · 연구실 안내와 가벼운 대화</small></div><button type="button" id="lab-chat-close" aria-label="닫기">×</button></header><div id="lab-chat-messages" role="log" aria-live="polite"></div><form><label for="lab-chat-input">연구실에 궁금한 점</label><div class="lab-chat-compose"><input id="lab-chat-input" maxlength="1000" autocomplete="off" placeholder="연구 분야나 지원 방법을 물어보세요" required><button type="submit">전송</button></div><small>개인정보를 입력하지 마세요. 연구실 안내와 짧은 인사·잡담을 도와드려요.</small></form></section>';
  host.querySelectorAll('.lab-chat-robot,.lab-chat-mascot').forEach(img=>img.src=new URL('lab-robot.svg',base));
  document.body.append(host);
  const panel=host.querySelector('section'), launch=host.querySelector('#lab-chat-launch'), input=host.querySelector('input'), form=host.querySelector('form'), send=form.querySelector('button'), log=host.querySelector('[role=log]');
  const add=(text,role='assistant')=>{const p=document.createElement('p');p.className=role;p.textContent=text;log.append(p);log.scrollTop=log.scrollHeight;return p;};
  add('안녕하세요, 연구실 챗봇 레디봇이에요 🤖 연구실 소개·연구·구성원·지원·연락처에 관해 질문해 주세요. 가벼운 인사도 좋아요! / Ask about our lab or say hello!');
  const toggle=open=>{panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));(open?input:launch).focus();};
  launch.onclick=()=>toggle(panel.hidden);host.querySelector('#lab-chat-close').onclick=()=>toggle(false);
  host.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false);});
  let endpoint='';
  const ready=fetch(new URL('lab-chatbot-config.json',base),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(c=>{
    if(c.endpoint){const u=new URL(c.endpoint);if(u.protocol==='https:')endpoint=u.href;}
    if(['localhost','127.0.0.1'].includes(location.hostname))endpoint=location.origin+'/chat';
  }).catch(()=>{});
  form.onsubmit=async e=>{
    e.preventDefault();const message=input.value.trim();if(!message||send.disabled)return;
    add(message,'visitor');input.value='';send.disabled=true;input.disabled=true;
    const status=add('확인 중입니다…');const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),100000);
    try{
      await ready;
      if(!endpoint){status.textContent='연구실 챗봇 연결을 준비 중입니다. 잠시 후 다시 방문해 주세요.';return;}
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),signal:controller.signal});
      if(!r.ok)throw Error(r.status===429?'busy':'offline');
      const data=await r.json();status.textContent=data.answer||'답변을 확인할 수 없습니다.';
      for(const source of data.sources||[]){const url=new URL(source);if(url.origin!=='https://donghwan3.github.io')continue;const a=document.createElement('a');a.href=url.href;a.textContent='Contact / Website ↗';a.target='_blank';a.rel='noopener noreferrer';status.append(document.createElement('br'),a);}
    }catch(err){status.textContent=err.message==='busy'?'다른 질문에 답변 중입니다. 잠시 후 다시 시도해 주세요.':'현재 안내 서버에 연결할 수 없습니다. 홈페이지 연락처로 문의해 주세요.';}
    finally{clearTimeout(timer);send.disabled=false;input.disabled=false;if(!panel.hidden)input.focus();log.scrollTop=log.scrollHeight;}
  };
})();