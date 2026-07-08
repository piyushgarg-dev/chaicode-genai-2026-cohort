import 'dotenv/config';

import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

const client = new OpenAI();

const RiskSchema = z.object({
  title: z.string().describe('the actual title for risk'),
  tags: z.array(z.string()).describe('3-4 tags for this risk'),
  score: z.number().min(1).max(5).describe('risk level out of 5'),
});

const outputSchema = z.object({
  risks: z.array(RiskSchema).describe('array of risks'),
});

async function init() {
  const result = await client.responses.parse({
    model: 'gpt-4.1-mini',
    text: {
      format: zodTextFormat(outputSchema, 'risks'),
    },
    input: `
      Extract the risks from the following document

      Document:
      Our company recently launched a new software platform. 
      The platform relies on several third-party APIs that may experience downtime. 
      In addition, we are storing customer data in the cloud, and there are strict 
      regulatory requirements regarding data privacy and protection. 
      Some features are still in beta and could potentially introduce bugs 
      that affect user experience. 

      Please list any risks you find in the document above.
    `,
  });
  console.log(result.output_parsed);
}

init();
