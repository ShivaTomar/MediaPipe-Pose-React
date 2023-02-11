import React, { useEffect, useState, useRef } from 'react';
import pose, { Pose, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import * as drawingUtils from "@mediapipe/drawing_utils"


function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const options = {
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    };

    async function setup() {
      const video = document.getElementById('input-video');
      const mpPose = new Pose(options);

      mpPose.setOptions({
        selfieMode: true,
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // const camera = new Camera(video, {
      //   onFrame: async () => {
      //     await mpPose.send({ image: video })
      //   }
      // });

      try {
        // await camera.start();

        const img = new Image();
        // img.src = 'tree-pose-hands-open.png';
        img.src = './pose-images/t-pose-2.jpg'
        // document.body.appendChild(img)

        mpPose.send({ image: img })
        mpPose.onResults(onResults);
      } catch (error) {
        console.log(error);
      }
    }

    setup();
  }, []);

  function onResults(results) {
    window.results = results
    console.log(results);

    const canvasElement = canvasRef.current
    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;

    const canvasCtx = canvasElement.getContext("2d")
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    const data = results.poseLandmarks.map(landmark => {
      return {
        x: landmark.x * results.image.width,
        y: landmark.y * results.image.height,
        z: landmark.z * canvasElement.height,
        visibility: landmark.visibility
      }
    });

    console.log('data', data);
    console.log("pose landmarks", pose.POSE_LANDMARKS);

    let x = pose.POSE_LANDMARKS_LEFT;
    x.LEFT_EAR = null;
    x.LEFT_EYE = null;
    x.LEFT_EYE_INNER = null;
    x.LEFT_EYE_OUTER = null;
    x.LEFT_PINKY = null;
    x.LEFT_INDEX = null;
    x.LEFT_RIGHT = null;
    x.LEFT_THUMB = null;

    let z = pose.POSE_LANDMARKS_RIGHT;
    z.RIGHT_EAR = null;
    z.RIGHT_EYE = null;
    z.RIGHT_EYE_INNER = null;
    z.RIGHT_EYE_OUTER = null;
    z.RIGHT_PINKY = null;
    z.RIGHT_INDEX = null;
    z.RIGHT_LEFT = null;
    z.RIGHT_THUMB = null;

    let connectors = pose.POSE_CONNECTIONS.map((conn, i) => {
      // console.log(i);
      if (i < 9) {
        conn = [];
      }

      if (((conn[0] > 16 && conn[0] < 23) || (conn[1] > 16 && conn[1] < 23))) {
        conn = [];
      }

      return conn;
    });

    // console.log(connectors);

    // console.log('right angle', (right));
    // console.log('left angle', (left));
    // console.log('left upper pose angle', calRightUpperPoseAngles(data));
    // console.log('right upper pose angle', calLeftUpperPoseAngles(data));
    // console.log('right lower pose angle', calRightLowerPoseAngles(data));
    // console.log('left lower pose angle', calLeftLowerPoseAngles(data));
    // console.log('hip pose angle', calHipsToTorsoAngles(data));

    // console.log('left pose angles', calLeftPoseAngles(data));

    console.log('full pose angles', calFullPoseAngles(data));

    if (results.poseLandmarks) {
      drawingUtils
        .drawConnectors(canvasCtx, results.poseLandmarks, connectors, { visibilityMin: 0.65, color: 'white' });
      drawingUtils
        .drawLandmarks(canvasCtx, Object.values(x)
          .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
      drawingUtils
        .drawLandmarks(canvasCtx, Object.values(z)
          .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
    }

    canvasCtx.restore();
  }

  function angleBetweenLines(landmark1, landmark2, landmark3) {
    const { x: x1, y: y1 } = landmark1;
    const { x: x2, y: y2 } = landmark2;
    const { x: x3, y: y3 } = landmark3;

    let angle = (Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y1 - y2, x1 - x2));
    angle = angle * 180 / Math.PI;

    if (angle < 0) angle += 360;
    return angle;
  }

  function calFullPoseAngles(landmarks) {
    const right_fullLeftPoseAngles = calLeftPoseAngles(landmarks);
    const right_fullRightPoseAngles = calRightPoseAngles(landmarks);
    const hipsToTorsoAngles = calHipsToTorsoAngles(landmarks);

    return { ...right_fullLeftPoseAngles, ...right_fullRightPoseAngles, ...hipsToTorsoAngles }
  }

  function calLeftPoseAngles(landmarks) {
    const left_upperPoseAngles = calLeftUpperPoseAngles(landmarks);
    const left_lowerPoseAngles = calLeftLowerPoseAngles(landmarks);

    return { ...left_upperPoseAngles, ...left_lowerPoseAngles }
  }

  function calRightPoseAngles(landmarks) {
    const right_upperPoseAngles = calRightUpperPoseAngles(landmarks);
    const right_lowerPoseAngles = calRightLowerPoseAngles(landmarks);

    return { ...right_upperPoseAngles, ...right_lowerPoseAngles }
  }

  function calRightUpperPoseAngles(landmarks) {
    const right_armAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_ELBOW],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_WRIST]
    );

    const right_armToTorsoAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_ELBOW],
    );

    return { right_armAngle, right_armToTorsoAngle }
  }

  function calLeftUpperPoseAngles(landmarks) {
    const left_armAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_LEFT.LEFT_WRIST],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_ELBOW],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_SHOULDER],
    );

    const left_armToTorsoAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_LEFT.LEFT_ELBOW],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_SHOULDER],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
    );

    return { left_armAngle, left_armToTorsoAngle }
  }

  function calRightLowerPoseAngles(landmarks) {
    const right_legAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_KNEE],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_ANKLE]
    );

    const right_legToHipAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_KNEE],
    );

    return { right_legAngle, right_legToHipAngle }
  }

  function calLeftLowerPoseAngles(landmarks) {
    const left_legAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_LEFT.LEFT_ANKLE],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_KNEE],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
    );

    const left_legToHipAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_LEFT.LEFT_KNEE],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
    );

    return { left_legAngle, left_legToHipAngle }
  }

  function calHipsToTorsoAngles(landmarks) {
    const right_hipToTorsoAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
    );

    const left_hipToTorsoAngle = angleBetweenLines(
      landmarks[POSE_LANDMARKS_RIGHT.RIGHT_HIP],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_HIP],
      landmarks[POSE_LANDMARKS_LEFT.LEFT_SHOULDER],
    );

    return { right_hipToTorsoAngle, left_hipToTorsoAngle }
  }

  return (
    <div className="container">
      <canvas ref={canvasRef} className='output_canvas' ></canvas>
    </div>
  );
}

export default App;
