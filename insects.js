console.log("insects.js LOADED!");

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* =====================================================
   THREE.JS SETUP (OUTSIDE DOMContentLoaded)
===================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color("#504b49");

const canvas = document.getElementById("insectCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
camera.position.set(0, 1, 3);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 3));
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(5, 10, 5));
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(-5, -5, -5));

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize function
function ensureRendererSize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return false;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const needResize =
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr);

    if (needResize) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}
window.addEventListener("resize", ensureRendererSize);

/* =====================================================
   INSECT INFORMATION
===================================================== */
const insectInfo = {
    ladybug: {
        commonName: "Lady Bug",
        scientificName: "Coccinellidae",
        pinningMethod: "Pinning Method, Point-Mounting Method, Alcohol Preservation, Freezing (temporary)",
        description: "Coleoptera"
    },
    grasshopper: {
        commonName: "Giant Green Grasshopper",
        scientificName: "Valanga nigricornis",
        pinningMethod: "Pinning Method, Alcohol Preservation, Freezing Method (Short-Term Only)",
        description: "Orthoptera"
    },
    stink: {
        commonName: "Stink Bug",
        scientificName: "Ichneumonidae",
        pinningMethod: "Pinning Method, Ethanol Preservation",
        description: "Hymenoptera"
    },
    wasps: {
        commonName: "Yellowjacket Wasps",
        scientificName: "Vespidae",
        pinningMethod: "Pinning Method, Ethanol Preservation, Freezing Method (Short-Term Only)",
        description: "Hymenoptera"
    },
    carpenter_ant: {
        commonName: "Carpenter Ant",
        scientificName: "Camponotus pennsylvanicus",
        pinningMethod: "Pinning Method, ethanol only for soft specimens",
        description: "Order: Hymenoptera"
    },
    honey_bee: {
        commonName: "Honey Bee",
        scientificName: "Apis mellifera",
        pinningMethod: "Pinnning method, ethanol preservation (70%)",
        description: "Order: Hymenoptera"
    },
    houseflies: {
        commonName: "House Fly",
        scientificName: "Musca domestica",
        pinningMethod: "Pinning method, ethanol preservation (70%), drying method",
        description: "Order: Diptera"
    }
};

/* =====================================================
   MODEL LOADING
===================================================== */
const loader = new GLTFLoader();
const insectModels = [
    "assets/models/insects/stink.glb",
    "assets/models/insects/wasps.glb",
    "assets/models/insects/ladybug.glb",
    "assets/models/insects/grasshopper.glb",
    "assets/models/insects/carpenter_ant.glb",
    "assets/models/insects/honey_bee.glb",
    "assets/models/insects/houseflies.glb",
];

let currentInsectIndex = 0;
let currentModel = null;

function clearCurrentModel() {
    if (!currentModel) return;
    scene.remove(currentModel);

    currentModel.traverse((c) => {
        c.geometry?.dispose?.();
        if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose?.());
            else c.material.dispose?.();
        }
    });

    currentModel = null;
}

function loadInsect(index) {

    const modelPath = insectModels[index];
    clearCurrentModel();
    ensureRendererSize();

    loader.load(
        modelPath,
        gltf => {
            currentModel = gltf.scene;

            scene.add(currentModel);
            currentModel.updateMatrixWorld(true);

            // Compute correct insect key
            const insectKey = modelPath.split("/").pop().replace(".glb", "").toLowerCase();

            // Dispatch event to update UI text
            document.dispatchEvent(
                new CustomEvent("insectLoaded", {
                    detail: { name: insectKey, model: currentModel }
                })
            );

            // Fit camera
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            currentModel.position.sub(center);
            currentModel.updateMatrixWorld(true);

            const maxDim = Math.max(size.x, size.y, size.z);
            const scaleFactor = 1 / maxDim;

            if (scaleFactor > 10 || scaleFactor < 0.1) {
                currentModel.scale.multiplyScalar(scaleFactor);
            }

            const fov = camera.fov * Math.PI / 180;
            const camZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
            camera.position.set(0, size.y * 0.3, camZ * 1.5);

            controls.target.set(0, 0, 0);
            controls.update();
        }
    );
}

/* =====================================================
   DOM + UI TEXT UPDATE (INSIDE DOMContentLoaded)
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM READY — UI linked.");

    const scientificName = document.getElementById("scientificName");
    const commonName = document.getElementById("commonName");
    const pinningMethod = document.getElementById("pinningMethod");
    const insectDescription = document.getElementById("insectDescription");
    const insectLabel = document.getElementById("insectLabel");

    // When insect model finishes loading → update text
    document.addEventListener("insectLoaded", (e) => {
        const key = e.detail.name;
        const info = insectInfo[key];

        if (!info) return;

        scientificName.textContent = info.scientificName;
        commonName.textContent = info.commonName;
        pinningMethod.textContent = info.pinningMethod;
        insectDescription.textContent = info.description;
        insectLabel.textContent = key.toUpperCase();
    });

    /* ================================
       Modal + Navigation Buttons
    ================================= */
    const modal = document.getElementById("popupInsect");
    const openBtn = document.getElementById("openInsect");
    const closeBtn = document.getElementById("closeInsect");
    const nextBtn = document.getElementById("nextInsect");
    const prevBtn = document.getElementById("prevInsect");
    const preserveBtn = document.getElementById("preserveInsect");

    openBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
        ensureRendererSize();
        loadInsect(currentInsectIndex);
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        clearCurrentModel();
    });

    nextBtn.addEventListener("click", () => {
        currentInsectIndex = (currentInsectIndex + 1) % insectModels.length;
        loadInsect(currentInsectIndex);
    });

    prevBtn.addEventListener("click", () => {
        currentInsectIndex = (currentInsectIndex - 1 + insectModels.length) % insectModels.length;
        loadInsect(currentInsectIndex);
    });

    preserveBtn.addEventListener("click", () => {
        if (!currentModel) return;

        const clone = currentModel.clone(true);
        clone.traverse(obj => {
    if (obj.isMesh) {
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material = obj.material.map(m => m.clone());
            } else {
                obj.material = obj.material.clone();
            }
        }
    }
});


        const name = insectModels[currentInsectIndex].split("/").pop().replace(".glb", "");

        document.dispatchEvent(new CustomEvent("preserveInsect", {
            detail: { insect: clone, name }
        }));

        modal.classList.add("hidden");
    });
});

/* =====================================================
   Animation Loop
===================================================== */
function animate() {
    requestAnimationFrame(animate);
    ensureRendererSize();

    if (currentModel) currentModel.rotation.y -= 0.002;

    controls.update();
    renderer.render(scene, camera);
}
animate();
