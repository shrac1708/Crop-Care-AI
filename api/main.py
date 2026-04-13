

from fastapi import FastAPI, File, UploadFile, Path
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf
from typing import Optional

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_INFO = {
    "potato": {
        "file": "../potatoes.keras",
        "classes": ["Early Blight", "Late Blight", "Healthy"],
    },
    "apple": {
        "file": "../apple.keras",
        "classes": ["Apple Scab", "Black Rot", "Cedar Apple Rust", "Healthy"],
    },
    "bell-pepper": {
        "file": "../bell-pepper.keras",
        "classes": ["Bacterial Spot", "Healthy"],
    },
    "cherry": {
        "file": "../cherry.keras",
        "classes": ["Healthy", "Powdery Mildew"],
    },
    "corn": {
        "file": "../corn.keras",
        "classes": ["Cercospora Leaf Spot", "Common Rust", "Healthy", "Northern Leaf Blight"],
    },
    "grape": {
        "file": "../grape.keras",
        "classes": ["Black Rot", "Esca (Black Measles)", "Healthy", "Leaf Blight"],
    },
    "peach": {
        "file": "../peach.keras",
        "classes": ["Bacterial Spot", "Healthy"],
    },
    "strawberry": {
        "file": "../strawberry.keras",
        "classes": ["Healthy", "Leaf Scorch"],
    },
    "tomato": {
        "file": "../tomato.keras",
        "classes": ["Bacterial Spot", "Early Blight", "Healthy", "Late Blight", "Septoria Leaf Spot", "Yellow Leaf Curl Virus"],
    },
}

MODELS = {}

for crop, info in MODEL_INFO.items():
    MODELS[crop] = tf.keras.models.load_model(info["file"])

@app.get("/ping")
async def ping():
    return "Hello, I am alive"

@app.get("/crops")
async def get_crops():
    return list(MODEL_INFO.keys())

def read_file_as_image(data) -> np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image

def predict_with_model(crop, img_batch):
    predictions = MODELS[crop].predict(img_batch)
    class_names = MODEL_INFO[crop]["classes"]
    predicted_class = class_names[np.argmax(predictions[0])]
    confidence = float(np.max(predictions[0]))
    return crop, predicted_class, confidence

@app.post("/predict")
async def predict_auto(
    file: UploadFile = File(...)
):
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)

    best_crop, best_class, best_confidence = None, None, -1.0
    for crop in MODELS:
        crop_name, predicted_class, confidence = predict_with_model(crop, img_batch)
        if confidence > best_confidence:
            best_crop, best_class, best_confidence = crop_name, predicted_class, confidence

    return {
        'crop': best_crop,
        'class': best_class,
        'confidence': best_confidence
    }

@app.post("/predict/{crop}")
async def predict(
    crop: str = Path(..., description="Crop name"),
    file: UploadFile = File(...)
):
    if crop not in MODELS:
        return {"error": f"Unknown crop '{crop}'. Available: {list(MODEL_INFO.keys())}"}

    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)

    _, predicted_class, confidence = predict_with_model(crop, img_batch)
    return {
        'crop': crop,
        'class': predicted_class,
        'confidence': confidence
    }

if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port=8000)

