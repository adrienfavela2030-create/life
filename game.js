import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/webxr/VRButton.js";

/*
=========================================================
LIFE: WebXR
game.js
Core VR player, movement, grabbing, interaction,
inventory, objects, NPC awareness and game systems.
=========================================================
*/

/* ======================================================
   CORE
====================================================== */

const game = document.getElementById("game");

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87b9df);

scene.fog = new THREE.Fog(
  0x87b9df,
  30,
  180
);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.05,
  500
);

camera.position.set(
  0,
  1.7,
  12
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.5)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.xr.enabled = true;

game.appendChild(
  renderer.domElement
);

document.body.appendChild(
  VRButton.createButton(renderer)
);

/* ======================================================
   LIGHTING
====================================================== */

const ambient = new THREE.HemisphereLight(
  0xffffff,
  0x404040,
  2
);

scene.add(ambient);

const sun = new THREE.DirectionalLight(
  0xffffff,
  2
);

sun.position.set(
  30,
  50,
  20
);

scene.add(sun);

/* ======================================================
   GAME STATE
====================================================== */

const Game = {

  money: 500,

  job: "Unemployed",

  health: 100,

  hunger: 100,

  energy: 100,

  happiness: 100,

  day: 0,

  minutes: 8 * 60,

  inventory: [],

  heldObjects: {
    left: null,
    right: null
  },

  settings: {
    grabDistance: 3,
    walkSpeed: 4.5,
    runSpeed: 7
  }

};

/* ======================================================
   HUD
====================================================== */

const hud = {

  money: document.getElementById("money"),

  job: document.getElementById("job"),

  time: document.getElementById("time"),

  day: document.getElementById("day")

};

function updateHUD() {

  if (hud.money) {
    hud.money.textContent =
      "$" + Math.floor(Game.money);
  }

  if (hud.job) {
    hud.job.textContent =
      Game.job;
  }

  if (hud.time) {

    const hour =
      Math.floor(Game.minutes / 60);

    const minute =
      Math.floor(Game.minutes % 60);

    hud.time.textContent =
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0");
  }

  if (hud.day) {

    const names = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    hud.day.textContent =
      names[Game.day % 7];
  }
}

/* ======================================================
   MESSAGE SYSTEM
====================================================== */

function showMessage(text) {

  const element =
    document.getElementById("message");

  if (!element) return;

  element.textContent = text;

  element.classList.add("show");

  clearTimeout(
    showMessage.timeout
  );

  showMessage.timeout =
    setTimeout(() => {

      element.classList.remove("show");

    }, 2200);
}

/* ======================================================
   MATERIALS
====================================================== */

const materials = {

  ground:
    new THREE.MeshStandardMaterial({
      color: 0x4b7042
    }),

  road:
    new THREE.MeshStandardMaterial({
      color: 0x292d32
    }),

  sidewalk:
    new THREE.MeshStandardMaterial({
      color: 0x888888
    }),

  house:
    new THREE.MeshStandardMaterial({
      color: 0xd4ad89
    }),

  roof:
    new THREE.MeshStandardMaterial({
      color: 0x303641
    }),

  glass:
    new THREE.MeshStandardMaterial({
      color: 0x76b6d5,
      roughness: 0.15,
      metalness: 0.1
    }),

  wood:
    new THREE.MeshStandardMaterial({
      color: 0x5a3923
    }),

  metal:
    new THREE.MeshStandardMaterial({
      color: 0x777d83,
      metalness: 0.65,
      roughness: 0.3
    }),

  white:
    new THREE.MeshStandardMaterial({
      color: 0xe9e9e9
    }),

  red:
    new THREE.MeshStandardMaterial({
      color: 0xb84b43
    }),

  blue:
    new THREE.MeshStandardMaterial({
      color: 0x416da4
    }),

  green:
    new THREE.MeshStandardMaterial({
      color: 0x467644
    }),

  tree:
    new THREE.MeshStandardMaterial({
      color: 0x315d30
    }),

  trunk:
    new THREE.MeshStandardMaterial({
      color: 0x66432a
    })

};

/* ======================================================
   OBJECT REGISTRIES
====================================================== */

const interactiveObjects = [];

const grabbableObjects = [];

const physicalObjects = [];

const npcs = [];

const vehicles = [];

const buildings = [];

/* ======================================================
   BASIC OBJECT HELPERS
====================================================== */

function createBox(
  x,
  y,
  z,
  width,
  height,
  depth,
  material
) {

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(
      width,
      height,
      depth
    ),
    material
  );

  mesh.position.set(
    x,
    y,
    z
  );

  scene.add(mesh);

  physicalObjects.push(mesh);

  return mesh;
}

