from google.cloud import storage
import tensorflow as tf
from PIL import Image
import numpy as np

BUCKET_NAME = "crop-care-ai-models"  # Here you need to put the name of your GCP bucket

MODEL_INFO = {
    "potato": {
        "file": "models/potatoes.keras",
        "classes": ["Early Blight", "Late Blight", "Healthy"],
    },
    "apple": {
        "file": "models/apple.keras",
        "classes": ["Apple Scab", "Black Rot", "Cedar Apple Rust", "Healthy"],
    },
    "bell-pepper": {
        "file": "models/bell-pepper.keras",
        "classes": ["Bacterial Spot", "Healthy"],
    },
    "cherry": {
        "file": "models/cherry.keras",
        "classes": ["Healthy", "Powdery Mildew"],
    },
    "corn": {
        "file": "models/corn.keras",
        "classes": ["Cercospora Leaf Spot", "Common Rust", "Healthy", "Northern Leaf Blight"],
    },
    "grape": {
        "file": "models/grape.keras",
        "classes": ["Black Rot", "Esca (Black Measles)", "Healthy", "Leaf Blight"],
    },
    "peach": {
        "file": "models/peach.keras",
        "classes": ["Bacterial Spot", "Healthy"],
    },
    "strawberry": {
        "file": "models/strawberry.keras",
        "classes": ["Healthy", "Leaf Scorch"],
    },
    "tomato": {
        "file": "models/tomato.keras",
        "classes": ["Bacterial Spot", "Early Blight", "Healthy", "Late Blight", "Septoria Leaf Spot", "Yellow Leaf Curl Virus"],
    },
}

models = {}


def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    blob.download_to_filename(destination_file_name)

    print(f"Blob {source_blob_name} downloaded to {destination_file_name}.")


def ensure_model_loaded(crop):
    """Download and cache a model for the given crop."""
    global models
    if crop not in models:
        info = MODEL_INFO[crop]
        local_path = f"/tmp/{crop}.keras"
        download_blob(BUCKET_NAME, info["file"], local_path)
        models[crop] = tf.keras.models.load_model(local_path)


def predict_crop(crop, img_array):
    """Run prediction for a single crop model and return (crop, class, confidence)."""
    ensure_model_loaded(crop)
    predictions = models[crop].predict(img_array)
    class_names = MODEL_INFO[crop]["classes"]
    predicted_class = class_names[np.argmax(predictions[0])]
    confidence = float(np.max(predictions[0]))
    return crop, predicted_class, confidence


def predict(request):
    global models

    crop = request.args.get("crop")

    if crop and crop not in MODEL_INFO:
        return {"error": f"Unknown crop '{crop}'. Available: {list(MODEL_INFO.keys())}"}

    image = request.files["file"]

    image = np.array(
        Image.open(image).convert("RGB").resize((256, 256))  # image resizing
    )

    image = image / 255  # normalize the image in 0 to 1 range

    img_array = tf.expand_dims(image, 0)

    if crop:
        # Single-crop prediction
        best_crop, predicted_class, confidence = predict_crop(crop, img_array)
    else:
        # Auto-detect: try all models, pick highest confidence
        best_crop, predicted_class, best_confidence = None, None, -1.0
        for c in MODEL_INFO:
            c_name, c_class, c_conf = predict_crop(c, img_array)
            if c_conf > best_confidence:
                best_crop, predicted_class, best_confidence = c_name, c_class, c_conf
        confidence = best_confidence

    confidence = round(100 * confidence, 2)

    return {"crop": best_crop, "class": predicted_class, "confidence": confidence}

