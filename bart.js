const axios = require('axios');
require('dotenv').config();
const API_BASE_URL = "https://api.cloudflare.com/client/v4/accounts/b7c42b39b8a0714483ddee381498e953/ai/run/";
const API_TOKEN = process.env.API_TOKEN;

async function runBartModel(inputText, maxLength = 1024) {
  try {
    // Check if the input text exceeds the maximum length
    if (inputText.length > maxLength) {
      // Split the input text into chunks of maxLength characters or less
      const chunks = [];
      for (let i = 0; i < inputText.length; i += maxLength) {
        chunks.push(inputText.slice(i, i + maxLength));
      }

      // Send each chunk to the API and receive the summarized chunks
      const summarizedChunks = await Promise.all(chunks.map(async (chunk) => {
        try {
          const response = await axios.post(`${API_BASE_URL}@cf/facebook/bart-large-cnn`, {
            input_text: chunk,
            max_length: maxLength
          }, {
            headers: {
              "Authorization": `Bearer ${API_TOKEN}`,
              "Content-Type": "application/json"
            }
          });

          if (response.data.success) {
            return response.data.result.summary;
          } else {
            console.error("API request failed:", response.data.errors);
            return null;
          }
        } catch (error) {
          console.error("Error:", error);
          return null;
        }
      }));

      // Filter out any null summarized chunks
      const validSummarizedChunks = summarizedChunks.filter(chunk => chunk !== null);

      // Concatenate the valid summarized chunks into a single summary string
      return validSummarizedChunks.join(',');
    } else {
      const response = await axios.post(`${API_BASE_URL}@cf/facebook/bart-large-cnn`, {
        input_text: inputText,
        max_length: maxLength
      }, {
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        return response.data.result.summary;
      } else {
        console.error("API request failed:", response.data.errors);
        return null;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

module.exports = { runBartModel };