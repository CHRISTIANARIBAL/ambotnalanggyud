import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#595959');
const canvas = document.getElementById('experience-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
let mixer;
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.shadowMap.enabled = false;
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const intersectObjects = [];
const intersectObjectsName = [
    "leftBelly",
    "rightBelly",
    "centerBelly",
    "rightTopSliceBelly",
    "leftTopSliceBelly",
    "rightBottomSliceBelly",
    "leftBottomSliceBelly",
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot"
];

const loader = new GLTFLoader();
loader.load('assets/load.glb', function (glb) {
    glb.scene.traverse((child) => {
        if (child.isMesh) {
            console.log("mesh found:", child.name);
        }
        if (intersectObjectsName.includes(child.name)) {
            intersectObjects.push(child);
        }
        if (child.isMesh && child.name === "speaker") {
            child.visible = false;   // Hide it
        }
        if (child.isMesh && child.name === "scalpel") {
            child.visible = false;   // Hide it
        }
    });
    console.log("Available animations:", glb.animations.map(a => a.name));
    const model = glb.scene;
    model.position.set(-1.2, -1, 0.4);
    scene.add(glb.scene);
    mixer = new THREE.AnimationMixer(model);
    glb.animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
    });

}, undefined, function (error) {
    console.error(error);
});

// ✅ Reset button event
document.querySelector("#resetBtn").addEventListener("click", () => {
    location.reload(); // 🔄 reload the entire page
});


const sun = new THREE.DirectionalLight(0xffffff, 1);
scene.add(sun);
const aspect = window.innerWidth / window.innerHeight;
const zoom = 2;
const camera = new THREE.OrthographicCamera(
    -aspect * zoom,
    aspect * zoom,
    zoom,
    -zoom,
    0.01,
    1000);
camera.position.y = 1;

const controls = new OrbitControls( camera, canvas);
controls.enabled = false;

controls.update();

function handleResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.left = -aspect * zoom;
    camera.right = aspect * zoom;  
    camera.top = zoom;
    camera.bottom = -zoom;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

const mouse = new THREE.Vector2();
function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function playAction(name) {
    Object.values(actions).forEach(a => {
        if (a.isRunning()) {
            a.fadeOut(0.2); // smoothly stop
        }
    });
    if (actions[name]) {
        actions[name].reset().setLoop(THREE.LoopOnce, 1);
        actions[name].clampWhenFinished = true;
        actions[name].fadeIn(0.2).play();
    }
}

let actions = {};
let intersectObject = "";
let currentStep = 0;
const clickSequence = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
    "centerBelly",
    "leftTopSliceBelly",
    "rightTopSliceBelly",
    "leftBottomSliceBelly", 
    "rightBottomSliceBelly",
]

const stepTools = {
    "leftHand": "dissectingPins",
    "rightHand": "dissectingPins",
    "leftFoot": "dissectingPins",
    "rightFoot": "dissectingPins",
    "centerBelly": "scissors",
    "rightTopSliceBelly": "scissors",
    "leftTopSliceBelly": "scissors",
    "rightBottomSliceBelly": "scissors",
    "leftBottomSliceBelly": "scissors",
    "leftBelly": "forceps",
    "rightBelly": "forceps"
    };


let currentTool = null;
const placedPins = [];
const pinnedParts = {
    leftHand: false,
    rightHand: false,
    leftFoot: false,
    rightFoot: false
};