function createSphere(
  x,
  y,
  z,
  radius,
  material
) {

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      16,
      12
    ),
    material
  );

  mesh.position.set(
    x,
    y,
    z
  );

  scene.add(mesh);

  physicalObjects.push(mesh);

  return mesh;
}

/* ======================================================
   INTERACTABLE SYSTEM
====================================================== */

function makeInteractive(
  object,
  name,
  callback
) {

  object.userData.interactive = true;

  object.userData.interactionName =
    name;

  object.userData.onInteract =
    callback;

  interactiveObjects.push(object);

  return object;
}

/* ======================================================
   GRABBABLE SYSTEM
====================================================== */

function makeGrabbable(
  object,
  name,
  options = {}
) {

  object.userData.grabbable = true;

  object.userData.grabName =
    name;

  object.userData.mass =
    options.mass ?? 1;

  object.userData.throwable =
    options.throwable !== false;

  object.userData.originalPosition =
    object.position.clone();

  grabbableObjects.push(object);

  return object;
}

/* ======================================================
   CREATE PHYSICS-LIKE OBJECT
====================================================== */

function createPhysicsObject(
  name,
  geometry,
  material,
  position
) {

  const object =
    new THREE.Mesh(
      geometry,
      material
    );

  object.position.copy(
    position
  );

  object.userData.grabbable = true;

  object.userData.grabName =
    name;

  object.userData.mass = 1;

  object.userData.velocity =
    new THREE.Vector3();

  object.userData.angularVelocity =
    new THREE.Vector3();

  object.userData.lastPosition =
    object.position.clone();

  object.userData.isHeld = false;

  scene.add(object);

  grabbableObjects.push(object);

  return object;
}

/* ======================================================
   PLAYER RIG
====================================================== */

const player = new THREE.Group();

player.position.set(
  0,
  0,
  10
);

scene.add(player);

player.add(camera);

/* ======================================================
   VR CONTROLLERS
====================================================== */

const leftController =
  renderer.xr.getController(0);

const rightController =
  renderer.xr.getController(1);

scene.add(
  leftController,
  rightController
);

/* ======================================================
   CONTROLLER GRIPS
====================================================== */

function createControllerVisual() {

  const group = new THREE.Group();

  const palm = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.13,
      0.08,
      0.18
    ),
    new THREE.MeshStandardMaterial({
      color: 0xc99070
    })
  );

  group.add(palm);

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const finger =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.015,
          0.08,
          3,
          5
        ),
        new THREE.MeshStandardMaterial({
          color: 0xc99070
        })
      );

    finger.position.set(
      (i - 2) * 0.028,
      0,
      -0.105
    );

    group.add(finger);
  }

  return group;
}

const leftHand =
  createControllerVisual();

const rightHand =
  createControllerVisual();

leftController.add(
  leftHand
);

rightController.add(
  rightHand
);

/* ======================================================
   GRAB STATE
====================================================== */

const controllerState = {

  left: {
    object: null,
    pressed: false
  },

  right: {
    object: null,
    pressed: false
  }

};

/* ======================================================
   FIND NEAREST OBJECT
====================================================== */

function findNearestGrabbable(
  controller
) {

  let closest = null;

  let closestDistance =
    Game.settings.grabDistance;

  const controllerPosition =
    new THREE.Vector3();

  controller.getWorldPosition(
    controllerPosition
  );

  for (
    const object of grabbableObjects
  ) {

    if (
      object.userData.isHeld
    ) {
      continue;
    }

    const distance =
      controllerPosition.distanceTo(
        object.getWorldPosition(
          new THREE.Vector3()
        )
      );

    if (
      distance < closestDistance
    ) {

      closestDistance =
        distance;

      closest = object;
    }
  }

  return closest;
}

/* ======================================================
   GRAB OBJECT
====================================================== */

function grabObject(
  controller,
  hand
) {

  const object =
    findNearestGrabbable(
      controller
    );

  if (!object) {

    showMessage(
      "Nothing nearby to grab."
    );

    return;
  }

  object.userData.isHeld =
    true;

  object.userData.previousParent =
    object.parent;

  controller.add(
    object
  );

  object.position.set(
    0,
    0,
    -0.25
  );

  object.rotation.set(
    0,
    0,
    0
  );

  controllerState[hand].object =
    object;

  Game.heldObjects[hand] =
    object;

  showMessage(
    "Grabbed " +
    object.userData.grabName
  );
}

/* ======================================================
   RELEASE OBJECT
====================================================== */

