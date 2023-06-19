const debug = require("debug")("api_openai:debug");
const error = require("debug")("api_openai:error");

import com from "./lib/commons";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({apiKey: process.env.OPENAI_API_KEY});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({error: { message: "OpenAI API key not configured" } });
    return;
  }

  try {
    com.assertPostAndPwd(req);
    const searchText = req.body.searchText || '';
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(searchText.substring(0, 5800)),
      max_tokens: 2000,
      temperature: 0.6,
    });
    // const completion = await openai.createCompletion({
    //   model: "gpt-3.5-turbo", ...
    // });
    debug("completion: %o", completion.data.choices);
    res.status(200).json({ result: completion.data.choices[0].text });
  } catch(err) {
    com.handleError(res, err, error, "OpenAI");
  }
}

function generatePrompt(searchText) {
  return `Find answer and add details into the response.

Search: 
=========
${searchText}
=========
And Answer is:`;
}