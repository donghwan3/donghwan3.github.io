(() => {
 if(document.getElementById('neuri-chat'))return;
 const base=new URL('.',document.currentScript.src),ko=document.documentElement.lang==='ko';
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('neuri-chat.css?v=3',base);document.head.append(css);
 const host=document.createElement('section');host.id='neuri-chat';host.setAttribute('aria-labelledby','neuri-title');
 host.innerHTML=`<header><span class="neuri-orb" aria-hidden="true">✧</span><div><p class="neuri-kicker">NEURAL FACE · AI CHAT</p><h2 id="neuri-title">${ko?'뉴리':'Neuri'} <span>${ko?'Neuri':'뉴리'}</span></h2></div><span class="neuri-badge">${ko?'가상 캐릭터':'Virtual character'}</span></header><p class="neuri-intro">${ko?'Neural Face의 작은 대화 친구, 뉴리예요. 이곳에서 편하게 말을 걸어 주세요.':'Meet Neuri, your little conversation companion for Neural Face. Say hello right here.'}</p><div class="neuri-messages" role="log" aria-live="polite" aria-label="${ko?'뉴리와의 대화':'Conversation with Neuri'}"></div><form><label for="neuri-input">${ko?'뉴리에게 말하기':'Message Neuri'}</label><div class="neuri-compose"><input id="neuri-input" maxlength="1000" autocomplete="off" placeholder="${ko?'안녕, 뉴리!':'Hello, Neuri!'}" required><button type="submit">${ko?'보내기':'Send'} <span aria-hidden="true">↗</span></button></div><small>${ko?'화면 속 가상 캐릭터와 대화해요. 개인정보는 입력하지 마세요.':'Chat with a virtual character. Please avoid personal information.'}</small></form>`;
 const anchor=document.querySelector('.neural-intro');if(!anchor)return;anchor.append(host);
 const speechReady=import(new URL('neuri-face-speech.js?v=smile-2',base)).catch(()=>null);
 const log=host.querySelector('[role=log]'),input=host.querySelector('input');
 const add=(text,role)=>{const p=document.createElement('p');p.className=role;p.textContent=text;log.append(p);log.scrollTop=log.scrollHeight;};
 add(ko?'안녕! 나는 이 화면 속에 사는 뉴리야 ✨ 오늘은 무슨 이야기를 나눠 볼까?':"Hi! I’m Neuri, the virtual character in this screen ✨ What shall we chat about?",'neuri-answer');
 const history=[];
 const configReady=fetch(new URL('lab-chatbot-config.json',base),{cache:'no-store'}).then(r=>r.json()).then(c=>{const u=new URL(c.endpoint);if(u.protocol!=='https:')throw Error('endpoint');u.pathname='/neuri-chat';return u.href;});
 host.querySelector('form').onsubmit=async e=>{
 e.preventDefault();const text=input.value.trim(),button=host.querySelector('button');if(!text||button.disabled)return;
 add(text,'neuri-visitor');input.value='';button.disabled=true;input.disabled=true;
 const bubble=document.createElement('p');bubble.className='neuri-answer';bubble.textContent=ko?'뉴리가 생각하는 중…':'Neuri is thinking…';log.append(bubble);log.scrollTop=log.scrollHeight;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),95000);
 try{
  const endpoint=await configReady,response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:history.slice(-6)}),signal:controller.signal});
  if(!response.ok)throw Error(response.status===429?'busy':'offline');const data=await response.json();if(!data.answer)throw Error('empty');const answer=data.answer;
  history.push({role:'user',content:text},{role:'assistant',content:answer});if(history.length>6)history.splice(0,history.length-6);
  await speechReady;const duration=Math.min(10000,Math.max(2200,Array.from(answer).length*45));document.dispatchEvent(new CustomEvent('neuri-speaking',{detail:{duration}}));
  const chars=Array.from(answer),began=performance.now();await new Promise(resolve=>{const type=()=>{const progress=Math.min(1,(performance.now()-began)/duration);bubble.textContent=chars.slice(0,Math.ceil(chars.length*progress)).join('');log.scrollTop=log.scrollHeight;if(progress<1)requestAnimationFrame(type);else resolve();};type();});
 }catch(error){bubble.textContent=error.message==='busy'?(ko?'잠깐만 기다렸다 다시 말해 줄래?':'Could you try again in a moment?'):(ko?'지금은 연결이 잠깐 쉬고 있어. 조금 뒤에 다시 만나자!':'My connection is taking a break. Please try again later!');}
 finally{clearTimeout(timeout);button.disabled=false;input.disabled=false;input.focus();}
 };
})();
