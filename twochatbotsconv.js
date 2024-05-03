const fs = require('fs').promises;
const ChatGPT = require('./chatgptv1.js');
const { runBartModel } = require('./bart.js');
async function saveConversationCallback(conversationContext) {
    const data = JSON.stringify(conversationContext, null, 2);
    await fs.writeFile('conversationContext.json', data);
}
async function chatBotsConversation() {
    const initMSG = `hey suggest a business topic , \n and initiate the conversation`;
 // shortened for brevity
 let gpt1CONV = [];
 let gpt2CONV = [];

    const chatbot1 = new ChatGPT('https://chat.openai.com/', false, saveConversationCallback);
    await chatbot1.initializeBrowser();
    const chatbot2 = new ChatGPT('https://chat.openai.com/', false, saveConversationCallback);
    let loopCount = 90;

    let conversation = [];
    try {
     
        // Attempt to load an existing conversation
        const savedConversation = await fs.readFile('conversation.json', 'utf8');
        conversation = JSON.parse(savedConversation);
    } catch (error) {
        // If there's no saved conversation, start with the initial message
        conversation.push({ round: 1, chatbot1: initMSG });
    }
        let continueConversation = false;
    for (let i = conversation.length; i <= loopCount; i++) {
        let chatbot2Replies = chatbot2.conversationHistory.filter(message => message.startsWith('reply :'));
       let message = chatbot2Replies[chatbot2Replies.length-1] || conversation[conversation.length-1].chatbot2 || initMSG;
        await chatbot1.sendMessage(message);
        let reply1 = await chatbot1.getReply();
        if(conversation.length == 1 || continueConversation ) {
            await chatbot2.initializeBrowser();
            chatbot2.handleERRact=false;
            let continueConversation = false;
        }
        await chatbot2.sendMessage(reply1);
        let reply2 = await chatbot2.getReply();

        conversation.push({ round: i + 1, chatbot1: reply1, chatbot2: reply2 });
        await fs.writeFile('conversation.json', JSON.stringify(conversation, null, 2));
    }

    await chatbot1.closeBrowser();
    await chatbot2.closeBrowser();
}

chatBotsConversation();
