import React from "react";
import { useState } from "react";
import axios from "axios";

function Home() {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/detect-mood", {
        text,
      });
      setMood(response.data.mood);
    } catch (error) {
      console.error("Error detecting mood:", error);
    }
  };
  return (
    <div className="App">
      <h1>Mood Detector</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
        />
        <button type="submit">Detect Mood</button>
      </form>
      {mood && <p>Mood: {mood}</p>}
    </div>
  );
}

export default Home;
