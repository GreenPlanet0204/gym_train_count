// Constants
const videoElement = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const repetitionCountElement = document.getElementById("repetitionCount");

// Variables
let exerciseStarted = false;
var flipHorizontal = false;
let repetitionCount = 0;
let kneeCount = new Array(20).fill(0);
let shoulderCount = new Array(20).fill(0);
let deadlifts = new Array(20).fill(0);
let net;
let animationFrameId;
const frameRate = 20;
let angle = [180];
let exercise = "lift";
let count = new Array(20).fill(0);

const model = poseDetection.SupportedModels.BlazePose;
const detectorConfig = {
  runtime: "mediapipe",
  solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose",
  // or 'base/node_modules/@mediapipe/pose' in npm.
  // modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
  // enableTracking: true,
  // trackerType: poseDetection.TrackerType.Keypoint,
};

// Load PoseNet model
async function loadPoseNetModel() {
  net = await poseDetection.createDetector(model, detectorConfig);
}

// Event Listener for Start Button
startButton.addEventListener("click", () => {
  if (!exerciseStarted) {
    exerciseStarted = true;
    startButton.innerText = "Stop";
    startProcessing();
  } else {
    exerciseStarted = false;
    startButton.innerText = "Start";
    stopProcessing();
  }
});

// Start video playback and processing
function startProcessing() {
  videoElement.play();
  processVideo();
}

// Stop video playback and processing
function stopProcessing() {
  videoElement.pause();
  cancelAnimationFrame(animationFrameId);
}

function countShoulder(id, keypoints) {
  const Point1 = keypoints.find((item) => item.name == "right_shoulder");
  const Point2 = keypoints.find((item) => item.name == "right_elbow");
  const Point3 = keypoints.find((item) => item.name == "right_wrist");
  if (
    (calculateAngle(Point1, Point2, Point3) > 170) |
    (calculateAngle(Point1, Point2, Point3) < 90)
  ) {
    if (angle[0] > 170 && calculateAngle(Point1, Point2, Point3) < 90) {
      shoulderCount[id - 1] += 1;
      if (shoulderCount[id - 1] === 1) {
        const div = document.createElement("div");
        div.setAttribute("id", `person-${id}`);
        repetitionCountElement.append(div);
      }
      const ele = document.getElementById(`person-${id}`);
      ele.innerText = `Person${id}: ${shoulderCount[id - 1]}`;
    }
    angle.unshift(calculateAngle(Point1, Point2, Point3));
  }
}

function countKnee(id, keypoints) {
  const Point1 = keypoints.find((item) => item.name == "right_hip");
  const Point2 = keypoints.find((item) => item.name == "right_knee");
  const Point3 = keypoints.find((item) => item.name == "right_ankle");
  const Point4 = keypoints.find((item) => item.name == "right_shoulder");
  if (
    (calculateAngle(Point1, Point2, Point3) > 150) |
    (calculateAngle(Point1, Point2, Point3) < 90)
  ) {
    const angle1 = Math.abs(
      (Math.atan2(Point4.y - Point1.y, Point4.x - Point1.x) * 180.0) / Math.PI
    );
    if (
      angle[0] > 150 &&
      calculateAngle(Point1, Point2, Point3) < 90 &&
      angle1 < 65
    ) {
      kneeCount[id - 1] += 1;
      if (kneeCount[id - 1] === 1) {
        const div = document.createElement("div");
        div.setAttribute("id", `person-${id}`);
        repetitionCountElement.append(div);
      }
      const ele = document.getElementById(`person-${id}`);
      ele.innerText = `Person${id}: ${kneeCount[id - 1]}`;
    }
    angle.unshift(calculateAngle(Point1, Point2, Point3));
  }
}

function countDeadLifts(id, keypoints) {
  const Point1 = keypoints.find((item) => item.name == "right_hip");
  const Point2 = keypoints.find((item) => item.name == "right_knee");
  const Point3 = keypoints.find((item) => item.name == "right_ankle");
  const Point4 = keypoints.find((item) => item.name == "right_wrist");
  if (
    (calculateAngle(Point1, Point2, Point3) > 150) |
    (calculateAngle(Point1, Point2, Point3) < 110)
  ) {
    if (
      angle[0] > 150 &&
      calculateAngle(Point1, Point2, Point3) < 110 &&
      Point2.y < Point4.y
    ) {
      count[id - 1] += 1;
      if (count[id - 1] == 1) {
        const div = document.createElement("div");
        div.setAttribute("id", `person-${id}`);
        repetitionCountElement.append(div);
      }
      const ele = document.getElementById(`person-${id}`);
      ele.innerText = `Person${id}: ${count[id - 1]}`;
    }

    angle.unshift(calculateAngle(Point1, Point2, Point3));
  }
}

