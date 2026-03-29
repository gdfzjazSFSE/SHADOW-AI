const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/chat', async (req, res) => {
  const { message, model } = req.body;

  const isAether = model === 'aether';

  const apiURL = isAether
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';

  const apiKey = isAether
    ? process.env.GEMINI_API_KEY
    : process.env.GROQ_API_KEY;

  const modelName = isAether
    ? 'gemini-2.5-pro-preview-03-25'
    : 'llama-3.3-70b-versatile';

  const systemPrompt = isAether
    ? 'You are ShadowAI powered by AETHER 5.2, the most powerful and intelligent AI assistant. Be detailed, thorough and highly capable.'
    : 'You are ShadowAI powered by JARVIS 4.6, a smart and helpful AI assistant. Be concise, confident and helpful.';

  try {
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.json({ reply: 'Error: ' + JSON.stringify(data) });
    }
  } catch (error) {
    res.status(500).json({ reply: 'Server error: ' + error.message });
  }
});

module.exports = app;

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('Server chal raha hai: http://localhost:' + PORT);
  });
}