function placePinImage(position) {
    const textureLoader = new THREE.TextureLoader();
    const pinTexture = textureLoader.load('assets/images/dissectingPins.png'); // path to your pin image
    const spriteMaterial = new THREE.SpriteMaterial({ map: pinTexture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 0.05; // small offset so it's above the surface
    sprite.scale.set(0.5, 0.52, 1); // tweak as needed
    scene.add(sprite);
    placedPins.push(sprite);
    console.log(`📌 Pin image placed at`, position);
}

function hideInstruction() {
  const instructionContainer = document.getElementById("instructionContainer");
  if (instructionContainer) {
    instructionContainer.style.display = "none";
  }
}

// Safe DOM access (script is module and loaded after HTML, but guard anyway)
const instructionImage = document.getElementById("instructionImage");
const instructionText = document.getElementById("instructionText");

// Tracks last shown step so we only update image when it changes
let lastShownStep = -1;
/**
 * Updates the bottom-right image holder and text.
 * step: integer (1-based)
 */
function showInstruction(step) {
  if (!instructionImage || !instructionText) return; // guard

  // prevent unnecessary updates
  if (step === lastShownStep) return;
  lastShownStep = step;

  // Map steps to file names & text — edit / extend as needed
  const stepMap = {
    1: { img: "assets/images/instruction-images/step-1-img.PNG", text: "Pin the left hand." },
    2: { img: "assets/images/instruction-images/step-2-img.PNG", text: "Pin the right hand." },
    3: { img: "assets/images/instruction-images/step-3-img.PNG", text: "Pin the left foot." },
    4: { img: "assets/images/instruction-images/step-4-img.PNG", text: "Pin the right foot." },
    5: { img: "assets/images/instruction-images/step-5-img.PNG", text: "Cut the center belly using scissor." },
    6: { img: "assets/images/instruction-images/step-6-img.PNG", text: "Use scissors to cut top-left belly." },
    7: { img: "assets/images/instruction-images/step-7-img.PNG", text: "Use scissors to cut top-right belly." },
    8: { img: "assets/images/instruction-images/step-8-img.PNG", text: "Use scissors to cut bottom-left belly." },
    9: { img: "assets/images/instruction-images/step-9-img.PNG", text: "Use scissors to cut bottom-right belly." },
    10:{ img: "assets/images/instruction-images/step-10-img.PNG", text: "Open belly with forceps." }
  };

  const entry = stepMap[step] || { img: "/static/instruction-images/default.png", text: "" };

  // Insert image with tailwind-friendly classes (your HTML has tailwind)
  instructionImage.innerHTML = `
    <img
      src="${entry.img}"
      alt="Step ${step}"
      class="w-full h-full object-cover rounded-lg transition-opacity duration-500"
      onerror="this.onerror=null; this.src='/static/instruction-images/default.png'">
  `;

  instructionText.textContent = entry.text;
}


function updateInstruction(mesh, message) {
    const instruction = document.getElementById("instruction");
    let x, y;

    if (mesh) {
        const vector = new THREE.Vector3();
        mesh.getWorldPosition(vector);
        vector.project(camera);

        x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        y = -(vector.y * 0.5 - 0.5) * window.innerHeight;

        const offsetX = 0;   // move text to the right of the mesh
        const offsetY = -100;  // move text above the mesh

        x += offsetX;
        y += offsetY;

        x = Math.max(100, Math.min(window.innerWidth - 100, x));
        y = Math.max(100, Math.min(window.innerHeight - 100, y));
    } else {
        x = window.innerWidth / 2;
        y = 100;
    }
    instruction.style.left = `${x}px`;
    instruction.style.top = `${y}px`;
    instruction.style.transform = "translateX(-50%)";
    instruction.style.maxWidth = "220px";   // limit width
    instruction.style.whiteSpace = "normal"; // allow wrapping
    instruction.style.textAlign = "center";  // cleaner look
    instruction.innerText = message;
    instruction.style.display = "block";

        // ✅ Extract current step number (based on sliceStep)
    const stepNumber = Math.min(sliceStep + 1, 10);
    showInstruction(stepNumber);
}

function handleSlice() {
    const notebook = scene.getObjectByName("notebook");
    sliceStep++;
    if (sliceStep < instructions.length) {
        updateInstruction(notebook, instructions[sliceStep]);
    } else {
        organStep = 0;
        updateInstruction(notebook, organInstructions[organStep]);
    }
}
let selectedOrgan = null;
const droppedOrgans = new Set(); // to avoid dropping twice
let leftBellyOpened = false;
let rightBellyOpened = false;

let selectedTool = null;

function showWarning(message) {
    const popup = document.getElementById("warningPopup");
    popup.textContent = message; // change message
    popup.classList.remove("hidden");

    // Auto-hide after 2 seconds
    setTimeout(() => {
        popup.classList.add("hidden");
    }, 3000);
}

window.isPopupActive = false;
function onClick() {
    if (window.isPopupActive) {
        console.log("🚫 Popup open, ignoring scene clicks");
        return; // block interaction
    }

    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log(intersectObject);

        if (intersects.length > 0) {
        const clicked = intersects[0].object;
            // handleClick(clicked, currentTool);

        const organNames = [
            "heart", "fatBodies", "gallBladder", "kidneys", "largeIntestine",
            "liver", "lungs", "rectum", "smallIntestine", "stomach", "urinaryBladder"
            ];
        if (organNames.includes(clicked.name)) {
            if (selectedOrgan === clicked) {
                resetHighlight(selectedOrgan);
                selectedOrgan = null;
                console.log(`❌ Deselected ${clicked.name}`);
            } else {
                resetHighlight(selectedOrgan);
                selectedOrgan = clicked;

                if (!originalColors.has(clicked.uuid)) {
                    originalColors.set(clicked.uuid, clicked.material.color.clone());
                }
                clicked.material = clicked.material.clone();
                clicked.material.color.set(0x00ff00); // green highlight
                showWarning(`✅ Selected organ: ${clicked.name}`);
                console.log(`✅ Selected organ: ${clicked.name}`);
            }
            return; // stop further click logic
        }
        
        // ✅ Drop selected organ into tray if clicked
        if (clicked.name === "Plane026" && selectedOrgan && !droppedOrgans.has(selectedOrgan.name)) {
            showWarning(`📥 Dropped ${selectedOrgan.name} into tray`)
            console.log(`📥 Dropped ${selectedOrgan.name} into tray`);

            const dropPoint = intersects[0].point.clone();
            dropPoint.y += 2;
            dropPoint.x += 1.3;
            dropPoint.z -= 0.5;

            selectedOrgan.position.copy(dropPoint);

            droppedOrgans.add(selectedOrgan.name);
            resetHighlight(selectedOrgan);
            selectedOrgan = null;

            organStep++;
            const notebook = scene.getObjectByName("notebook");
            if (notebook) {
                if (droppedOrgans.size < organNames.length) {
                updateInstruction(notebook, organInstructions[0]);
                }
                else {
                    updateInstruction(notebook, "✅ All organs placed! Dissection complete.");
                }
            }
            return;
        }
        
        if (["scalpel", "scissors", "dissectingPins", "forceps"].includes(clicked.name)) {
            currentTool = clicked.name;
            selectedTool = clicked.name;
            document.body.classList.remove("scalpel-cursor", "scissors-cursor", "forceps-cursor", "dissectingPins-cursor");
            document.body.classList.add(`${currentTool}-cursor`);

             console.log(`Tool selected: ${currentTool}`);
             console.log(`Body class list`, document.body.classList);
            
             //test if image pasth exist
             const cursorPath = `assets/images/cursor-images/${currentTool}.png`;
             const testImg = new Image();
             testImg.src = cursorPath;
             testImg.onload = () => console.log(`✅cursor image loaded: ${cursorPath}`);
             testImg.onerror = () => console.error(`❌cursor image not found: ${cursorPath}`);
            return;//dont process slice logic here
        }

        const expectedName = clickSequence[currentStep];
        const requiredTool = stepTools[expectedName];
        ///////////////////////////////
        // handleClick(clicked, currentTool);
        if (["leftHand", "rightHand", "leftFoot", "rightFoot"].includes(clicked.name) 
    && currentTool === "dissectingPins") {
            // 🧠 Show image + text for the corresponding step
            if (clicked.name === "leftHand") showInstruction(1, "Pin the left hand.");
            if (clicked.name === "rightHand") showInstruction(2, "Pin the right hand.");
            if (clicked.name === "leftFoot") showInstruction(3, "Pin the left foot.");
            if (clicked.name === "rightFoot") showInstruction(4, "Pin the right foot.");

            if (pinnedParts[clicked.name]) {
                showWarning(`${clicked.name} already has a pin. Skipping.`);
                console.log(`⚠️ ${clicked.name} already has a pin. Skipping.`);
                return; // Prevent adding duplicate pin
            }
            console.log(`Pinned ${clicked.name}`);
            const hitPoint = intersects[0].point; 
            placePinImage(hitPoint)
            pinnedParts[clicked.name] = true;
            currentStep++; // move to next step
            sliceStep++;   // ✅ add this line so instructions proceed

            const notebook = scene.getObjectByName("notebook"); // must match your GLB name
            if (notebook) {
                updateInstruction(notebook, `Step ${currentStep}: Do ${clickSequence[currentStep]}`);
                // playNarrationForStep(clicked.name);
            }
            return;
        }
        //slicing logic
        
        if (clicked.name === expectedName && currentTool === requiredTool) {
            console.log(`correct tool: (${currentTool}) on ${clicked.name}`);
            clicked.visible = false;
            currentStep++;
            sliceStep++;
            if (currentStep === clickSequence.length) {
                console.log("all Slices clicked. playing animation");
            } else {
                console.log(`next expected: ${clickSequence[currentStep]} with tool ${stepTools[clickSequence[currentStep]]}`);  
                showWarning(`next expected: ${clickSequence[currentStep]} with tool ${stepTools[clickSequence[currentStep]]}`);
                }
                return;
            }

            if (currentStep >= clickSequence.length) {
                if (clicked.name === "leftBelly" && currentTool === "forceps") {
                    console.log("Play left belly");
                    playAction("leftBellyAnimation");
                    leftBellyOpened = true;
                    handleSlice();
                    // return;
                } 
                if (clicked.name === "rightBelly" && currentTool === "forceps") {
                    console.log("Play right belly animation");
                    playAction("rightBellyAnimation");
                    rightBellyOpened = true;
                    handleSlice();
                    // return;
                }
                if (leftBellyOpened && rightBellyOpened) {
                    console.log("✅ Belly fully opened, moving to organ dissection phase.");

                     const instructionContainer = document.getElementById("instructionContainer");
                      if (instructionContainer) {
                        instructionContainer.style.transition = "opacity 0.8s ease";
                        instructionContainer.style.opacity = "0";
                        setTimeout(() => {
                        instructionContainer.style.display = "none";
                        }, 800);
                    organStep = 0;
                    const notebook = scene.getObjectByName("notebook");
                    if (notebook) {
                        updateInstruction(notebook, organInstructions[organStep]);
                    }
                }
                return;
            }
             
                
        } else {
            showWarning(`Hey, wrong tool. Need ${requiredTool} for ${expectedName}`);
            console.log(`wrong tool. Need ${requiredTool} for ${expectedName}`);
        }
    } else {
        document.body.style.cursor = "default";  
    }
};

const tooltip = document.getElementById('tooltip');
window.addEventListener('resize', handleResize);
window.addEventListener('click', onClick);
window.addEventListener( 'pointermove', onPointerMove );

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        if (hovered.name) {
            tooltip.innerText = hovered.name;
            tooltip.style.left = event.clientX + 10 + 'px'; // offset so not on top of cursor
            tooltip.style.top = event.clientY + 10 + 'px';
            tooltip.style.display = 'block';
        }
    } else {
        tooltip.style.display = 'none';
    }
});

