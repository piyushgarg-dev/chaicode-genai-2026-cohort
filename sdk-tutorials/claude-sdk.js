import { Anthropic } from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'], // This is the default and can be omitted
});

async function init() {
  const result = await client.messages.create({
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello, Claude' }],
    model: 'claude-opus-4-8',
  });

  for (const block of result.content) {
    if (block.type === 'text') {
      console.log(block.text);
    }
  }
}

init();
