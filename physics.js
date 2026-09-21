import * as THREE from "three";

let S = null;

const state = {
  running: false,
  held: {
    left: null,
    right: null
  },
  grabbed: new Map(),
  grabbableObjects: [],
  scaledObjects: new Set()
};

const CONFIG = {
  grabDistance: 1.35,
  throwMultiplier: 1.15,
  maxThrowSpeed: 8,
  scaleMin: 0.55,
  scaleMax: 2.5,
  scaleSpeed: 0.85
};

export function setup(game) {
  S = game;

  state.running = false;
  state.held.left = null;
  state.held.right = null;
  state.grabbed.clear();
  state.grabbableObjects = [];
  state.scaledObjects.clear();

  console.log("[Physics] Setup complete");
}

export function start(game) {
  S = game;
  state.running = true;

  state.held.left = null;
  state.held.right = null;
  state.grabbed.clear();

  console.log("[Physics] Physics system started");
}

export function update(delta, game) {
  if (!state.running || !S) return;

  updateHeldObjects(delta);
}

export function stop() {
  releaseHand("left", false);
  releaseHand("right", false);

  state.running = false;
}

export function registerObject(object, options = {}) {
  if (!object) return;

  if (!object.userData) {
    object.userData = {};
  }

  object.userData.grabbable = true;

  object.userData.physics = {
    mass: options.mass ?? 1,
    throwable: options.throwable ?? true,
    scalable: options.scalable ?? true,
    bounce: options.bounce ?? 0.25
  };

  if (!state.grabbableObjects.includes(object)) {
    state.grabbableObjects.push(object);
  }

  return object;
}

export function unregisterObject(object) {
  const index = state.grabbableObjects.indexOf(object);

  if (index !== -1) {
    state.grabbableObjects.splice(index, 1);
  }

  releaseObject(object, false);
}

export function grab(handName) {
  if (!state.running || !S) return;

  if (state.held[handName]) {
    return;
  }

  const controller = getController(handName);

  if (!controller) return;

  const object = findClosestObject(controller);

  if (!object) return;

  attachObject(handName, object);
}

export function release(handName) {
  releaseHand(handName, true);
}

export function squeezeStart(handName) {
  if (!state.running || !S) return;

  const controller = getController(handName);

  if (!controller) return;

  const object = findClosestObject(controller);

  if (!object) return;

  const physics = object.userData.physics || {};

  if (physics.scalable === false) {
    return;
  }

  state.scaledObjects.add(object);

  object.userData.scalingHand = handName;
}

export function squeezeEnd(handName) {
  for (const object of state.scaledObjects) {
    if (object.userData.scalingHand === handName) {
      delete object.userData.scalingHand;
    }
  }
}

function getController(handName) {
  if (!S || !S.controllers) return null;

  if (handName === "left") {
    return S.controllers.left || null;
  }

  if (handName === "right") {
    return S.controllers.right || null;
  }

  return null;
}

function findClosestObject(controller) {
  if (!controller) return null;

  const controllerPosition = new THREE.Vector3();

  controller.getWorldPosition(controllerPosition);

  let closest = null;
  let closestDistance = CONFIG.grabDistance;

  for (const object of state.grabbableObjects) {
    if (!object) continue;

    if (!object.parent) continue;

    if (object.userData.heldBy) continue;

    const position = new THREE.Vector3();

    object.getWorldPosition(position);

    const distance = controllerPosition.distanceTo(position);

    if (distance < closestDistance) {
      closest = object;
      closestDistance = distance;
    }
  }

  return closest;
}

function attachObject(handName, object) {
  const controller = getController(handName);

  if (!controller || !object) return;

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  object.getWorldPosition(worldPosition);
  object.getWorldQuaternion(worldQuaternion);
  object.getWorldScale(worldScale);

  const previousParent = object.parent;

  controller.attach(object);

  object.userData.heldBy = handName;
  object.userData.previousParent = previousParent;

  state.held[handName] = object;
  state.grabbed.set(object, {
    hand: handName,
    previousParent,
    lastPosition: worldPosition.clone(),
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(),
    startScale: worldScale.clone()
  });

  object.userData.grabbedAt = performance.now();

  console.log("[Physics] Grabbed:", object.name || "object");
}

