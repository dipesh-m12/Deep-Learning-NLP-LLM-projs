import React, { useState } from "react";
import axios from "axios";

function ExplainImage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/explain-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const caption = response.data.caption;
      setResult(caption);
      speakText(`The image description is: ${caption}`);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    } else {
      console.log("Speech synthesis not supported in this browser.");
    }
  };

  return (
    <div>
      <form encType="multipart/form-data" onSubmit={handleUpload}>
        <input type="file" name="file" required onChange={handleFileChange} />
        <button type="submit">Upload and Explain</button>
      </form>
      {result && <p>Explanation: {result}</p>}
    </div>
  );
}

export default ExplainImage;
