document.addEventListener("DOMContentLoaded", () => {
    initMap();
    startCamera();
    checkLockStatus(); // Check lock status on page load

    // Set up periodic checks
    setInterval(checkLockStatus, 300000); // Check lock status every 5 minutes
    setInterval(updateLocation, 60000); // Update location every 60 seconds
});

// ✅ Ensure camera and canvas elements are loaded
let video, canvas, ctx;

function setupCameraElements() {
    video = document.getElementById("camera");
    canvas = document.getElementById("snapshot");
    ctx = canvas.getContext("2d");
}

// 📌 Start webcam
async function startCamera() {
    setupCameraElements();
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

// 📌 Capture intruder's face and send it to Flask
async function captureIntruder() {
    if (!video || !canvas || !ctx) setupCameraElements();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let imageData = canvas.toDataURL("image/png");

    try {
        let response = await fetch("/save_intruder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        });

        let result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error("Error saving intruder image:", error);
    }
}

// 📌 Register a new device
async function registerDevice() {
    const ownerName = document.getElementById("ownerName").value;
    const deviceModel = document.getElementById("deviceModel").value;
    const imei = document.getElementById("imei").value;

    if (!ownerName || !deviceModel || !imei) {
        alert("Please fill all fields!");
        return;
    }

    const device_id = `${deviceModel}-${imei}`; // Generate unique device ID

    try {
        let response = await fetch("/register_device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id, ownerName, deviceModel, imei })
        });

        let data = await response.json();
        alert(data.message);
    } catch (err) {
        console.error("Error:", err);
    }
}

// 📌 Google Maps integration
let map, marker;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    marker = new google.maps.Marker({
        position: { lat: 0, lng: 0 },
        map: map
    });

    updateLocation();
}

// 📌 Update location from Flask API
async function updateLocation() {
    try {
        let response = await fetch("/get_location");
        let data = await response.json();

        let newPos = { lat: data.lat, lng: data.lon };
        marker.setPosition(newPos);
        map.setCenter(newPos);
    } catch (err) {
        console.error("Error fetching location:", err);
    }
}

// 📌 Face detection using face-api.js (if applicable)
async function captureFace() {
    if (!video || !canvas || !ctx) setupCameraElements();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (typeof faceapi !== "undefined") {
        const faceDetection = await faceapi.detectSingleFace(canvas);
        if (!faceDetection) {
            document.getElementById("faceStatus").innerText = "No face detected!";
            return;
        }
    }

    let imageData = canvas.toDataURL("image/png");

    try {
        let response = await fetch("/save_intruder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData })
        });

        let data = await response.json();
        alert(data.message);
    } catch (err) {
        console.error("Error saving face:", err);
    }
}

// 📌 Check Lock Status
async function checkLockStatus() {
    try {
        let response = await fetch("/check_lock_status");
        let data = await response.json();

        if (!data.unlocked) {
            alert("Your device is now locked again!");
            // Here, you can add code to relock the phone
        }
    } catch (error) {
        console.error("Error checking lock status:", error);
    }
}

// 📌 Simulated fingerprint scanning
function scanFingerprint() {
    document.getElementById("fingerprintStatus").innerText = "Scanning...";
    setTimeout(() => {
        document.getElementById("fingerprintStatus").innerText = "Fingerprint Verified!";
    }, 2000);
}

// 📌 Remote wipe function
async function remoteWipe() {
    try {
        let response = await fetch("/remote_wipe", { method: "POST" });
        let data = await response.json();
        alert(data.message);
    } catch (err) {
        console.error("Error:", err);
    }
}

// 📌 Factory reset function
async function factoryReset() {
    try {
        let response = await fetch("/factory_reset", { method: "POST" });
        let data = await response.json();
        alert(data.message);
    } catch (err) {
        console.error("Error:", err);
    }
}
