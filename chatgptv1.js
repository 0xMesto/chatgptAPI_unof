const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const logger = require('winston');
const { runBartModel } = require('./bart');
const crypto = require('crypto');
class ChatGPT {
    constructor(chatbotUrl = 'https://chat.openai.com/', headless = false, saveConversationCallback = null) {
        this.browser = null;
        this.page = null;
        this.headless = headless;
        this.chatbotUrl = chatbotUrl;
        this.isFirstMessage = true;
        this.lastMessage = '';
        this.lastReply = '';
        this.letTimeout = 190000;
        this.saveConversationCallback = saveConversationCallback;
        this.conversationHistory = [];
        this.handleERRact = false;
        this.id = crypto.randomBytes(16).toString('hex')+".json"; // Generate a random hash and assign it to this.id
    }

    async initializeBrowser() {
        if (this.headless) {
            this.browser = await puppeteer.launch();
        } else {
            this.browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        }
        this.page = await this.browser.newPage();
        logger.info('Browser initialized');
    }

    async randomDelay() {
        const delay = Math.floor(Math.random() * (20000 - 8000 + 1) + 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    async saveConversationToFile() {
        try {
            await fs.writeFile(this.id, JSON.stringify(this.conversationHistory, null, 2));
            logger.info(`Conversation saved to ${this.id}`);
        } catch (error) {
            logger.error(`Failed to save conversation to file: ${error.message}`);
        }
    }
    async checkConHis() {
        return fs.existsSync(this.id);
    }

async handleError() {
    this.handleERRact = true;
    let conversationSummary ="";
    logger.error('An error occurred. Attempting to save and restart the conversation.');
    if (this.saveConversationCallback) {
        try {
            // Concatenate the conversation history into a single string
            const conversationString = this.conversationHistory.join('\n');

            // Send the entire conversation string to the summarization model API
            try {
                conversationSummary = await runBartModel(conversationString, 1500);
                // Save the conversation summary using the provided callback
                await this.saveConversationCallback(conversationSummary ,this.id);
            } catch (error) {
                logger.error(`Failed to summarize conversation: ${error.message}`);
                // Implement fallback strategy or error handling here
            }

            // Reinitialize the browser and navigate to the chat interface
            await this.page.close();
            await this.initializeBrowser();
            await this.page.goto(this.chatbotUrl, { waitUntil: 'networkidle2' });

            // Restore conversation context by sending the conversation summary
            await this.sendMessage(`Resuming conversation: ${conversationSummary}`);
            this.lastReply = await this.getReply();
            return this.lastReply;
            logger.info("Conversation successfully resumed.");
        } catch (saveError) {
            logger.error(`Failed to save or reinitialize: ${saveError.message}`);
            // Implement fallback strategy here
        }
    } else {
        logger.warn("No save conversation callback provided. Unable to save conversation state.");
    }
}

    async sendMessage(message, timeout = this.letTimeout) {
        message = message.replace(/\n/g, ' ')+" ALWAYS USE WEB BROSING IF NEEDED";
        await this.randomDelay();
        await this.page.bringToFront();
        await this.page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
        try {
        if (this.isFirstMessage) {
        await this.page.goto(this.chatbotUrl);
        this.isFirstMessage = false;
        }
        
        
                await this.page.waitForSelector('#prompt-textarea', { timeout });
        
                // Type the message normally
                await this.page.type('#prompt-textarea', message, { delay: 60 });
        
                await this.page.click('[data-testid="send-button"]');
                this.lastMessage = message;
                this.conversationHistory.push(`message : ${message} \n`);
                await this.saveConversationToFile();
                await this.randomDelay();
            } catch (error) {
                console.error(`Error: ${error.message}`);
                await this.handleError();
            }
        }
        
        async getReply(timeout = this.letTimeout) {
            await this.page.bringToFront();
            await this.page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
              });
            await this.randomDelay();
            try {
                // Wait for the send button to appear again
                await this.page.waitForSelector('[data-testid="send-button"]', { timeout });
        
                await this.page.waitForSelector('div[data-message-author-role="assistant"]', { timeout });
                const replyText = await this.page.evaluate(() => {
                    const replyElements = document.querySelectorAll('div[data-message-author-role="assistant"]');
                    const lastReplyElement = replyElements[replyElements.length - 1];
                    return lastReplyElement ? lastReplyElement.innerText : 'No reply found';
                });
                this.lastReply = replyText;
                this.conversationHistory.push(`reply : ${replyText} \n`);
                await this.saveConversationToFile();
                return replyText;
            } catch (error) {
                console.error(`Error: ${error.message}`);
                return await this.handleError();
            }
        }
        
        async closeBrowser() {
            await this.browser.close();
            logger.info('Browser closed');
        }
        }
        
        module.exports = ChatGPT;
