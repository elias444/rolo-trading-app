const fetch = require("node-fetch");

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const userMessage = body.message || "Hello from Rolo AI";

  const apiKey = process.env.rolo_ai_key;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const messages = [
    {
      role: "system",
      content:
        "You are Rolo AI, a friendly and smart stock assistant. You analyze market trends, offer trading insight, reply casually like you’re chatting in a sleek iPhone app, and provide confidence-based recommendations when asked."
    },
    {
      role: "user",
      content: userMessage
    }
  ];

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: messages,
        temperature: 0.85
      })
    });

    const result = await response.json();
    const reply = result.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply })
    };
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Oops, Rolo hit a snag reaching ChatGPT." })
    };
  }
};
