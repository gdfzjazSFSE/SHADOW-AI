const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    console.log('Groq Response:', JSON.stringify(data));

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.json({ reply: 'Error: ' + JSON.stringify(data) });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ reply: 'Server error: ' + error.message });
  }
});

app.listen(3000, () => {
  console.log('Server chal raha hai: http://localhost:3000');
});