let lastHighlighted = null; // track previously highlighted mesh
const originalColors = new Map(); // store original material colors
const instructions = [
  "Step 1: Secure the frog by pinning each of its four limbs to the pan through the hands and feet.\n -- Pin the left hand using dissectingPins",
  "Step 1: Secure the frog by pinning each of its four limbs to the pan through the hands and feet.\n -- Pin the right hand using dissectingPins",
  "Step 1: Secure the frog by pinning each of its four limbs to the pan through the hands and feet.\n -- Pin the left foot using dissectingPins",
  "Step 1: Secure the frog by pinning each of its four limbs to the pan through the hands and feet.\n -- Pin the right foot using dissectingPins",
  "Step 2: Make an incision with the scissor along the midline of the frog's belly, Slice: down to top",
  "Step 3: Using Scissors cut the top left belly, top right belly,  bottom left belly, bottom right belly according to the instructions sequence",
  "Step 3: Using Scissors cut the top left belly, top right belly,  bottom left belly, bottom right belly according to the instructions sequence",
    "Step 3: Using Scissors cut the top left belly, top right belly,  bottom left belly, bottom right belly according to the instructions sequence",
    "Step 3: Using Scissors cut the top left belly, top right belly,  bottom left belly, bottom right belly according to the instructions sequence",
  "Step 4: Open belly with forceps",
];

