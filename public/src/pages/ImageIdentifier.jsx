import React, { useState } from "react";
import axios from "axios";

function ImageIdentifier() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault(); // Prevent the default form submit behavior

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/classify-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const prediction = response.data.prediction;
      setResult(prediction);
      speakText(`The prediction is ${prediction}`);
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
      <form enctype="multipart/form-data" onSubmit={handleUpload}>
        <input type="file" name="file" onChange={handleFileChange} />
        <button type="submit">Upload and Identify</button>
      </form>
      {result && <p>Result: {result}</p>}
    </div>
  );
}

export default ImageIdentifier;
