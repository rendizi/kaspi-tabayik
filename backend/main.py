import logging
from flask import Flask, request, jsonify, Response
from io import BytesIO
import requests
from PIL import Image
import torch
from pinecone import Pinecone
from bs4 import BeautifulSoup
from transformers import CLIPProcessor, CLIPModel
import os 

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

try:
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    index = pc.Index("kaspi")
    logging.debug("Pinecone initialized successfully")
except Exception as e:
    logging.error(f"Failed to initialize Pinecone: {e}")
    index = None

try:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    logging.debug("Model and processor loaded successfully")
except Exception as e:
    logging.error(f"Failed to load model and processor: {e}")
    processor = None
    model = None

def get_image(image_url: str):
    try:
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return image
    except Exception as e:
        logging.error(f"Failed to fetch or process image from URL: {e}")
        return None

def get_single_image_embedding(my_image, processor, model, device):
    try:
        image = processor(
            text=None,
            images=my_image,
            return_tensors="pt"
        )["pixel_values"].to(device)
        embedding = model.get_image_features(image)
        return embedding.cpu().detach().numpy()
    except Exception as e:
        logging.error(f"Failed to get image embedding: {e}")
        return None

@app.route("/query-image/", methods=["POST"])
def query_image():
    try:
        file = request.files["image"]
        image_data = file.read()
        my_image = Image.open(BytesIO(image_data)).convert("RGB")
        
        if my_image is None:
            logging.error("Image could not be opened")
            return jsonify({"error": "Image could not be opened"}), 500
        
        if processor is None or model is None:
            logging.error("Model or processor is not loaded correctly")
            return jsonify({"error": "Model or processor is not loaded correctly"}), 500

        embeddings = get_single_image_embedding(my_image, processor, model, device)
        if embeddings is None:
            logging.error("Failed to get embeddings")
            return jsonify({"error": "Failed to get embeddings"}), 500

        embeddings_list = embeddings.tolist()

        if index is None:
            logging.error("Pinecone index is not initialized")
            return jsonify({"error": "Pinecone index is not initialized"}), 500

        results = index.query(vector=embeddings_list, top_k=20, includeMetadata=True)
        return results.to_dict()

    except Exception as e:
        logging.error(f"Unhandled exception: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/fetch-image', methods=['GET'])
def fetch_image():
    url = request.args.get('url')
    if not url:
        return 'No URL provided', 400

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        return f'Error fetching page: {e}', 500

    soup = BeautifulSoup(response.content, 'html.parser')
    img_tag = soup.find('img', class_='item__slider-pic')
    if not img_tag or not img_tag.get('src'):
        return 'Image not found', 404

    img_url = img_tag['src']

    try:
        img_response = requests.get(img_url)
        img_response.raise_for_status()
    except requests.RequestException as e:
        return f'Error fetching image: {e}', 500

    return Response(
        img_response.content,
        mimetype='image/jpeg'  
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
