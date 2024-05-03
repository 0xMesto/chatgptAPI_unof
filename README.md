ChatGPT unofficial API : 

This project is a Node.js application that interacts with the ChatGPT conversational AI model using Puppeteer, a Node.js library for automating web browsers.

Files
chatgptv1.js: This file contains the main logic for the ChatGPT bot, including methods for initializing the browser, sending messages, receiving replies, and handling errors.

bart.js: This file contains a function that uses the Cloudflare API to summarize the conversation history when an error occurs, in order to resume the conversation.

.env: This file contains the API token for the Cloudflare API, which is used in the bart.js file.

Dependencies :


puppeteer: A Node.js library for automating web browsers.
fs: The built-in file system module in Node.js.
winston: A logging library for Node.js.
crypto: The built-in cryptography module in Node.js.
axios: A popular HTTP client library for Node.js.
dotenv: A zero-dependency module that loads environment variables from a .env file.


Usage:


Install the dependencies by running npm install in your project directory.
Create a .env file in the project directory and add your Cloudflare API token:

API_TOKEN=YourfreeCloudFlareAPIToken
In your code, create a new instance of the ChatGPT class and use the sendMessage and getReply methods to interact with the ChatGPT model:

const ChatGPT = require('./chatgptv1');

const chatgpt = new ChatGPT();
await chatgpt.initializeBrowser();

await chatgpt.sendMessage('Hello, ChatGPT!');
const reply = await chatgpt.getReply();
console.log(reply);

await chatgpt.closeBrowser();
If an error occurs during the conversation, the handleError method will attempt to save the conversation history and resume the conversation using the summarized context.


Before Running : 
run Google chrom in the debug mode using 9220 , run : google-chrome-stable --remote-debugging-port=9222


Customization :

You can customize the behavior of the ChatGPT bot by passing options to the ChatGPT constructor:

chatbotUrl: The URL of the ChatGPT interface (default: 'https://chat.openai.com/').
headless: Whether to run the browser in headless mode (default: false).
saveConversationCallback: A callback function that will be called with the conversation summary and the conversation file name when an error occurs.


License:

This project is licensed under the MIT License. 
