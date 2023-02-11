import React, { useEffect, useState, useRef } from 'react';
import pose, { Pose } from '@mediapipe/pose';
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
        img.src = 'tree-pose-hands-open.png';
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
    canvasElement.height = 1080;
    canvasElement.width = 1080
    const canvasCtx = canvasElement.getContext("2d")

    const data = results.poseLandmarks.map(landmark => {
      return {
        x: landmark.x * results.image.width,
        y: landmark.y * results.image.height,
        z: landmark.z * canvasElement.height,
        visibility: landmark.visibility
      }
    });

    console.log('data', data);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    console.log(pose.POSE_LANDMARKS_LEFT);
    console.log(pose.POSE_LANDMARKS);
    console.log(pose.POSE_CONNECTIONS);

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
      console.log(i);
      if (i < 9) {
        conn = [];
      }

      if (((conn[0] > 16 && conn[0] < 23) || (conn[1] > 16 && conn[1] < 23))) {
        conn = [];
      }

      return conn;
    });

    console.log(connectors);

    let a = angleBetweenLines(
      data[24].x,
      data[24].y,
      data[26].x,
      data[26].y,
      data[28].x,
      data[28].y,
    )

    console.log('angle', a);

    if (results.poseLandmarks) {
      drawingUtils.drawConnectors(canvasCtx, results.poseLandmarks, connectors, { visibilityMin: 0.65, color: 'white' });
      drawingUtils.drawLandmarks(canvasCtx, Object.values(x)
        .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
      drawingUtils.drawLandmarks(canvasCtx, Object.values(z)
        .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
    }
    canvasCtx.restore();
  }

  function angleBetweenLines(x1, y1, x2, y2, x3, y3) {
    const m1 = (y2 - y1) / (x2 - x1);
    const m2 = (y3 - y2) / (x3 - x2);
    const angle = Math.atan(m2 - m1, 1 + m1 * m2);

    const val = ( Math.atan2(y3-y2, x3-x2) - Math.atan2(y1-y2, x1-x2) );
    console.log(val * 180 / Math.PI)

    return angle * 180 / Math.PI;
  }

  return (
    <div className="container">
      <canvas ref={canvasRef} className='output_canvas' ></canvas>
    </div>
  );
}

export default App;
