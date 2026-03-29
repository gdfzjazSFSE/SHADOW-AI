var chatHistory=JSON.parse(localStorage.getItem('sai_hist')||'[]');
var isDark=localStorage.getItem('sai_theme')!=='light';
var currentLang=localStorage.getItem('sai_lang')||'en';
var currentFileContent='';
var isListening=false;
var recognition=null;
var currentChatLog=[];

var T={
  en:{placeholder:'Message SHADOW AI...',thinking:'JARVIS is thinking...',error:'Something went wrong!',hint:'Enter to send • Shift+Enter new line • Ctrl+K clear'},
  hi:{placeholder:'SHADOW AI se poochho...',thinking:'JARVIS soch raha hai...',error:'Kuch gadbad ho gayi!',hint:'Enter bhejo • Shift+Enter nai line • Ctrl+K clear'},
  es:{placeholder:'Pregunta a SHADOW AI...',thinking:'JARVIS está pensando...',error:'Algo salió mal!',hint:'Enter enviar • Shift+Enter nueva línea'},
  fr:{placeholder:'Demandez à SHADOW AI...',thinking:'JARVIS réfléchit...',error:'Quelque chose a mal tourné!',hint:'Entrée envoyer • Shift+Entrée nouvelle ligne'},
  ar:{placeholder:'اسأل SHADOW AI...',thinking:'JARVIS يفكر...',error:'حدث خطأ ما!',hint:'Enter للإرسال'},
  zh:{placeholder:'询问 SHADOW AI...',thinking:'JARVIS 正在思考...',error:'出了点问题！',hint:'Enter 发送 • Shift+Enter 换行'}
};

// MARKED CONFIG
if(typeof marked!=='undefined'){
  marked.setOptions({breaks:true,gfm:true});
}

function renderMarkdown(text){
  if(typeof marked==='undefined')return text;
  try{
    var html=marked.parse(text);
    return html;
  }catch(e){return text;}
}

function highlightCode(){
  if(typeof hljs!=='undefined'){
    document.querySelectorAll('pre code').forEach(block=>{
      hljs.highlightElement(block);
    });
  }
}

// TYPING ANIMATION
function typeText(element, text, speed){
  return new Promise(resolve=>{
    var html=renderMarkdown(text);
    var i=0;
    var chars=text.split('');
    element.innerHTML='';
    element.classList.add('typing-cursor');
    function type(){
      if(i<chars.length){
        element.innerHTML=renderMarkdown(chars.slice(0,i+1).join(''));
        i++;
        setTimeout(type, speed||8);
      } else {
        element.classList.remove('typing-cursor');
        highlightCode();
        resolve();
      }
    }
    type();
  });
}

// THEME
function applyTheme(){
  document.body.classList.toggle('light',!isDark);
  var btn=document.getElementById('themeBtn');
  if(btn)btn.textContent=isDark?'🌙':'☀️';
}

function toggleTheme(){
  isDark=!isDark;
  localStorage.setItem('sai_theme',isDark?'dark':'light');
  applyTheme();
}

// LANGUAGE
function setLang(lang){
  currentLang=lang;
  localStorage.setItem('sai_lang',lang);
  var t=T[lang]||T.en;
  var inp=document.getElementById('chatInput');
  if(inp)inp.placeholder=t.placeholder;
  var hint=document.getElementById('hintText');
  if(hint)hint.textContent=t.hint+' • SHADOW AI — JARVIS 4.6';
  var sel=document.getElementById('langSelect');
  if(sel)sel.value=lang;
}

// VOICE INPUT
function toggleVoice(){
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){
    alert('Use Chrome for voice input!');return;
  }
  if(isListening){recognition.stop();return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  var langMap={en:'en-US',hi:'hi-IN',es:'es-ES',fr:'fr-FR',ar:'ar-SA',zh:'zh-CN'};
  recognition.lang=langMap[currentLang]||'en-US';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.onstart=()=>{
    isListening=true;
    var btn=document.getElementById('voiceBtn');
    if(btn){btn.classList.add('recording');btn.textContent='⏹';}
  };
  recognition.onresult=(e)=>{
    var txt=e.results[0][0].transcript;
    var inp=document.getElementById('chatInput');
    if(inp){inp.value=txt;autoResize(inp);}
  };
  recognition.onend=()=>{
    isListening=false;
    var btn=document.getElementById('voiceBtn');
    if(btn){btn.classList.remove('recording');btn.textContent='🎤';}
  };
  recognition.start();
}

