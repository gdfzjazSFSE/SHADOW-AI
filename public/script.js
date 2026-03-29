async function sendMessage() {
  var input = document.getElementById('chatInput');
  var chatArea = document.getElementById('chatArea');
  if (!input || !chatArea) return;
  var message = input.value.trim();
  if (!message) return;

  chatArea.innerHTML += '<div class="msg-row user"><div class="bubble user">' + message + '</div></div>';
  input.value = '';
  input.style.height = 'auto';
  chatArea.scrollTop = chatArea.scrollHeight;

  chatArea.innerHTML += '<div class="msg-row bot" id="thinking-row"><div class="thinking"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    var response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    });
    var data = await response.json();

    var t = document.getElementById('thinking-row');
    if (t) t.remove();

    chatArea.innerHTML += '<div class="msg-row bot"><div class="bubble bot">' + data.reply + '</div></div>';
    chatArea.scrollTop = chatArea.scrollHeight;

    var hl = document.getElementById('history-list');
    if (hl) {
      var item = document.createElement('div');
      item.className = 'hist-item';
      item.textContent = message.substring(0, 32) + '...';
      hl.prepend(item);
    }

  } catch (error) {
    var t = document.getElementById('thinking-row');
    if (t) t.remove();
    chatArea.innerHTML += '<div class="msg-row bot"><div class="bubble bot">Something went wrong. Try again!</div></div>';
  }
}

function handleKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}