function releaseHand(handName, shouldThrow = true) {
  const object = state.held[handName];

  if (!object) return;

  releaseObject(object, shouldThrow);
}

function releaseObject(object, shouldThrow = true) {
  if (!object) return;

  const data = state.grabbed.get(object);

  if (!data) return;

  const handName = data.hand;
  const controller = getController(handName);

  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  object.getWorldPosition(worldPosition);
  object.getWorldQuaternion(worldQuaternion);
  object.getWorldScale(worldScale);

  if (S.scene) {
    S.scene.attach(object);
  } else {
    object.removeFromParent();
  }

  object.position.copy(worldPosition);
  object.quaternion.copy(worldQuaternion);

  const physics = object.userData.physics || {};

  if (shouldThrow && physics.throwable !== false) {
    applyThrowVelocity(object, data);
  } else {
    object.userData.velocity = new THREE.Vector3();
  }

  object.userData.heldBy = null;

  if (state.held[handName] === object) {
    state.held[handName] = null;
  }

  state.grabbed.delete(object);

  console.log("[Physics] Released:", object.name || "object");
}

function applyThrowVelocity(object, data) {
  const velocity = data.velocity.clone();

  if (velocity.length() > CONFIG.maxThrowSpeed) {
    velocity.setLength(CONFIG.maxThrowSpeed);
  }

  velocity.multiplyScalar(CONFIG.throwMultiplier);

  object.userData.velocity = velocity;
}

function updateHeldObjects(delta) {
  if (!delta || delta <= 0) return;

  for (const [object, data] of state.grabbed.entries()) {
    if (!object || !object.parent) continue;

    const position = new THREE.Vector3();

    object.getWorldPosition(position);

    const movement = position.clone().sub(data.lastPosition);

    data.velocity
      .copy(movement)
      .divideScalar(Math.max(delta, 0.001));

    if (data.velocity.length() > CONFIG.maxThrowSpeed) {
      data.velocity.setLength(CONFIG.maxThrowSpeed);
    }

    data.lastPosition.copy(position);
  }

  updateScaling(delta);
}

function updateScaling(delta) {
  for (const object of state.scaledObjects) {
    if (!object) continue;

    const handName = object.userData.scalingHand;

    if (!handName) continue;

    const controller = getController(handName);

    if (!controller) continue;

    const input = getControllerInput(controller);

    if (Math.abs(input) < 0.01) {
      continue;
    }

    const amount = input * CONFIG.scaleSpeed * delta;

    const currentScale = object.scale.x;

    const newScale = THREE.MathUtils.clamp(
      currentScale + amount,
      CONFIG.scaleMin,
      CONFIG.scaleMax
    );

    const ratio = newScale / Math.max(currentScale, 0.001);

    object.scale.multiplyScalar(ratio);
  }
}

function getControllerInput(controller) {
  if (!controller || !controller.inputSource) {
    return 0;
  }

  const gamepad = controller.inputSource.gamepad;

  if (!gamepad || !gamepad.axes) {
    return 0;
  }

  /*
   * Quest thumbstick:
   * axes[0] = horizontal
   * axes[1] = vertical
   *
   * We use the vertical axis for resizing.
   */
  const vertical = gamepad.axes[1] ?? 0;

  return -vertical;
}

export function isHeld(object) {
  return !!(object && object.userData && object.userData.heldBy);
}

export function getHeldObject(handName) {
  return state.held[handName] || null;
}

export function getPhysicsState() {
  return {
    running: state.running,
    leftHeld: state.held.left
      ? state.held.left.name || "object"
      : null,
    rightHeld: state.held.right
      ? state.held.right.name || "object"
      : null,
    objectCount: state.grabbableObjects.length
  };
}

export function clearAllObjects() {
  releaseHand("left", false);
  releaseHand("right", false);

  state.grabbableObjects.length = 0;
  state.grabbed.clear();
  state.scaledObjects.clear();
}

export function handleControllerSelectStart(handName) {
  grab(handName);
}

export function handleControllerSelectEnd(handName) {
  release(handName);
}

export function handleControllerSqueezeStart(handName) {
  squeezeStart(handName);
}

export function handleControllerSqueezeEnd(handName) {
  squeezeEnd(handName);
}