// VOICE OUTPUT
function speakText(text){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var clean=text.replace(/<[^>]*>/g,'').replace(/[#*`]/g,'');
  var utt=new SpeechSynthesisUtterance(clean.substring(0,500));
  var langMap={en:'en-US',hi:'hi-IN',es:'es-ES',fr:'fr-FR',ar:'ar-SA',zh:'zh-CN'};
  utt.lang=langMap[currentLang]||'en-US';
  utt.rate=1;utt.pitch=1;
  window.speechSynthesis.speak(utt);
}

// COPY TEXT
function copyText(text){
  var clean=text.replace(/<[^>]*>/g,'');
  navigator.clipboard.writeText(clean).then(()=>{
    alert('Copied!');
  });
}

// FILE READING
function handleFile(input){
  var file=input.files[0];
  if(!file)return;
  var icon='📄';
  if(file.name.endsWith('.pdf'))icon='📕';
  else if(file.name.endsWith('.csv'))icon='📊';
  else if(file.name.endsWith('.js')||file.name.endsWith('.py'))icon='💻';
  else if(file.name.endsWith('.json'))icon='🔧';
  else if(file.name.endsWith('.md'))icon='📝';

  var reader=new FileReader();
  reader.onload=function(e){
    currentFileContent=e.target.result;
    var chatArea=document.getElementById('chatArea');
    if(chatArea){
      chatArea.innerHTML+='<div class="msg-row user"><div class="file-bubble"><span style="font-size:20px">'+icon+'</span><div><div style="font-size:13px;color:#aaa;font-weight:500">'+file.name+'</div><div style="font-size:11px;color:#555">'+Math.round(file.size/1024)+' KB — Ready to analyze</div></div></div></div>';
      chatArea.scrollTop=chatArea.scrollHeight;
    }
    var inp=document.getElementById('chatInput');
    if(inp){inp.placeholder='Ask about '+file.name+'...';inp.focus();}
  };
  reader.readAsText(file);
  input.value='';
}

// EXPORT CHAT
function exportChat(){
  if(currentChatLog.length===0){alert('No chat to export!');return;}
  var txt='SHADOW AI — JARVIS 4.6\nExported: '+new Date().toLocaleString()+'\n\n';
  currentChatLog.forEach(c=>{
    txt+='You: '+c.user+'\n\nJARVIS: '+c.bot.replace(/<[^>]*>/g,'')+'\n\n---\n\n';
  });
  var blob=new Blob([txt],{type:'text/plain'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='shadowai-chat-'+Date.now()+'.txt';
  a.click();
}

// HISTORY
function saveHistory(msg,reply){
  chatHistory.push({msg,reply,time:Date.now()});
  if(chatHistory.length>50)chatHistory.shift();
  localStorage.setItem('sai_hist',JSON.stringify(chatHistory));
  currentChatLog.push({user:msg,bot:reply});
  renderHistory();
}

function renderHistory(){
  var hl=document.getElementById('history-list');
  if(!hl)return;
  hl.innerHTML='';
  chatHistory.slice(-10).reverse().forEach((h,i)=>{
    var d=document.createElement('div');
    d.className='hist-item';
    d.textContent=h.msg.substring(0,28)+'...';
    d.onclick=()=>{
      var ca=document.getElementById('chatArea');
      if(ca){
        ca.innerHTML='<div class="msg-row user"><div class="bubble user">'+h.msg+'</div></div>'+
        '<div class="msg-row bot"><div class="bubble bot">'+renderMarkdown(h.reply)+'</div>'+
        '<div class="bot-actions"><button class="bot-act-btn" onclick="speakText(\''+h.reply.replace(/'/g,"\\'").substring(0,200)+'\')">🔊 Speak</button>'+
        '<button class="bot-act-btn" onclick="copyText(\''+h.reply.replace(/'/g,"\\'").substring(0,500)+'\')">📋 Copy</button></div></div>';
        highlightCode();
      }
    };
    hl.appendChild(d);
  });
}

function clearHistory(){
  if(!confirm('Clear all history?'))return;
  chatHistory=[];currentChatLog=[];
  localStorage.removeItem('sai_hist');
  renderHistory();newChat();
}

// SEND MESSAGE
async function sendMessage(){
  var input=document.getElementById('chatInput');
  var chatArea=document.getElementById('chatArea');
  if(!input||!chatArea)return;
  var message=input.value.trim();
  if(!message)return;
  var t=T[currentLang]||T.en;

  var fullMsg=message;
  if(currentFileContent){
    fullMsg='Analyze this file content:\n\n'+currentFileContent.substring(0,3000)+'\n\nQuestion: '+message;
  }

  chatArea.innerHTML+='<div class="msg-row user"><div class="bubble user">'+message+'</div></div>';
  input.value='';input.style.height='auto';
  chatArea.scrollTop=chatArea.scrollHeight;

  chatArea.innerHTML+='<div class="msg-row bot" id="thinking-row"><div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span class="think-txt">'+t.thinking+'</span></div></div>';
  chatArea.scrollTop=chatArea.scrollHeight;

  try{
    var res=await fetch('/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:fullMsg})
    });
    var data=await res.json();
    var tr=document.getElementById('thinking-row');
    if(tr)tr.remove();

    var reply=data.reply||t.error;

    var botDiv=document.createElement('div');
    botDiv.className='msg-row bot';
    var bubbleDiv=document.createElement('div');
    bubbleDiv.className='bubble bot';
    var actionsDiv=document.createElement('div');
    actionsDiv.className='bot-actions';
    actionsDiv.innerHTML='<button class="bot-act-btn" onclick="speakText(this.closest(\'.msg-row\').querySelector(\'.bubble\').textContent)">🔊 Speak</button>'+
      '<button class="bot-act-btn" onclick="copyText(this.closest(\'.msg-row\').querySelector(\'.bubble\').innerHTML)">📋 Copy</button>'+
      '<button class="bot-act-btn" onclick="exportChat()">💾 Export</button>';
    botDiv.appendChild(bubbleDiv);
    botDiv.appendChild(actionsDiv);
    chatArea.appendChild(botDiv);
    chatArea.scrollTop=chatArea.scrollHeight;

    await typeText(bubbleDiv,reply,6);
    chatArea.scrollTop=chatArea.scrollHeight;

    currentFileContent='';
    var inp2=document.getElementById('chatInput');
    if(inp2)inp2.placeholder=t.placeholder;
    saveHistory(message,reply);

  }catch(e){
    var tr=document.getElementById('thinking-row');
    if(tr)tr.remove();
    chatArea.innerHTML+='<div class="msg-row bot"><div class="bubble bot">'+t.error+'</div></div>';
  }
}

function handleChatKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}
function handleLandingKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();startFromLanding();}}
function newChat(){var ca=document.getElementById('chatArea');if(ca)ca.innerHTML='';currentFileContent='';currentChatLog=[];}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,150)+'px';}

window.onload=function(){
  applyTheme();
  renderHistory();
  setLang(currentLang);
};