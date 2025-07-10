import React, { useState } from "react";
import axios from "axios";

const VoiceToText = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!audioFile) {
      alert("Please select a file first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      // Step 1: Transcribe Audio using Flask backend
      const transcribeResponse = await axios.post("http://localhost:5001/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const transcribedText = transcribeResponse.data.original_text;
      setTranscribedText(transcribedText);

      // Step 2: Correct Grammar using Node.js LLM backend
      const grammarResponse = await axios.post("http://localhost:5000/api/grammar-check", {
        text: transcribedText,
      });

      setCorrectedText(grammarResponse.data.correctedText);
    } catch (error) {
      console.error("Error:", error);
      alert("Error in transcription or grammar correction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Voice to Text and Grammar Correction</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload"}
      </button>

      <div>
        <h3>Transcribed Text:</h3>
        <p>{transcribedText || "No transcription yet."}</p>
      </div>

      <div>
        <h3>Corrected Text:</h3>
        <p>{correctedText || "No correction yet."}</p>
      </div>
    </div>
  );
};

export default VoiceToText;
