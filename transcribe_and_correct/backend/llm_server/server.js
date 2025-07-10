import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const LLAMA_API_URL = "http://localhost:11434/api/generate"; // LLaMA 2 API
const MODEL_NAME = "llama2"; // Change if your model has a different name

app.post("/api/grammar-check", async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        const response = await axios.post(LLAMA_API_URL, {
            model: MODEL_NAME,
            prompt: `Please correct the grammar and improve this sentence: "${text}". Output only the corrected text.`,
            stream: false
        });

        // Ensure response format is correct
        const correctedText = response.data?.response?.trim() || "Error: No response from model.";

        res.json({ correctedText });
    } catch (error) {
        console.error("Error:", error.message);

        if (error.response) {
            console.error("Error Response Data:", error.response.data);
            console.error("Error Status Code:", error.response.status);
            console.error("Error Headers:", error.response.headers);
        } else if (error.request) {
            console.error("Error Request:", error.request);
        } else {
            console.error("Error Config:", error.config);
        }

        res.status(500).json({ error: "Error processing text" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
