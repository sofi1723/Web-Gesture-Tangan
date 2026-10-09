const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const statusText = document.getElementById("status");
const numberText = document.getElementById("number");
const gestureText = document.getElementById("gesture");

let cameraStarted = false;


// ===============================
// FUNGSI MENGHITUNG JARI
// ===============================

function countFingers(landmarks, handedness) {

    let count = 0;

    // -------------------------------
    // TELUNJUK
    // -------------------------------
    if (landmarks[8].y < landmarks[6].y) {
        count++;
    }

    // -------------------------------
    // JARI TENGAH
    // -------------------------------
    if (landmarks[12].y < landmarks[10].y) {
        count++;
    }

    // -------------------------------
    // JARI MANIS
    // -------------------------------
    if (landmarks[16].y < landmarks[14].y) {
        count++;
    }

    // -------------------------------
    // KELINGKING
    // -------------------------------
    if (landmarks[20].y < landmarks[18].y) {
        count++;
    }

    // -------------------------------
    // JEMPOL
    // -------------------------------

    if (handedness === "Right") {

        if (landmarks[4].x < landmarks[3].x) {
            count++;
        }

    } else {

        if (landmarks[4].x > landmarks[3].x) {
            count++;
        }
    }

    return count;
}


// ===============================
// CEK GESTURE LOVE ❤️
// ===============================

function isLoveGesture(landmarks) {

    // Jarak ujung jempol dan telunjuk
    const thumbX = landmarks[4].x;
    const thumbY = landmarks[4].y;

    const indexX = landmarks[8].x;
    const indexY = landmarks[8].y;

    const distance = Math.sqrt(
        Math.pow(thumbX - indexX, 2) +
        Math.pow(thumbY - indexY, 2)
    );

    // Kalau jempol dan telunjuk berdekatan
    return distance < 0.08;
}


// ===============================
// HASIL DETEKSI TANGAN
// ===============================

function onResults(results) {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0) {

        const landmarks = results.multiHandLandmarks[0];

        const handedness =
            results.multiHandedness[0].label;

        // Gambar titik dan garis tangan
        drawConnectors(
            ctx,
            landmarks,
            HAND_CONNECTIONS,
            {
                color: "#00FF00",
                lineWidth: 4
            }
        );

        drawLandmarks(
            ctx,
            landmarks,
            {
                color: "#FF0000",
                lineWidth: 2,
                radius: 5
            }
        );

        // Cek LOVE
        if (isLoveGesture(landmarks)) {

            numberText.textContent = "❤️";
            gestureText.textContent = "LOVE!";

        } else {

            // Hitung jumlah jari
            const fingers = countFingers(
                landmarks,
                handedness
            );

            numberText.textContent = fingers;

            if (fingers === 0) {
                gestureText.textContent = "Tangan mengepal ✊";
            }

            else if (fingers === 1) {
                gestureText.textContent = "1 jari ☝️";
            }

            else if (fingers === 2) {
                gestureText.textContent = "2 jari ✌️";
            }

            else if (fingers === 3) {
                gestureText.textContent = "3 jari 🤟";
            }

            else if (fingers === 4) {
                gestureText.textContent = "4 jari";
            }

            else if (fingers === 5) {
                gestureText.textContent = "5 jari 🖐️";
            }
        }

    } else {

        numberText.textContent = "?";
        gestureText.textContent = "Tangan tidak terdeteksi";
    }
}


// ===============================
// MEDIA PIPE HANDS
// ===============================

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 1,

    minDetectionConfidence: 0.6,

    minTrackingConfidence: 0.6

});

hands.onResults(onResults);


// ===============================
// TOMBOL KAMERA
// ===============================

startButton.addEventListener("click", async () => {

    if (cameraStarted) {
        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true
            });

        video.srcObject = stream;

        statusText.textContent =
            "Kamera aktif! Arahkan tangan ke kamera 🖐️";

        startButton.textContent =
            "Kamera Aktif ✅";

        cameraStarted = true;

        video.addEventListener(
            "loadeddata",
            () => {

                const camera = new Camera(
                    video,
                    {
                        onFrame: async () => {

                            await hands.send({
                                image: video
                            });

                        },

                        width: 640,
                        height: 480
                    }
                );

                camera.start();

            },
            {
                once: true
            }
        );

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "❌ Kamera tidak dapat dibuka.";

        gestureText.textContent =
            "Izinkan akses kamera di browser.";
    }
});