function releaseObject(
  controller,
  hand
) {

  const object =
    controllerState[hand].object;

  if (!object) return;

  const worldPosition =
    new THREE.Vector3();

  const worldQuaternion =
    new THREE.Quaternion();

  controller.getWorldPosition(
    worldPosition
  );

  controller.getWorldQuaternion(
    worldQuaternion
  );

  scene.add(object);

  object.position.copy(
    worldPosition
  );

  object.quaternion.copy(
    worldQuaternion
  );

  object.userData.isHeld =
    false;

  object.userData.velocity =
    new THREE.Vector3();

  controllerState[hand].object =
    null;

  Game.heldObjects[hand] =
    null;

  showMessage(
    "Released " +
    object.userData.grabName
  );
}

/* ======================================================
   CONTROLLER EVENTS
====================================================== */

function setupController(
  controller,
  hand
) {

  controller.addEventListener(
    "selectstart",
    () => {

      controllerState[hand].pressed =
        true;

      grabObject(
        controller,
        hand
      );
    }
  );

  controller.addEventListener(
    "selectend",
    () => {

      controllerState[hand].pressed =
        false;

      releaseObject(
        controller,
        hand
      );
    }
  );
}

setupController(
  leftController,
  "left"
);

setupController(
  rightController,
  "right"
);

/* ======================================================
   INTERACTION RAY
====================================================== */

const raycaster =
  new THREE.Raycaster();

function interactFromController(
  controller
) {

  const origin =
    new THREE.Vector3();

  const direction =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  controller.getWorldPosition(
    origin
  );

  direction.applyQuaternion(
    controller.quaternion
  );

  raycaster.set(
    origin,
    direction
  );

  const hits =
    raycaster.intersectObjects(
      interactiveObjects,
      true
    );

  if (!hits.length) {

    showMessage(
      "Nothing to interact with."
    );

    return;
  }

  let target =
    hits[0].object;

  while (
    target &&
    !target.userData.interactive
  ) {

    target =
      target.parent;
  }

  if (
    target &&
    target.userData.onInteract
  ) {

    target.userData.onInteract();
  }
}

/* ======================================================
   SECONDARY CONTROLLER BUTTON
====================================================== */

leftController.addEventListener(
  "squeezestart",
  () => {

    interactFromController(
      leftController
    );
  }
);

rightController.addEventListener(
  "squeezestart",
  () => {

    interactFromController(
      rightController
    );
  }
);

/* ======================================================
   INVENTORY
====================================================== */

function addItem(
  item
) {

  Game.inventory.push(
    item
  );

  showMessage(
    item + " added to inventory."
  );
}

function removeItem(
  item
) {

  const index =
    Game.inventory.indexOf(
      item
    );

  if (index === -1)
    return false;

  Game.inventory.splice(
    index,
    1
  );

  return true;
}

/* ======================================================
   MONEY
====================================================== */

function addMoney(
  amount
) {

  Game.money += amount;

  updateHUD();

  showMessage(
    (amount >= 0 ? "+" : "") +
    "$" +
    amount
  );
}

function spendMoney(
  amount
) {

  if (
    Game.money < amount
  ) {

    showMessage(
      "You don't have enough money."
    );

    return false;
  }

  Game.money -= amount;

  updateHUD();

  return true;
}

/* ======================================================
   NEEDS
====================================================== */

function eatFood(
  amount = 30
) {

  Game.hunger =
    Math.min(
      100,
      Game.hunger + amount
    );

  showMessage(
    "You ate some food."
  );
}

function sleep(
  hours = 8
) {

  Game.energy =
    Math.min(
      100,
      Game.energy + hours * 10
    );

  Game.hunger =
    Math.max(
      0,
      Game.hunger - hours * 3
    );

  showMessage(
    "You slept."
  );
}

/* ======================================================
   SIMPLE PHYSICS
====================================================== */

function updatePhysics(
  delta
) {

  for (
    const object of grabbableObjects
  ) {

    if (
      object.userData.isHeld
    ) {

      object.userData.velocity
        .set(0,0,0);

      continue;
    }

    if (
      !object.userData.velocity
    ) {
      continue;
    }

    object.userData.velocity.y -=
      9.81 * delta;

    object.position.addScaledVector(
      object.userData.velocity,
      delta
    );

    if (
      object.position.y < 0.35
    ) {

      object.position.y =
        0.35;

      if (
        object.userData.velocity.y <
        -1
      ) {

        object.userData.velocity.y *=
          -0.35;
      } else {

        object.userData.velocity.y =
          0;
      }

      object.userData.velocity.x *=
        0.92;

      object.userData.velocity.z *=
        0.92;
    }
  }
}

