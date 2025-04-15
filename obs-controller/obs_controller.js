// obs_controller.js
// This script connects to OBS via obs-websocket 5.x.x and allows you
// to control recording interactively from a single terminal.

import OBSWebSocket from "obs-websocket-js";
const obs = new OBSWebSocket();

// ===== SETTINGS =====
const OBS_ADDRESS = "ws://localhost:4455"; // OBS WebSocket server address with protocol.
const OBS_PASSWORD = ""; // Your OBS password, if configured.
const RECORDING_SCENE = "Screen Recording"; // The scene you want to record.
const DISPLAY_INPUT_NAME = "Display Capture"; // The desired name for your display capture input.
const DISPLAY_INPUT_KIND = "display_capture"; // The input kind for display capture on macOS.
// ====================

// Connect to OBS
async function connectOBS() {
  try {
    // Note the change here: passing address and password as separate arguments.
    await obs.connect(OBS_ADDRESS, OBS_PASSWORD);
    console.log("Connected to OBS.");
  } catch (err) {
    console.error("Failed to connect to OBS:", err);
    throw err;
  }
}

// Switches to the designated scene
async function switchScene(sceneName) {
  try {
    await obs.call("SetCurrentProgramScene", { sceneName });
    console.log(`Current scene set to "${sceneName}".`);
  } catch (err) {
    console.error(`Error switching to scene "${sceneName}":`, err);
    throw err;
  }
}

// Checks for display capture input in the scene; creates it if missing.
async function ensureDisplayCaptureInput(sceneName) {
  try {
    const response = await obs.call("GetInputList");
    const inputs = response.inputs;
    const exists = inputs.some(
      (input) => input.inputName === DISPLAY_INPUT_NAME
    );
    if (exists) {
      console.log(`Input "${DISPLAY_INPUT_NAME}" already exists.`);
    } else {
      console.log(`Input "${DISPLAY_INPUT_NAME}" not found. Creating it...`);
      const createResponse = await obs.call("CreateInput", {
        sceneName,
        inputName: DISPLAY_INPUT_NAME,
        inputKind: DISPLAY_INPUT_KIND,
        inputSettings: {},
      });
      console.log(
        `Created input "${DISPLAY_INPUT_NAME}" with sceneItemId: ${createResponse.sceneItemId}`
      );
    }
  } catch (err) {
    console.error("Error ensuring display capture input:", err);
    throw err;
  }
}

// Start recording
async function startRecord() {
  try {
    await obs.call("StartRecord");
    console.log("Recording started.");
  } catch (err) {
    console.error("Error starting recording:", err);
    throw err;
  }
}

// Stop recording
async function stopRecord() {
  try {
    await obs.call("StopRecord");
    console.log("Recording stopped.");
  } catch (err) {
    console.error("Error stopping recording:", err);
    throw err;
  }
}

// Routine to start screen recording
async function startScreenRecording() {
  try {
    await switchScene(RECORDING_SCENE);
    await ensureDisplayCaptureInput(RECORDING_SCENE);
    // Wait briefly for OBS to update
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await startRecord();
  } catch (err) {
    console.error("Error during screen recording:", err);
  }
}

// Routine to stop screen recording
async function stopScreenRecording() {
  try {
    await stopRecord();
  } catch (err) {
    console.error("Error during stop recording:", err);
  }
}

// Interactive CLI to control recording on a single connection
async function interactiveCLI() {
  await connectOBS();
  console.log(
    "Type 'start' to begin recording, 'stop' to end recording, or 'exit' to disconnect and quit."
  );

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (data) => {
    const command = data.trim().toLowerCase();
    if (command === "start") {
      await startScreenRecording();
    } else if (command === "stop") {
      await stopScreenRecording();
    } else if (command === "exit") {
      obs.disconnect();
      console.log("Disconnected from OBS. Exiting.");
      process.exit(0);
    } else {
      console.log("Unknown command. Please enter 'start', 'stop', or 'exit'.");
    }
  });
}

interactiveCLI();
