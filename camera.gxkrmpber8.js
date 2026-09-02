export async function startCameraLoop(processFrame, displayCanvas) {
  const displayCtx = displayCanvas.getContext("2d");

  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.style.display = "none";

  const keyQueue = [];

  window.addEventListener("keyup", e => {
    keyQueue.push(e.key);
  });
  try{
      const stream = await navigator.mediaDevices.getUserMedia({
	  video: { facingMode: "environment", width: 800, height: 600 }
      });
      video.srcObject = stream;
  } catch (error) {
      displayCtx.fillStyle = "#a0a0a0";
      displayCtx.font = "16px sans-serif";
      displayCtx.fillText("No Camera found.", displayCanvas.width / 2, displayCanvas.height / 2 + 75);      
  }
    

  await new Promise(r => (video.onloadedmetadata = r));
  await video.play();

  const w = video.videoWidth || 800;
  const h = video.videoHeight || 600;
  displayCanvas.width = w;
  displayCanvas.height = h;

  // Offscreen/hidden canvas just for pixel reads (never displayed)
  const captureCanvas = typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(w, h)
    : Object.assign(document.createElement("canvas"), { width: w, height: h });

  const captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true });

  // Reusable input buffer (Uint8Array) for your processing
  let captureBuffer = new Uint8Array(w * h * 4);

  // Reusable output ImageData for displaying processed frames (optional)
  const outClamped = new Uint8ClampedArray(w * h * 4);
  const outImage = new ImageData(outClamped, w, h);

  function onFrame(now, metadata) {
    // 1) Draw current decoded frame to the capture canvas
    captureCtx.drawImage(video, 0, 0, w, h);

    // 2) Read pixels and copy into the reusable input buffer
    const img = captureCtx.getImageData(0, 0, w, h); // Uint8ClampedArray
    captureBuffer.set(img.data);

    // 3) Let your processing fill or return an output buffer
    const processed = processFrame(captureBuffer, w, h, keyQueue);
    keyQueue.length = 0;

    // 4) Show processed result on the display canvas (if provided/desired)
    if (processed instanceof Uint8Array && processed.length === outClamped.length) {
      outClamped.set(processed);
      displayCtx.putImageData(outImage, 0, 0);
    } else {
      // If no processed buffer is returned, you could show the raw video:
      displayCtx.drawImage(video, 0, 0, w, h);
    }

    video.requestVideoFrameCallback(onFrame);
  }

  video.requestVideoFrameCallback(onFrame);

  return {
    stop() {
      stream.getTracks().forEach(t => t.stop());
    }
  };
}
