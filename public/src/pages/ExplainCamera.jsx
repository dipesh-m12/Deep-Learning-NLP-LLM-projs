import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ExplainCamera() {
  const [mood, setMood] = useState("");
  const [activity, setActivity] = useState("");
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = async () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    const formData = new FormData();
    formData.append("file", dataURLtoFile(imageData, "image.jpg"));
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/analyze-camera-feed",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const { mood, activity, caption } = response.data;
      setMood(mood);
      setActivity(activity);
      setCaption(caption);
    } catch (error) {
      console.error("Error sending frame:", error);
    } finally {
      setLoading(false);
    }
  };

  const dataURLtoFile = (dataURL, filename) => {
    const [header, data] = dataURL.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new File([new Uint8Array(array)], filename, { type: mime });
  };

  // Capture a frame every 5 seconds
  useEffect(() => {
    // const interval = setInterval(captureFrame, 5000);
    // return () => clearInterval(interval);
  }, []);
  const handleClick = () => {
    captureFrame();
  };

  return (
    <div>
      <video ref={videoRef} autoPlay style={{ width: "100%" }}></video>
      <p>Mood: {mood}</p>
      <p>Activity: {activity}</p>
      <p>Caption: {caption}</p>
      {loading && <p>Sending frame...</p>}
      <button onClick={handleClick}>Send</button>
    </div>
  );
}

export default ExplainCamera;
