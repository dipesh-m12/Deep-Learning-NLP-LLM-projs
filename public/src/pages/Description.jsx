import React, { useState } from "react";
import axios from "axios";

function Description() {
  const [summary, setSummary] = useState();
  const [text, setText] = useState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/summarize-text",
        {
          text,
        }
      );
      setSummary(response.data.summary);

      // Convert summary to speech
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(response.data.summary);
        window.speechSynthesis.speak(utterance);
      } else {
        console.error("SpeechSynthesis API is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error summarizing text:", error);
    }
  };

  return (
    <div className="App">
      <h1>Text Summarizer</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
        />
        <button type="submit">Summarize</button>
      </form>
      {summary && <p>Summary: {summary}</p>}
    </div>
  );
}

export default Description;
