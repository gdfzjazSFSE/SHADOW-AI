var chatHistory=JSON.parse(localStorage.getItem('sai_hist')||'[]');
var isDark=localStorage.getItem('sai_theme')!=='light';
var currentLang=localStorage.getItem('sai_lang')||'en';
var currentFileContent='';
var isListening=false;
var recognition=null;
var isSpeaking=false;

var T={
  en:{placeholder:'Message SHADOW AI...',thinking:'JARVIS is thinking...',error:'Something went wrong!',hint:'SHADOW AI — JARVIS 4.6 — POWERED BEYOND EXPECTATIONS'},
  hi:{placeholder:'SHADOW AI se poochho...',thinking:'JARVIS soch raha hai...',error:'Kuch gadbad ho gayi!',hint:'SHADOW AI — JARVIS 4.6'},
  es:{placeholder:'Pregunta a SHADOW AI...',thinking:'JARVIS está pensando...',error:'Algo salió mal!',hint:'SHADOW AI — JARVIS 4.6'},
  fr:{placeholder:'Demandez à SHADOW AI...',thinking:'JARVIS réfléchit...',error:'Quelque chose a mal tourné!',hint:'SHADOW AI — JARVIS 4.6'},
  ar:{placeholder:'اسأل SHADOW AI...',thinking:'JARVIS يفكر...',error:'حدث خطأ ما!',hint:'SHADOW AI — JARVIS 4.6'},
  zh:{placeholder:'询问 SHADOW AI...',thinking:'JARVIS 正在思考...',error:'出了点问题！',hint:'SHADOW AI — JARVIS 4.6'}
};

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

function setLang(lang){
  currentLang=lang;
  localStorage.setItem('sai_lang',lang);
  var t=T[lang]||T.en;
  var inp=document.getElementById('chatInput');
  if(inp)inp.placeholder=t.placeholder;
  var hint=document.getElementById('hintText');
  if(hint)hint.textContent=t.hint;
  var sel=document.getElementById('langSelect');
  if(sel)sel.value=lang;
}

// VOICE INPUT
function toggleVoice(){
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){
    alert('Use Chrome for voice!');return;
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
    if(btn)btn.classList.add('recording');
    if(btn)btn.textContent='⏹';
  };
  recognition.onresult=(e)=>{
    var txt=e.results[0][0].transcript;
    var inp=document.getElementById('chatInput');
    if(inp){inp.value=txt;autoResize(inp);}
  };
  recognition.onend=()=>{
    isListening=false;
    var btn=document.getElementById('voiceBtn');
    if(btn)btn.classList.remove('recording');
    if(btn)btn.textContent='🎤';
  };
  recognition.start();
}

// VOICE OUTPUT (TTS)
function speakText(text){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var utt=new SpeechSynthesisUtterance(text);
  var langMap={en:'en-US',hi:'hi-IN',es:'es-ES',fr:'fr-FR',ar:'ar-SA',zh:'zh-CN'};
  utt.lang=langMap[currentLang]||'en-US';
  utt.rate=1;utt.pitch=1;
  window.speechSynthesis.speak(utt);
}

// FILE READING
function handleFile(input){
  var file=input.files[0];
  if(!file)return;
  var reader=new FileReader();
  var icon='📄';
  if(file.name.endsWith('.pdf'))icon='📕';
  else if(file.name.endsWith('.csv'))icon='📊';
  else if(file.name.endsWith('.js')||file.name.endsWith('.py')||file.name.endsWith('.html'))icon='💻';
  else if(file.name.endsWith('.json'))icon='🔧';

  reader.onload=function(e){
    currentFileContent=e.target.result;
    var chatArea=document.getElementById('chatArea');
    if(chatArea){
      chatArea.innerHTML+='<div class="msg-row user"><div class="file-bubble"><span class="file-icon">'+icon+'</span><div><div style="font-size:13px;color:#aaa;font-weight:500">'+file.name+'</div><div style="font-size:11px;color:#555">'+Math.round(file.size/1024)+' KB — Ready to analyze</div></div></div></div>';
      chatArea.scrollTop=chatArea.scrollHeight;
    }
    var inp=document.getElementById('chatInput');
    if(inp){inp.placeholder='Ask about '+file.name+'...';inp.focus();}
  };
  reader.readAsText(file);
  input.value='';
}

// HISTORY
function saveHistory(msg,reply){
  chatHistory.push({msg,reply,time:Date.now()});
  if(chatHistory.length>50)chatHistory.shift();
  localStorage.setItem('sai_hist',JSON.stringify(chatHistory));
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
      if(ca)ca.innerHTML='<div class="msg-row user"><div class="bubble user">'+h.msg+'</div></div><div class="msg-row bot"><div class="bubble bot">'+h.reply+'<button class="speak-btn" onclick="speakText(\''+h.reply.replace(/'/g,"\\'").substring(0,200)+'\')">🔊</button></div></div>';
    };
    hl.appendChild(d);
  });
}

function clearHistory(){
  chatHistory=[];
  localStorage.removeItem('sai_hist');
  renderHistory();
  newChat();
}

// SEND
async function sendMessage(){
  var input=document.getElementById('chatInput');
  var chatArea=document.getElementById('chatArea');
  if(!input||!chatArea)return;
  var message=input.value.trim();
  if(!message)return;
  var t=T[currentLang]||T.en;

  var fullMsg=message;
  if(currentFileContent){
    fullMsg='File content:\n'+currentFileContent.substring(0,3000)+'\n\nUser question: '+message;
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
    chatArea.innerHTML+='<div class="msg-row bot"><div class="bubble bot">'+reply+'<button class="speak-btn" onclick="speakText(this.parentElement.textContent)">🔊</button></div></div>';
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
function newChat(){var ca=document.getElementById('chatArea');if(ca)ca.innerHTML='';currentFileContent='';}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,150)+'px';}

window.onload=function(){
  applyTheme();
  renderHistory();
  setLang(currentLang);
};