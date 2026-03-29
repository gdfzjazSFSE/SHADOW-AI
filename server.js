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
  const { message } = req.body;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are ShadowAI, a smart and helpful AI assistant. Always respond in English. Be concise, confident and helpful.' },
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