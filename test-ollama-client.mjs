import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // Required but unused
});

console.log('Testing Ollama OpenAI-compatible API...');
console.log('BaseURL: http://localhost:11434/v1');
console.log('Model: qwen2.5-coder:7b');

try {
  const response = await client.chat.completions.create({
    model: 'qwen2.5-coder:7b',
    messages: [
      {
        role: 'user',
        content: 'Write a simple hello function in TypeScript. Max 10 lines.',
      },
    ],
    max_tokens: 100,
    temperature: 0.7,
    stream: false,
  });

  console.log('\n✅ SUCCESS!');
  console.log('Response:', response.choices[0].message.content);
  console.log('Usage:', response.usage);
} catch (error) {
  console.error('\n❌ ERROR!');
  console.error('Error message:', error.message);
  console.error('Error details:', error);
}

