async function sendMessage() {
  var input = document.getElementById('userInput');
  var chatArea = document.getElementById('chatArea');
  var message = input.value.trim();
  if (!message) return;

  var welcome = document.getElementById('welcome-msg');
  if (welcome) welcome.remove();

  chatArea.innerHTML += `
    <div class="message-row user">
      <div class="bubble user">${message}</div>
    </div>`;
  input.value = '';
  input.style.height = 'auto';
  chatArea.scrollTop = chatArea.scrollHeight;

  chatArea.innerHTML += `
    <div class="message-row bot" id="thinking-row">
      <div class="thinking">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <span>ShadowAI is thinking...</span>
      </div>
    </div>`;
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    var response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    });
    var data = await response.json();

    var thinking = document.getElementById('thinking-row');
    if (thinking) thinking.remove();

    chatArea.innerHTML += `
      <div class="message-row bot">
        <div class="bubble bot">${data.reply}</div>
      </div>`;
    chatArea.scrollTop = chatArea.scrollHeight;

    var historyList = document.getElementById('history-list');
    if (historyList) {
      var item = document.createElement('div');
      item.className = 'chat-history-item';
      item.textContent = message.substring(0, 35) + '...';
      historyList.prepend(item);
    }

  } catch (error) {
    var thinking = document.getElementById('thinking-row');
    if (thinking) thinking.remove();
    chatArea.innerHTML += `
      <div class="message-row bot">
        <div class="bubble bot">❌ Something went wrong. Try again!</div>
      </div>`;
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
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}