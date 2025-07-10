import axios from 'axios';

const checkGrammar = async (text) => {
  try {
    const response = await axios.post('http://localhost:5002/api/grammar-check', { text });  // Node.js LLM server on port 5002

    return response.data.correctedText || text;  // Fallback to original if no correction provided
  } catch (error) {
    console.error("Error in grammar check:", error);
    return text;  // Return original text in case of error
  }
};

export default checkGrammar;
