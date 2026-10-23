import tensorflow as tf
import numpy as np
from PIL import Image

# Load trained model
MODEL_PATH = "model/brain_tumor_model.keras"
model = tf.keras.models.load_model(MODEL_PATH)

# These must match the folder names used during training
CLASS_NAMES = [
    "glioma",
    "meningioma",
    "notumor",
    "pituitary"
]

def predict_image(image_path):
    try:
        print("STEP 1 - Loading image:", image_path)

        image = Image.open(image_path).convert("RGB")
        image = image.resize((224, 224))

        print("STEP 2 - Image resized")

        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        print("STEP 3 - Sending image to model")

        predictions = model.predict(image_array, verbose=0)

        print("STEP 4 - Prediction:", predictions)

        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index]) * 100

        predicted_class = CLASS_NAMES[predicted_index]

        return {
            "prediction": predicted_class,
            "confidence": round(confidence, 2)
        }

    except Exception as e:
        print("🔥 PREDICTION ERROR:", repr(e))
        raise