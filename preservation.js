import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ✅ Reset button event
document.querySelector("#resetBtn").addEventListener("click", () => {
    location.reload(); // 🔄 reload the entire page
});

const realPinnedImages = {
  ladybug: "assets/images/Finished-Pinned/ladybug.jpg",
  stink: "assets/images/Finished-Pinned/stinkbug.jpg",
  wasps: "assets/images/Finished-Pinned/wasp.jpg",
  grasshopper: "assets/images/Finished-Pinned/grasshopper.jpg",
  carpenter_ant: "assets/images/Finished-Pinned/carpenter_ant.jpg",
  honey_bee: "assets/images/Finished-Pinned/honey_bee.jpg",
  houseflies: "assets/images/Finished-Pinned/housefly.jpg",
};

let currentInsectName = null;

const insectPlacementConfig = {
  ladybug: {
    position: new THREE.Vector3(-0.5, 0, 0),
    rotation: new THREE.Euler(-0.1, -1.55, 0.8),
    scale: new THREE.Vector3(4, 4, 4),
  },
  stink: {
    position: new THREE.Vector3(-0.5, 0, 0),
    rotation: new THREE.Euler(-1.1, 0, 0),
    scale: new THREE.Vector3(3.5, 3.5, 3.5),
  },
  wasps: {
    position: new THREE.Vector3(-0.5, 0, 0),
    rotation: new THREE.Euler(-0.95, 1.90, 0),
    scale: new THREE.Vector3(4, 4, 4),
  },
  grasshopper: {
    position: new THREE.Vector3(-0.1, 0, 0),
    rotation: new THREE.Euler(-0.9, 5.52, 0),
    scale: new THREE.Vector3(3.5, 3.5, 3.5),
  },
  ///////////
  carpenter_ant: {
    position: new THREE.Vector3(-0.1, 0, 0),
    rotation: new THREE.Euler(-0.9, 95.9, 0),
    scale: new THREE.Vector3(3.5, 3.5, 3.5),
  },
  honey_bee: {
    position: new THREE.Vector3(-0.1, 0, 0),
    rotation: new THREE.Euler(-0.60, 9.47, 0),
    scale: new THREE.Vector3(3.5, 3.5, 3.5),
  },
  houseflies: {
    position: new THREE.Vector3(-0.1, 0, 0),
    rotation: new THREE.Euler(-0.9, 8.57, 0),
    scale: new THREE.Vector3(3.5, 3.5, 3.5),
  },
};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#595959');

// Canvas & renderer
const canvas = document.getElementById('experience-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.localClippingEnabled = true;

const sun = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sun);
// Main light
sun.intensity = 2;
sun.position.set(5, 10, 5);

// Global ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// // Soft sky lighting
// const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
// scene.add(hemiLight);


// Camera (Orthographic same as your code)
const zoom = 2;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -aspect * zoom,
    aspect * zoom,
    zoom,
    -zoom,
    0.01,
    1000
);
camera.position.y = 1;

// Controls (optional)
const controls = new OrbitControls(camera, canvas);
controls.enabled = false; // enable if you want to move around
controls.update();

// Clock (for animation mixers)
const clock = new THREE.Clock();
let mixer;

// Loader
let tableMesh = null;
const loader = new GLTFLoader();
loader.load(
    'assets/preservation.glb',
    (glb) => {
        const model = glb.scene;
        model.position.set(-1.2, -1, 0.4); // ✅ your original position
        scene.add(model);

        // Mark the FrogDissectionTable mesh if it exists
        const meshesToHide = ["styroPhome", "ethylAlcohol", "speaker"];
        model.traverse((child) => {
            if (child && child.isMesh && child.name && child.name.includes('FrogDissectionTable')) {
                tableMesh = child;
                child.name = 'FrogDissectionTable';
                console.log("🛠 Table found:", tableMesh.name);
            }
              if (child.isMesh && meshesToHide.includes(child.name)) {
                child.visible = false;   // Hide it
              }

          if (child && child.isMesh) {
        if (child.name.includes("FrogDissectionTable")) {
          tableMesh = child;
          console.log("🛠 Table found:", tableMesh.name);
        }

        if (child.name === "Pin") {
          pinMeshOriginal = child;
          console.log("📍 Pin tool found:", pinMeshOriginal.name);
        }

        if (child.name === "notebook") {
          notebook = child;
          console.log("📒 Notebook found:", notebook.name);
        }
      }
        });

        // If model has animations
        if (glb.animations && glb.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            glb.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
            });
        }
    },
    undefined,
    (error) => {
        console.error('GLB load error:', error);
    }
);

//butterfly function pin
// Get the HTML element
const instructionBox = document.getElementById('instruction-box');

let notebook = null;
// Function to update instruction box position
function updateInstructionBox() {
  if (!notebook) return; // wait until notebook mesh is loaded

  // Get notebook position in 3D
  const pos = new THREE.Vector3();
  notebook.getWorldPosition(pos);

  // Project 3D position to 2D screen
  pos.project(camera);

  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

  // Move instruction box
  instructionBox.style.left = `${x}px`;
  instructionBox.style.top = `${y}px`;
}