function countLift(id, keypoints) {
  const Point1 = keypoints.find((item) => item.name == "right_shoulder");
  const Point2 = keypoints.find((item) => item.name == "right_elbow");
  const Point3 = keypoints.find((item) => item.name == "right_wrist");
  const Point4 = keypoints.find((item) => item.name == "right_eye");
  if (
    (calculateAngle(Point1, Point2, Point3) > 140) |
    (calculateAngle(Point1, Point2, Point3) < 80)
  ) {
    if (
      angle[0] < 80 &&
      calculateAngle(Point1, Point2, Point3) > 140 &&
      Point3.y < Point4.y
    ) {
      console.log("angle", angle);
      console.log("count", count);
      count[id - 1] += 1;
      if (count[id - 1] === 1) {
        const div = document.createElement("div");
        div.setAttribute("id", `person-${id}`);
        repetitionCountElement.append(div);
      }
      const ele = document.getElementById(`person-${id}`);
      ele.innerText = `Person${id}: ${count[id - 1]}`;
    }
    angle.unshift(calculateAngle(Point1, Point2, Point3));
  }
}

// Helper function to draw keypoints and lines on canvas
function drawKeypointsAndLines(id = 1, keypoints, minConfidence, scale = 1) {
  const adjacentKeyPointIndexes = poseDetection.util.getAdjacentPairs(model);

  // scale *= videoElement.clientWidth / 540;

  if (exercise == "knee") countKnee(id, keypoints);
  if (exercise == "shoulder") countShoulder(id, keypoints);
  if (exercise == "deadlifts") countDeadLifts(id, keypoints);
  if (exercise == "lift") countLift(id, keypoints);
  // // Draw lines
  adjacentKeyPointIndexes.forEach((indexes) => {
    const [pointA, pointB] = indexes;

    // Check if both points exist and have scores above the minimum confidence
    if (
      keypoints[pointA] &&
      keypoints[pointB] &&
      keypoints[pointA].score >= minConfidence &&
      keypoints[pointB].score >= minConfidence
    ) {
      const x1 = keypoints[pointA].x * scale;
      const y1 =
        (keypoints[pointA].y - 960) * scale + videoElement.clientHeight / 2;
      const x2 = keypoints[pointB].x * scale;
      const y2 =
        (keypoints[pointB].y - 960) * scale + videoElement.clientHeight / 2;

      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.strokeStyle = "red";
      context.lineWidth = 2;
      context.stroke();
    }
  });

  // Draw keypoints
  keypoints.forEach((keypoint) => {
    if (keypoint && keypoint.score >= minConfidence) {
      const { x, y } = keypoint;
      const scaledX = x * scale;
      const scaledY = (y - 960) * scale + videoElement.clientHeight / 2;

      context.beginPath();
      context.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      context.fillStyle = "red";
      context.fill();
    }
  });
}

function calculateAngle(keypoint1, keypoint2, keypoint3) {
  const radians =
    Math.atan2(keypoint1.y - keypoint2.y, keypoint1.x - keypoint2.x) -
    Math.atan2(keypoint3.y - keypoint2.y, keypoint3.x - keypoint2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;

  return angle;
}

// Process video frames
async function processVideo() {
  // Check if exercise is stopped
  if (!exerciseStarted) {
    return;
  }

  // Request next animation frame
  animationFrameId = requestAnimationFrame(processVideo);

  // Check if video metadata is available
  if (videoElement.readyState < videoElement.HAVE_METADATA) {
    return;
  }

  console.log(videoElement.clientHeight, videoElement.clientWidth);
  canvas.width = videoElement.clientWidth;
  canvas.height = videoElement.clientHeight;

  // Perform pose estimation on current frame
  net
    .estimatePoses(videoElement, {
      flipHorizontal: false,
    })
    .then(() => {
      // Log pose data
      console.log("poses", poses);
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw keypoints and lines on canvas
      poses.forEach((pose) => {
        drawKeypointsAndLines(
          pose.id,
          pose.keypoints,
          0.1,
          canvas.width / videoElement.videoWidth
        );
      });
    })
    .catch((error) => {
      console.error("Pose estimation error:", error);
    });
}

// ...

// Draw video frame on canvas
function drawVideoFrame() {
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
}

// Start video playback and processing
function startProcessing() {
  videoElement.play();
  drawVideoFrame(); // Draw initial video frame
  processVideo();
}

// ...

// Load PoseNet model on page load
loadPoseNetModel().catch((error) => {
  console.error("Failed to load PoseNet model:", error);
});
