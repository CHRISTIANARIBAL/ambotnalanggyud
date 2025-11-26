import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const fontLoader = new FontLoader();
// window.addEventListener("DOMContentLoaded", () => {
//     document.body.style.cursor = "default";
// });

const openBtn = document.getElementById("open3D");
const closeBtn = document.getElementById("close3D");
const popup = document.getElementById("popup3D");
const prevBtn = document.getElementById("prevOrgan");
const nextBtn = document.getElementById("nextOrgan");
const canvas = document.getElementById("organCanvas");

console.log("🔎 Elements:", { openBtn, closeBtn, popup, prevBtn, nextBtn, canvas });

// Safety check
if (!openBtn || !closeBtn || !popup || !canvas) {
  console.error("❌ One or more HTML elements not found! Check your index.html IDs.");
}

// Event listeners
openBtn?.addEventListener("click", () => {
  console.log("👉 Open button clicked");
  popup.style.display = "flex";   // ✅ show popup
  window.isPopupActive = true; 
  initOrganViewer();
  updateRendererSize();
});

closeBtn?.addEventListener("click", () => {
  console.log("👉 Close button clicked");
  window.isPopupActive = false; 
  popup.style.display = "none";   // ✅ hide popup
});

// Setup Three.js scene for organ viewer
let scene, camera, renderer, loader, controls;
let organIndex = 0;
const organs = [
  "assets/models/organs/heart.glb",
  "assets/models/organs/fatBodies.glb",
  "assets/models/organs/kidneys.glb",
  "assets/models/organs/liver.glb",
  "assets/models/organs/lungs.glb",
  "assets/models/organs/rectum.glb",
  "assets/models/organs/smallIntestine.glb",
  "assets/models/organs/stomach.glb",
  "assets/models/organs/urinaryBladder.glb",
];

function initOrganViewer() {
  console.log("🚀 Initializing organ viewer...");
  if (renderer) {
    console.log("♻️ Reusing existing renderer");
    return;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // soft light everywhere
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5); // position it above & front
scene.add(directionalLight);

const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(-5, -5, -5); // softer back light
scene.add(backLight);

  camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 5); // further back


  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  loader = new GLTFLoader();
  controls = new OrbitControls(camera, renderer.domElement);

  loadOrgan(organIndex);
  animate();
}

const organLabel = document.getElementById("organLabel");
const organNames = [
    "Heart: The frog’s heart is the center of its circulatory system, responsible for pumping blood throughout the body to deliver nutrients and oxygen and maintain vital body functions.",
    "Fat Bodies: Fat bodies are yellowish, finger-like structures that store energy and help frogs survive periods of low food availability, especially during hibernation and breeding.",
    "Kidneys: Kidneys filter waste from the blood and help maintain the frog’s water and salt balance, ensuring proper body regulation",
    "Liver: The liver helps process nutrients, store energy, and remove toxins from the frog’s body, supporting overall metabolic function",
    "Lungs: Lungs allow the frog to breathe air by taking in oxygen and releasing carbon dioxide, especially when it is on land.",
    "Rectum: The rectum is the final part of the frog’s digestive path where waste is stored before being released from the body.",
    "Small Intestine: The small intestine continues digestion and absorbs nutrients from the food so the frog’s body can use them for energy and growth.",
    "Stomach: The stomach breaks down the frog’s food into simpler substances so it can be further digested and absorbed by the body.",
    "Urinary Bladder: The urinary bladder stores liquid waste until the frog is ready to release it from the body."
];
let currentOrgan;

function loadOrgan(index) {
  const modelPath = organs[index];
  console.log("📦 Attempting to load organ:", modelPath);

  if (currentOrgan) {
    console.log("🧹 Removing previous organ...");
    scene.remove(currentOrgan);
    currentOrgan.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
    currentOrgan = null;
  }

loader.load(
  modelPath,
  (gltf) => {
    console.log("✅ Successfully loaded organ:", modelPath);

    const model = gltf.scene;

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.log("📐 Bounding box size:", size);
    console.log("🎯 Model center:", center);

    // Create wrapper to center and scale
    const wrapper = new THREE.Group();
    wrapper.add(model);

    // Move model so its center is at origin
    model.position.x -= center.x;
    model.position.y -= center.y;
    model.position.z -= center.z;

    // Aggressive scaling to fit inside camera view
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 1 / maxDim; // scale down more
    wrapper.scale.setScalar(scaleFactor);
    console.log("📏 Applied scale factor:", scaleFactor);

    // Reset camera & controls
    camera.position.set(0, 1.5, 0);
    controls.target.set(0, 0, 0);
     controls.enabled = true;
    controls.update();


    // Add to scene
    if (currentOrgan) scene.remove(currentOrgan);
    scene.add(wrapper);
    currentOrgan = wrapper;
    console.log("🎉 Organ centered and added to scene");

    if (organLabel) {
      organLabel.innerText = organNames[index];
    }
  },
  (xhr) => {
    if (xhr.total) {
      console.log(`⏳ Loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    } else {
      console.log(`⏳ Loaded bytes: ${xhr.loaded}`);
    }
  },
  (err) => console.error("❌ Error loading organ:", err)
);
}

window.addEventListener("resize", updateRendererSize);

function animate() {
  requestAnimationFrame(animate);

    if (currentOrgan) {
    // currentOrgan.rotation.x += 0.001;
    currentOrgan.rotation.z += 0.005;
    // currentOrgan.rotation.z += 0.001;  
  }
  controls.update();
  renderer.render(scene, camera);
}
function updateRendererSize() {
  if (!renderer || !canvas) return;
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  if (camera.isPerspectiveCamera) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
}

prevBtn?.addEventListener("click", () => {
  organIndex = (organIndex - 1 + organs.length) % organs.length;
  console.log("⬅️ Prev organ:", organIndex);
  loadOrgan(organIndex);
});

nextBtn?.addEventListener("click", () => {
  organIndex = (organIndex + 1) % organs.length;
  console.log("➡️ Next organ:", organIndex);
  loadOrgan(organIndex);
});
