from flask import Flask, request, jsonify
from flask_cors import CORS
from sentiment_analysis import analyze_sentiment
import numpy as np
from transformers import pipeline
from PIL import Image
import torch
from torchvision import models, transforms
import requests
from transformers import BlipProcessor, BlipForConditionalGeneration
from deepface import DeepFace
import os
import logging
import torch
from yolov5 import YOLOv5


# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load summarization pipeline
summarizer = pipeline("summarization")

# Load EfficientNet model
model = models.efficientnet_b0(pretrained=True)
model.eval()

# Load BLIP image captioning model and processor
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Load DeepFace model for emotion analysis and face recognition
# Note: DeepFace requires the image to be in RGB format
# Initialize DeepFace models here if necessary

# Load a pre-trained model for activity recognition
# This is a placeholder; replace with actual activity recognition model
activity_model = models.resnet50(pretrained=True)
activity_model.eval()

# Image transformation pipeline
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# Load ImageNet class labels
LABELS_URL = "https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json"
class_names = requests.get(LABELS_URL).json()

def analyze_mood(image):
    # Convert image to RGB format
    image = image.convert("RGB")
    
    # Define the path for saving the image
    temp_dir = 'C:\\tmp'
    img_path = os.path.join(temp_dir, 'temp_image.jpg')
    
    # Create the directory if it does not exist
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    # Save the image
    image.save(img_path)

    # Use DeepFace for emotion analysis
    try:
        # Enforce detection might be unnecessary if the image is guaranteed to contain a face
        analysis = DeepFace.analyze(img_path, actions=['emotion'], enforce_detection=False)
        logger.debug(f"DeepFace analysis result: {analysis}")

        # DeepFace returns a list of results; extract the first result if available
        if isinstance(analysis, list) and len(analysis) > 0:
            result = analysis[0]
            if isinstance(result, dict) and 'emotion' in result:
                emotions = result['emotion']
                logger.debug(f"Emotion scores: {emotions}")

                if isinstance(emotions, dict):
                    # Return the emotion with the highest score
                    dominant_emotion = max(emotions, key=emotions.get)
                    logger.debug(f"Dominant emotion: {dominant_emotion}")
                    return dominant_emotion

        logger.error("Invalid DeepFace analysis result format")
    except Exception as e:
        logger.error(f"Error analyzing mood: {e}")
    
    return "unknown"


""""
def analyze_activity(image):
    image = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = activity_model(image)
    _, predicted = torch.max(outputs, 1)

    # Define your activity labels based on your model's training
    activity_labels = ["running", "walking", "jumping"]

    if predicted.item() < len(activity_labels):
        return activity_labels[predicted.item()]
    else:
        logger.error(f"Predicted index {predicted.item()} out of range for activity_labels")
        return "unknown" 
"""
yolov5_model = YOLOv5('yolov5s.pt')

def analyze_activity(image):
    try:
        image = image.convert('RGB')
        print(f"Model type: {type(yolov5_model)}")
        
        # Run YOLOv5 on the image
        results = yolov5_model.predict(image)  # Adjust based on correct method
        
        # Print and inspect results
        print(f"Results: {results}")
        
        # Process results
        predictions = results.pandas().xyxy[0]  # Get predictions as a DataFrame
        if not predictions.empty:
            # Get the class with the highest confidence
            highest_confidence = predictions['confidence'].max()
            activity = predictions[predictions['confidence'] == highest_confidence]['name'].values[0]
            return activity
        else:
            return 'unknown'
    
    except Exception as e:
        logger.error(f"Error analyzing activity: {e}")
        return 'unknown'




@app.route('/detect-mood', methods=['POST'])
def detect_mood():
    try:
        data = request.json
        text = data.get('text')
        if not text:
            raise ValueError('No text provided')

        mood = analyze_sentiment(text)
        return jsonify({'mood': mood})

    except Exception as e:
        logger.error(f"Error in /detect-mood: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/summarize-text', methods=['POST'])
def summarize_text():
    try:
        data = request.json
        text = data.get('text')
        if not text:
            raise ValueError('No text provided')

        summary = summarizer(text, max_length=150, min_length=50, do_sample=False)
        return jsonify({'summary': summary[0]['summary_text']})

    except Exception as e:
        logger.error(f"Error in /summarize-text: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/classify-image', methods=['POST'])
def classify_image():
    try:
        if 'file' not in request.files:
            raise ValueError('No file provided')
        
        file = request.files['file']
        image = Image.open(file)
        image = transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = model(image)
        
        _, predicted = torch.max(outputs, 1)
        predicted_label = class_names[predicted.item()]

        return jsonify({'prediction': predicted_label})

    except Exception as e:
        logger.error(f"Error in /classify-image: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/explain-image', methods=['POST'])
def explain_image():
    try:
        if 'file' not in request.files:
            raise ValueError('No file provided')
        
        file = request.files['file']
        image = Image.open(file)

        inputs = blip_processor(images=image, return_tensors="pt")
        out = blip_model.generate(**inputs)
        caption = blip_processor.decode(out[0], skip_special_tokens=True)

        return jsonify({'caption': caption})

    except Exception as e:
        logger.error(f"Error in /explain-image: {e}")
        return jsonify({'error': str(e)}), 400

@app.route('/analyze-camera-feed', methods=['POST'])
def analyze_camera_feed():
    try:
        if 'file' not in request.files:
            raise ValueError('No file provided')
        
        file = request.files['file']
        image = Image.open(file)

        # Generate caption
        inputs = blip_processor(images=image, return_tensors="pt")
        out = blip_model.generate(**inputs)
        caption = blip_processor.decode(out[0], skip_special_tokens=True)
        logger.debug(f"Caption : {caption}")
        
        # Analyze mood 
        mood = analyze_mood(image)
        logger.debug(f"Mood analysis result: {mood}")

        # Analyze activity
        activities = analyze_activity(image)
        logger.debug(f"Activity analysis result: {activities}")

        return jsonify({'caption': caption, 'mood': mood, 'activity': activities})

    except Exception as e:
        logger.error(f"Error in /analyze-camera-feed: {e}")
        return jsonify({'error': str(e)}), 400


    except Exception as e:
        logger.error(f"Error in /analyze-camera-feed: {e}")
        return jsonify({'error': str(e)}), 400




if __name__ == '__main__':
    app.run(port=5001, debug=True)
