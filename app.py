from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import base64
import logging
import time

app = Flask(__name__)

# Configure Logging
logging.basicConfig(level=logging.INFO)

# Default Phone Location
phone_location = {"lat": 6.5244, "lon": 3.3792}  # Lagos, Nigeria

# Directory to store captured images
INTRUDER_DIR = "static/intruders"
os.makedirs(INTRUDER_DIR, exist_ok=True)

# Device Registration Storage
registered_devices = set()

# Unlock Status
unlock_status = {"unlocked": False, "expiry_time": 0}

### 🔹 Home Route
@app.route('/')
def home():
    return render_template('index.html')

### 🔹 Serve favicon.ico
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

# ─────────────────────────────────────────────
# 🔹 DEVICE MANAGEMENT
# ─────────────────────────────────────────────
@app.route('/register_device', methods=['POST'])
def register_device():
    """Registers a new device."""
    data = request.json
    device_id = data.get("device_id")

    if not device_id:
        return jsonify({"error": "Device ID required!"}), 400

    if device_id in registered_devices:
        return jsonify({"message": "Device already registered!"})

    registered_devices.add(device_id)
    logging.info(f"Device Registered: {device_id}")

    return jsonify({"message": "Device registered successfully!"})

@app.route('/unlock_device', methods=['POST'])
def unlock_device():
    """Unlocks the device for 24 hours."""
    global unlock_status
    unlock_status["unlocked"] = True
    unlock_status["expiry_time"] = time.time() + 24 * 3600  # 24 hours from now

    return jsonify({"message": "Device unlocked for 24 hours!"})

@app.route('/check_lock_status', methods=['GET'])
def check_lock_status():
    """Checks if the device should be locked again."""
    global unlock_status
    if time.time() > unlock_status["expiry_time"]:
        unlock_status["unlocked"] = False  # Relock the phone
    return jsonify({"unlocked": unlock_status["unlocked"]})

@app.route('/remote_wipe', methods=['POST'])
def remote_wipe():
    """Triggers remote wipe."""
    logging.info("Remote wipe initiated")
    return jsonify({"message": "Remote wipe initiated!"})

@app.route('/factory_reset', methods=['POST'])
def factory_reset():
    """Triggers factory reset."""
    logging.info("Factory reset initiated")
    return jsonify({"message": "Factory reset initiated!"})

# ─────────────────────────────────────────────
# 🔹 LOCATION TRACKING
# ─────────────────────────────────────────────
@app.route('/get_location', methods=['GET'])
def get_location():
    """Returns the current location of the phone."""
    return jsonify(phone_location)

@app.route('/update_location', methods=['POST'])
def update_location():
    """Updates the phone's location."""
    global phone_location
    data = request.json

    try:
        phone_location = {
            "lat": float(data.get("lat", phone_location["lat"])),
            "lon": float(data.get("lon", phone_location["lon"]))
        }
        logging.info(f"Location updated: {phone_location}")
        return jsonify({"message": "Location updated!", "location": phone_location})
    except ValueError:
        return jsonify({"error": "Invalid location data"}), 400

# ─────────────────────────────────────────────
# 🔹 SECURITY - Intruder Capture
# ─────────────────────────────────────────────
@app.route('/save_intruder', methods=['POST'])
def save_intruder():
    """Saves an image of the intruder."""
    data = request.json
    if 'image' not in data:
        return jsonify({"error": "No image provided!"}), 400

    image_data = data['image'].split(',')[1]
    filename = os.path.join(INTRUDER_DIR, f"intruder_{int(time.time())}.png")

    try:
        with open(filename, "wb") as f:
            f.write(base64.b64decode(image_data))
        logging.info(f"Intruder image saved: {filename}")
        return jsonify({"message": "Face captured successfully!", "path": filename})
    except Exception as e:
        logging.error(f"Error saving image: {e}")
        return jsonify({"error": "Failed to save image!"}), 500

# ─────────────────────────────────────────────
# 🔹 Run the Flask App
# ─────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True)