/* ======================================================
   WORLD OBJECTS
====================================================== */

function createSandboxObjects() {

  const crate =
    createPhysicsObject(
      "Wooden Crate",
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      materials.wood,
      new THREE.Vector3(
        4,
        0.5,
        6
      )
    );

  crate.userData.mass=3;

  const ball =
    createPhysicsObject(
      "Basketball",
      new THREE.SphereGeometry(
        .35,
        16,
        12
      ),
      new THREE.MeshStandardMaterial({
        color:0xd47738
      }),
      new THREE.Vector3(
        6,
        .35,
        6
      )
    );

  ball.userData.mass=.5;

  const box2 =
    createPhysicsObject(
      "Small Box",
      new THREE.BoxGeometry(
        .7,
        .7,
        .7
      ),
      materials.blue,
      new THREE.Vector3(
        8,
        .35,
        4
      )
    );

  makeInteractive(
    crate,
    "Crate",
    () => {

      showMessage(
        "A wooden crate."
      );

    }
  );

  makeInteractive(
    ball,
    "Basketball",
    () => {

      showMessage(
        "A basketball."
      );

    }
  );

  makeInteractive(
    box2,
    "Small Box",
    () => {

      showMessage(
        "A small box."
      );

    }
  );
}

/* ======================================================
   NPC CREATION
====================================================== */

const npcBodyColors = [
  0x4169a1,
  0xa85a45,
  0x6f9148,
  0x80589d,
  0xb78346,
  0x555d69
];

function createNPC(
  index
) {

  const npc =
    new THREE.Group();

  const body =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .35,
        1,
        5,
        8
      ),
      new THREE.MeshStandardMaterial({
        color:
          npcBodyColors[
            index %
            npcBodyColors.length
          ]
      })
    );

  body.position.y =
    1.05;

  const head =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        .3,
        12,
        8
      ),
      new THREE.MeshStandardMaterial({
        color:0xd6a17d
      })
    );

  head.position.y =
    1.85;

  npc.add(
    body,
    head
  );

  npc.position.set(
    Math.random()*80-40,
    0,
    Math.random()*80-40
  );

  scene.add(npc);

  const data = {

    object:npc,

    speed:
      .5 +
      Math.random()*.8,

    target:
      new THREE.Vector3(),

    state:"walking",

    wait:0,

    name:
      "Citizen " +
      (index+1)

  };

  chooseNPCTarget(data);

  npcs.push(data);

  return data;
}

function chooseNPCTarget(
  npc
) {

  npc.target.set(
    Math.random()*100-50,
    0,
    Math.random()*100-50
  );

  npc.wait =
    .5 +
    Math.random()*2;
}

/* ======================================================
   NPC AI
====================================================== */

function updateNPCs(
  delta
) {

  for (
    const npc of npcs
  ) {

    if (
      npc.wait > 0
    ) {

      npc.wait -=
        delta;

      continue;
    }

    const position =
      npc.object.position;

    const direction =
      new THREE.Vector3()
        .subVectors(
          npc.target,
          position
        );

    direction.y=0;

    const distance =
      direction.length();

    if (
      distance < 1.5
    ) {

      chooseNPCTarget(
        npc
      );

      continue;
    }

    direction.normalize();

    position.addScaledVector(
      direction,
      npc.speed * delta
    );

    npc.object.rotation.y =
      Math.atan2(
        direction.x,
        direction.z
      );
  }
}

/* ======================================================
   PLAYER NEEDS
====================================================== */

let needsTimer=0;

function updateNeeds(
  delta
) {

  needsTimer +=
    delta;

  if (
    needsTimer < 15
  )
    return;

  needsTimer=0;

  Game.hunger =
    Math.max(
      0,
      Game.hunger - 1
    );

  Game.energy =
    Math.max(
      0,
      Game.energy - .5
    );

  if (
    Game.hunger <= 0
  ) {

    Game.health =
      Math.max(
        0,
        Game.health - 1
      );
  }
}

/* ======================================================
   WORLD TIME
====================================================== */

let clockTimer=0;