let pinMeshOriginal = null; // the pin from GLB
let currentPin = null;      // for pin mode

const raycaster = new THREE.Raycaster();
raycaster.params.Mesh.threshold = 0.1;
const mouse = new THREE.Vector2();

function updateStatus(message) {
  const statusBar = document.getElementById('status-bar');
  if (statusBar) {
    statusBar.textContent = message;
  }
}

let pinnedHelpers = new Set();   // Track unique helpers pinned
// const requiredPins = 0;          // Total helpers needed
let pinningComplete = false;     // Prevent extra pins
const pinsGroup = new THREE.Group();
pinsGroup.name = "PinsGroup";
scene.add(pinsGroup);

document.getElementById("resetPinningBtn").addEventListener("click", () => {
  // Dispose and remove all children of pinsGroup
  while (pinsGroup.children.length > 0) {
    const pin = pinsGroup.children[0];

    pin.traverse((c) => {
      if (c.isMesh) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach(m => m.dispose && m.dispose());
          } else {
            c.material.dispose && c.material.dispose();
          }
        }
      }
    });

    pinsGroup.remove(pin);
  }

  // Reset variables
  pinnedHelpers.clear();
  pinningComplete = false;
  currentPin = null;

  // Reset cursor & status
  document.body.style.cursor = "default";
  updateStatus("🔄 All pins removed. Start pinning again!");
  
    // 🖼️ HIDE real pinned insect image  ← ✅ PUT IT HERE
  const realContainer = document.getElementById("realInsectContainer");
  if (realContainer) {
    realContainer.style.display = "none";
  }
  
  if (instructionBox) {
    instructionBox.innerText = "All pins have been reset. Select the Pin tool to start again.";
  }

    // 👉 If you have a notebook UI element, clear it too
  // const instructionBox = document.getElementById("instruction-box");
if (instructionBox) {
  // Save original instruction
const originalInstruction = 
  "* Select the Pin tool to start pinning this insect.<br>" +
  "* Pin the red part of the Insect.";

instructionBox.innerHTML = originalInstruction;


  // Show temporary reset message
  instructionBox.innerHTML = "📝 Notebook cleared. Ready for new pinning notes.";

  // After 3 seconds, restore original text
  setTimeout(() => {
    instructionBox.innerHTML = originalInstruction;
  }, 3000); // 3000ms = 3 seconds
}


  console.log("🔄 Pinning reset (pins only)");
});


window.addEventListener("click", (event) => {
  if (pinningComplete) return; // ✅ Stop processing after completion
  // Convert mouse click to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Step 1: Check if user clicked the Pin mesh
  if (!currentPin && pinMeshOriginal) {
    const intersectsPin = raycaster.intersectObject(pinMeshOriginal, true);
    if (intersectsPin.length > 0) {
      currentPin = pinMeshOriginal; // Activate pin mode
      document.body.style.cursor = "url('/static/img/Pin.png') 8 8, auto";
      updateStatus("📌 Pin Mode Activated");
      console.log("📌 Pin mode activated");
      return;
    }
  }

if (currentPin && preservedInsect && helperMeshes.length > 0) {
  // const intersectsHelpers = raycaster.intersectObjects(preservedInsect.children, true);
  const intersectsHelpers = raycaster.intersectObjects(helperMeshes, true);

  if (intersectsHelpers.length > 0) {
    const obj = intersectsHelpers[0].object;
    const helperName = obj.name;

    if (!helperName.startsWith("Helper_")) {
      updateStatus("⚠ Not a valid helper spot!");
      return; // 🚫 ignore non-helpers
    }

    // ✅ If already pinned, stop immediately
    if (pinnedHelpers.has(helperName)) {
      updateStatus(`⚠ ${helperName} already pinned!`);
      currentPin = null; // exit pin mode
      document.body.style.cursor = "default";
      return;
    }

    // ✅ Register helper as pinned
    pinnedHelpers.add(helperName);

    // Clone and place pin
    const pinClone = pinMeshOriginal.clone();

    const surfaceNormal = intersectsHelpers[0].face.normal.clone();
    intersectsHelpers[0].object.localToWorld(surfaceNormal.add(intersectsHelpers[0].point));
    surfaceNormal.sub(intersectsHelpers[0].point).normalize();

    pinClone.position.copy(intersectsHelpers[0].point);
    pinClone.position.addScaledVector(surfaceNormal, 0.002);
    pinClone.scale.set(0.35, 0.35, 2);


    const plane = new THREE.Plane(surfaceNormal.clone(), -surfaceNormal.dot(intersectsHelpers[0].point));

    // const hitY = intersectsHelpers[0].point.y;
    
    pinClone.traverse((child) => {
      if (child.isMesh) {
        const mat = Array.isArray(child.material) ?
                child.material.map(m => m.clone()) :
                child.material.clone();
        // mat.transparent = true;

        mat.clippingPlanes = [plane];
        mat.clipIntersection = true;
        mat.clipShadows = true;
        mat.needsUpdate = true;
        child.material = mat;
      }
    });

    pinsGroup.add(pinClone);

    console.log("📍 Pin placed on", helperName);
    updateStatus(`✅ Pin placed on ${helperName}`);
     // Exit pin mode
    currentPin = null;
    document.body.style.cursor = "default";

        // Check completion
    if (pinnedHelpers.size >= requiredPins) {
      pinningComplete = true;
      updateStatus("🎉 Congratulations! You've finished pinning this insect.");
      if (instructionBox) {
        instructionBox.innerText =
          "🎉 Congratulations! You've successfully preserved this insect.\n" +
          "📸 A real preserved specimen is shown for reference.";
      }
      showRealPinnedInsect();
    }
  }
}
});

