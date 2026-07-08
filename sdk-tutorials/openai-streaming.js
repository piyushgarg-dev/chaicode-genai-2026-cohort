import 'dotenv/config';

import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

const client = new OpenAI();

async function init() {
  const stream = await client.responses.create({
    model: 'gpt-5.5',
    input: [
      {
        role: 'user',
        content: 'Tell me story and summary of little red riding hood',
      },
    ],
    stream: true,
  });

  for await (const event of stream) {
    if (event && event.delta) process.stdout.write(event.delta);
  }
}

init();