let sliceStep = 0;
let organStep = 0;
const organInstructions = [
  "Step 5: Select Organs and drop into tray",
];

function animate() {
  	raycaster.setFromCamera( pointer, camera );
	const intersects = raycaster.intersectObjects( intersectObjects, true );

    if(intersects.length > 0) {
        const object = intersects[0].object;
        const expectedName = clickSequence[currentStep];

        if (object.name === expectedName) {
             if (lastHighlighted !== object) {
                resetHighlight(lastHighlighted);
                if (!originalColors.has(object.uuid)) {
                    originalColors.set(object.uuid, object.material.color.clone());
                }
                object.material = object.material.clone();
                object.material.color.set(0xff0000);
                lastHighlighted = object;
            }
        } else {
            resetHighlight(lastHighlighted);
            lastHighlighted = null;
        }
    } else {
            resetHighlight(lastHighlighted);
            lastHighlighted = null;
        }

    const notebook = scene.getObjectByName("notebook");
    if (notebook) {
        if (sliceStep < instructions.length) {
            updateInstruction(notebook, instructions[sliceStep]);
        } else if (organStep < organInstructions.length) {
            updateInstruction(notebook, organInstructions[organStep]);
        }
    }

    const delta = clock.getDelta();
    if(mixer) mixer.update(delta);
    renderer.render( scene, camera );
}

    function resetHighlight(mesh) {
        if (mesh && originalColors.has(mesh.uuid)) {
            mesh.material.color.copy(originalColors.get(mesh.uuid));
        }
    }

renderer.setAnimationLoop( animate );