function showRealPinnedInsect() {
  const container = document.getElementById("realInsectContainer");
  const img = document.getElementById("realInsectImage");

  if (!container || !img) return;

  const src = realPinnedImages[currentInsectName];

  if (!src) {
    console.warn("⚠ No real pinned image for:", currentInsectName);
    return;
  }

  img.src = src;
  container.style.display = "block";
}

let requiredPins = 0;
let helperMeshes = [];
let preservedInsect = null;
///insect modal///////////////////////////
document.addEventListener("preserveInsect", (e) => {
  const { insect, name } = e.detail;
  currentInsectName = name; // ✅ store active insect

  if (!tableMesh) {
    console.warn("⚠ Table not loaded yet, cannot place insect");
    return;
  }

  // Remove old insect if exists
  if (preservedInsect) {
    scene.remove(preservedInsect);
  }

  // 🧭 Apply static placement if defined
  const config = insectPlacementConfig[name];
  if (config) {
    insect.position.copy(config.position);
    insect.rotation.copy(config.rotation);
    insect.scale.copy(config.scale);
    console.log(`📍 Static placement applied for: ${name}`);
  } else {
    console.warn(`⚠ No static config found for: ${name}, using default placement`);

    // fallback placement (centered on top of table)
    const box = new THREE.Box3().setFromObject(tableMesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    insect.position.copy(center);
    insect.position.y += size.y * 0.5 + 0.05;
    insect.scale.set(5, 5, 5);
  }

  // Add insect to scene
  preservedInsect = insect;
  scene.add(insect);
  console.log("✅ Insect preserved on table:", name);

  // 👉 Detect helpers dynamically
  helperMeshes = [];
  insect.traverse((child) => {
    if (child.isMesh && child.name.startsWith("Helper_")) {
      helperMeshes.push(child);
    }
  });

  requiredPins = helperMeshes.length; // ✅ each insect defines pins needed
  pinnedHelpers.clear();
  pinningComplete = false;
  console.log(`📌 This insect requires ${requiredPins} pins.`);

  // ✅ Show instructions immediately after preserving
  if (instructionBox) {
    instructionBox.innerText =
      `* Select the Pin tool to start pinning this insect.\n` +
      `* This insect requires ${requiredPins} pin(s) for preservation.`;
  }
});


// Rotation step
let rotateInterval = null;
const rotationSpeed = 0.05; // adjust speed

// function startRotation(direction) {
//   if (rotateInterval) return; // avoid duplicate intervals

//   rotateInterval = setInterval(() => {
//     if (!preservedInsect) return;

//     switch (direction) {
//       case "up":
//         preservedInsect.rotation.x -= rotationSpeed;
//         break;
//       case "down":
//         preservedInsect.rotation.x += rotationSpeed;
//         break;
//       case "left":
//         preservedInsect.rotation.y += rotationSpeed;
//         break;
//       case "right":
//         preservedInsect.rotation.y -= rotationSpeed;
//         break;
//     }
//   }, 50); // rotate every 50ms
// }

// function stopRotation() {
//   clearInterval(rotateInterval);
//   rotateInterval = null;
// }

// // Attach events
// document.getElementById("rotateUp").addEventListener("mousedown", () => startRotation("up"));
// document.getElementById("rotateUp").addEventListener("mouseup", stopRotation);
// document.getElementById("rotateUp").addEventListener("mouseleave", stopRotation);

// document.getElementById("rotateDown").addEventListener("mousedown", () => startRotation("down"));
// document.getElementById("rotateDown").addEventListener("mouseup", stopRotation);
// document.getElementById("rotateDown").addEventListener("mouseleave", stopRotation);

// document.getElementById("rotateLeft").addEventListener("mousedown", () => startRotation("left"));
// document.getElementById("rotateLeft").addEventListener("mouseup", stopRotation);
// document.getElementById("rotateLeft").addEventListener("mouseleave", stopRotation);

// document.getElementById("rotateRight").addEventListener("mousedown", () => startRotation("right"));
// document.getElementById("rotateRight").addEventListener("mouseup", stopRotation);
// document.getElementById("rotateRight").addEventListener("mouseleave", stopRotation);

// Static position, rotation, and scale settings per insect model

function animate() {
    requestAnimationFrame(animate);

    // Update mixer if animations exist
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    if (preservedInsect) {
        console.log("Insect Position:", preservedInsect.position);
        console.log("Rotation:", preservedInsect.rotation);
    }
    // Render scene
    renderer.render(scene, camera);
    // updateInstructionBox();
}
animate();
