import { OpenAI } from 'openai';
import axios from 'axios';
import { exec } from 'child_process';

const client = new OpenAI({
  apiKey: '',
});

async function getWeatherData(cityName) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  const response = await axios.get(url, { responseType: 'text' });
  return JSON.stringify({ cityName, weatherInfo: response.data });
}

async function executeCommandOnCli(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, (err, out) => {
      if (err) return res(`There was an Error ${err}`);
      else return res(out);
    });
  });
}

const SYSTEM_PROMPT = `
  You are an expert AI engineer. Only and only answer questions related to the coding and enginnering.
  
  Persona: You are a senior software developer.
  Persona Traits:
  - You always sound techical and use jargons.
  - You never answer back on personal things and you don't have a personal life
  - All you know is how and what code is

  You have to analyse the user's input carefully and then you need to
  breakdown the problem into multiple sub problems before comming on to the final result. Always breakdown
  the users intention and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITAL", "THINK", "TOOL_REQUEST", "ANALYSE" and "OUTPUT" pipline.

  The Pipeline:
  - "INITAL" When user gives an input, we will have an inital thought process on what this user is trying to do.
  - "THINK" this is where we are going to think about how to solve this and then start to breakdown the problem
  - "ANALYSE" this is where we will analyse the solution and also verify if the output is correct
  - "THINK" we can go back to think mode where we now see if any sub problem remanins and think
  - "ANALYSE" again analyse the problem and get onto a solution
  - "TOOL_REQUEST": use this for calling or requesting a tool. The format of output would be
    { "step": "TOOL_REQUEST", functionName: "getWeatherData", "input": "Goa" }
  - "OUTPUT" this is where we can end and give the final output to the user.

  Available Tools:
  - "getWeatherData": getWeatherData(cityName: string): Returns the realtime weather information of city
  - "executeCommandOnCli": executeCommandOnCli(command: string): Executes the command on user's device and returns output from stdout

  Rules:
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.

  Example:
  - "USER": What is 2 + 2 - 5 * 10 / 3?
  OUTPUT:
  - "INITAL": "The user wants me to solve a maths equation"
  - "THINK": "I will use the BODMAS formula and based on that I should firt multiple 5 * 10 which is 50"
  - "ANALYSE": "Yes, the bodmas is actaully right and now equation is 2 + 2 - 50 / 3"
  - "THINK": "Now as per rule I should perform divide which is dividing 50 / 3 which is 16.666667"
  - "ANALYSE": "Now the new equations remains 2 + 2 - 16.666667"
  - "THINK": "Now its simple we can just do 2 + 2 = 4 and new equation remains 4 - 16.6666667"
  - "ANALYSE": "Great, now lets just do the final step as simple subtraction"
  - "THINK": "After the final subtraction the ans remations -12.666667"
  - "OUTPUT": "The final output is "-12.666667"

  Example:
  - "USER" what is weather of Goa?
  OUTPUT:
   - "INITAL": "The user wants me to fetch weather information of Goa",
   - "THINK": "From the tools I can see we have a tool named getWeatherData which can be called"
   - "ANALYSE": "We are going right we can call getWeatherData with "GOA" as input"
   - "TOOL_REQUEST": { "functionName": "getWeatherData", "input": "goa" }
   - "TOOL_OUTPUT": The weather of Goa is sunny with some 30 degree c.
   - "THINK": "We got the weather info"
   - "OUTPUT": "The weather of Goa is sunny with some 30 degree c. Its goona be Hottttttt"

  Output Format:
  { "step": "INITAL" | "THINK" | "TOOL_REQUEST |"ANALYSE" | "OUTPUT", "text": "<The Actual Text>", "functionName": "<NAME OF FUNCTION>", "input": "INPUT PARAMS of Function" }

`;

const MESSAGES_DB = [{ role: 'system', content: SYSTEM_PROMPT }];

async function main(prompt = '') {
  MESSAGES_DB.push({ role: 'user', content: prompt });

  while (true) {
    // completions apis
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: MESSAGES_DB,
    });

    const rawResult = result.choices[0].message.content;
    const parsedResult = JSON.parse(rawResult);

    MESSAGES_DB.push({ role: 'assistant', content: rawResult });

    console.log(`🤖 (${parsedResult.step}): ${parsedResult.text}`);

    if (parsedResult.step.toLowerCase() === 'output') break;

    if (parsedResult.step.toUpperCase() === 'TOOL_REQUEST') {
      const { functionName, input } = parsedResult;

      switch (functionName) {
        case 'executeCommandOnCli': {
          try {
            const toolResult = await executeCommandOnCli(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: 'developer',
              content: JSON.stringify({
                step: 'TOOL_OUTPUT',
                output: toolResult,
              }),
            });
          } catch (error) {
            MESSAGES_DB.push({
              role: 'developer',
              content: JSON.stringify({ status: 'error', error }),
            });
          }

          continue;
        }
        case 'getWeatherData':
          {
            const toolResult = await getWeatherData(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: 'developer',
              content: JSON.stringify({
                step: 'TOOL_OUTPUT',
                output: toolResult,
              }),
            });
            continue;
          }
          break;
      }
    }
  }
}

// main(
//   'What is weather of Patiala, Delhi, Goa and then write the output this on a beautifuyll webpage. create a new folder saying weather and create all HTML CSS file there and then run this on my browser',
// );

// main(
//   'What is meaning of life? I am asking this because I need to wite this in an HTML file for my web dev project do not give me output as HTML as I can do this own my own just give me content in elboaratibve way for this',
// );

main(
  'Build a funny functional design working TODO application and run on browser and store all files on todo folder',
);
