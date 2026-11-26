(() => {
 if(document.getElementById('neuri-chat'))return;
 const base=new URL('.',document.currentScript.src),ko=document.documentElement.lang==='ko';
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('neuri-chat.css?v=1',base);document.head.append(css);
 const host=document.createElement('section');host.id='neuri-chat';host.setAttribute('aria-labelledby','neuri-title');
 host.innerHTML=`<header><span class="neuri-orb" aria-hidden="true">✧</span><div><p class="neuri-kicker">NEURAL FACE · AI CHAT</p><h2 id="neuri-title">${ko?'뉴리':'Neuri'} <span>${ko?'Neuri':'뉴리'}</span></h2></div><span class="neuri-badge">${ko?'안내 준비 중':'Getting ready'}</span></header><p class="neuri-intro">${ko?'Neural Face의 작은 대화 친구, 뉴리예요. 이곳에서 편하게 말을 걸어 주세요.':'Meet Neuri, your little conversation companion for Neural Face. Say hello right here.'}</p><div class="neuri-messages" role="log" aria-live="polite" aria-label="${ko?'뉴리와의 대화':'Conversation with Neuri'}"></div><form><label for="neuri-input">${ko?'뉴리에게 말하기':'Message Neuri'}</label><div class="neuri-compose"><input id="neuri-input" maxlength="1000" autocomplete="off" placeholder="${ko?'안녕, 뉴리!':'Hello, Neuri!'}" required><button type="submit">${ko?'보내기':'Send'} <span aria-hidden="true">↗</span></button></div><small>${ko?'전용 안내를 준비하고 있어요. 지금은 간단한 인사만 가능해요. 개인정보는 입력하지 마세요.':'Dedicated guidance is being prepared. For now, you can say hello. Please do not enter personal information.'}</small></form>`;
 const anchor=document.querySelector('.neural-scene');if(!anchor)return;anchor.insertAdjacentElement('afterend',host);
 const log=host.querySelector('[role=log]'),input=host.querySelector('input');
 const add=(text,role)=>{const p=document.createElement('p');p.className=role;p.textContent=text;log.append(p);log.scrollTop=log.scrollHeight;};
 add(ko?'안녕하세요! 저는 뉴리예요 ✨ 저만의 이야기를 준비하고 있어요. 곧 여기서 만나요!':"Hi! I’m Neuri ✨ My own conversation guide is being prepared. See you here soon!",'neuri-answer');
 host.querySelector('form').onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(!text)return;add(text,'neuri-visitor');input.value='';
 const korean=/[가-힣]/.test(text);const greeting=/^(안녕(하세요)?|반가워(요)?|hi|hello|hey)([ ,!~.✨]*(뉴리|neuri))?[!~.✨ ]*$/i.test(text);
 add(greeting?(korean?'반가워요! 뉴리예요 ✨ 잠깐 인사하러 와 주셔서 고마워요.':'Lovely to meet you! I’m Neuri ✨ Thanks for stopping by to say hello.'):(korean?'아직 전용 대화 지침을 준비하고 있어요. 준비되면 이곳에서 이야기해요 ✨':'My dedicated conversation guide is still being prepared. Let’s talk here when it’s ready ✨'),'neuri-answer');input.focus();};
})();