function updateWorldTime(
  delta
) {

  clockTimer +=
    delta;

  if (
    clockTimer >= 1
  ) {

    clockTimer=0;

    Game.minutes++;

    if (
      Game.minutes >=
      1440
    ) {

      Game.minutes=0;

      Game.day++;

      Game.money -= 50;

      showMessage(
        "A new day begins. Daily expenses: $50."
      );
    }

    updateHUD();
  }

  const progress =
    Game.minutes / 1440;

  const angle =
    progress *
    Math.PI *
    2 -
    Math.PI / 2;

  sun.position.set(
    Math.cos(angle)*60,
    Math.sin(angle)*60,
    30
  );

  const daylight =
    Math.max(
      .08,
      Math.sin(angle)*.9+.3
    );

  ambient.intensity =
    .4 +
    daylight;

  sun.intensity =
    .2 +
    daylight;

}

/* ======================================================
   DESKTOP CONTROLS
====================================================== */

const keys={};

window.addEventListener(
  "keydown",
  event => {

    keys[
      event.key.toLowerCase()
    ] = true;

    if (
      event.key.toLowerCase() ===
      "e"
    ) {

      desktopInteract();
    }
  }
);

window.addEventListener(
  "keyup",
  event => {

    keys[
      event.key.toLowerCase()
    ] = false;
  }
);

function desktopInteract() {

  const direction =
    new THREE.Vector3();

  camera.getWorldDirection(
    direction
  );

  raycaster.set(
    camera.position,
    direction
  );

  const hits =
    raycaster.intersectObjects(
      interactiveObjects,
      true
    );

  if (!hits.length) {

    showMessage(
      "Nothing to interact with."
    );

    return;
  }

  let target =
    hits[0].object;

  while (
    target &&
    !target.userData.interactive
  ) {

    target =
      target.parent;
  }

  if (
    target &&
    target.userData.onInteract
  ) {

    target.userData.onInteract();
  }
}

function updateDesktop(
  delta
) {

  if (
    renderer.xr.isPresenting
  )
    return;

  const direction =
    new THREE.Vector3();

  camera.getWorldDirection(
    direction
  );

  direction.y=0;
  direction.normalize();

  const right =
    new THREE.Vector3()
      .crossVectors(
        direction,
        new THREE.Vector3(
          0,1,0
        )
      )
      .normalize();

  let speed =
    Game.settings.walkSpeed;

  if (
    keys.shift
  ) {

    speed =
      Game.settings.runSpeed;
  }

  const amount =
    speed * delta;

  if (keys.w)
    camera.position.addScaledVector(
      direction,
      amount
    );

  if (keys.s)
    camera.position.addScaledVector(
      direction,
      -amount
    );

  if (keys.a)
    camera.position.addScaledVector(
      right,
      -amount
    );

  if (keys.d)
    camera.position.addScaledVector(
      right,
      amount
    );

  camera.position.y=1.7;
}

/* ======================================================
   MOUSE LOOK
====================================================== */

renderer.domElement.addEventListener(
  "click",
  () => {

    if (
      renderer.xr.isPresenting
    )
      return;

    if (
      document.pointerLockElement === null
    ) {

      renderer.domElement.requestPointerLock();
    }
  }
);

window.addEventListener(
  "mousemove",
  event => {

    if (
      renderer.xr.isPresenting
    )
      return;

    if (
      document.pointerLockElement === null
    )
      return;

    camera.rotation.order =
      "YXZ";

    camera.rotation.y -=
      event.movementX *
      .002;

    camera.rotation.x -=
      event.movementY *
      .002;

    camera.rotation.x =
      Math.max(
        -1.4,
        Math.min(
          1.4,
          camera.rotation.x
        )
      );
  }
);

/* ======================================================
   INITIAL WORLD
====================================================== */

createSandboxObjects();

for (
  let i=0;
  i<24;
  i++
) {

  createNPC(i);
}

updateHUD();

/* ======================================================
   RESIZE
====================================================== */

window.addEventListener(
  "resize",
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

/* ======================================================
   GAME LOOP
====================================================== */

let lastTime =
  performance.now();

function gameLoop() {

  const now =
    performance.now();

  const delta =
    Math.min(
      (now-lastTime)/1000,
      .05
    );

  lastTime=now;

  updateDesktop(delta);

  updateNPCs(delta);

  updatePhysics(delta);

  updateNeeds(delta);

  updateWorldTime(delta);

  renderer.render(
    scene,
    camera
  );
}

renderer.setAnimationLoop(
  gameLoop
);

/* ======================================================
   START
====================================================== */

const startButton =
  document.getElementById(
    "play"
  );

if (startButton) {

  startButton.addEventListener(
    "click",
    () => {

      const startScreen =
        document.getElementById(
          "start"
        );

      if (startScreen) {
        startScreen.style.display =
          "none";
      }

      showMessage(
        "Welcome to LIFE."
      );
    }
  );
}

console.log(
  "LIFE: WebXR game system loaded."
);