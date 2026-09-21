import * as THREE from "three";

let S = null;

const state = {
  running: false,
  customer: null,
  customerGroup: null,
  order: null,
  waiting: false,
  leaving: false,
  timer: 0,
  nextCustomerTimer: 2,
  customerNumber: 0,
  reactionTimer: 0
};

const NAMES = [
  "Alex",
  "Jordan",
  "Sam",
  "Taylor",
  "Riley",
  "Casey",
  "Morgan",
  "Jamie"
];

const PRODUCTS = [
  { name: "Soda", price: 2.49 },
  { name: "Cereal", price: 4.99 },
  { name: "Chips", price: 3.49 },
  { name: "Milk", price: 2.99 },
  { name: "Apple", price: 1.49 },
  { name: "Juice", price: 3.29 }
];

export function setup(game) {
  S = game;

  state.running = false;
  state.customer = null;
  state.customerGroup = null;
  state.order = null;
  state.waiting = false;
  state.leaving = false;
  state.timer = 0;
  state.nextCustomerTimer = 2;
  state.customerNumber = 0;
  state.reactionTimer = 0;

  console.log("[Customers] Setup complete");
}

export function start(game) {
  S = game;
  state.running = true;

  state.customer = null;
  state.customerGroup = null;
  state.order = null;
  state.waiting = false;
  state.leaving = false;
  state.timer = 0;
  state.nextCustomerTimer = 2;
  state.customerNumber = 0;

  console.log("[Customers] Customer system started");
}

export function update(delta, game) {
  if (!state.running || !S) return;

  if (!state.customer) {
    state.nextCustomerTimer -= delta;

    if (state.nextCustomerTimer <= 0) {
      spawnCustomer();
    }

    return;
  }

  updateCustomerMovement(delta);
  updateCustomerReaction(delta);
  updateCustomerOrder();
}

export function stop() {
  removeCustomer();

  state.running = false;
}

function spawnCustomer() {
  if (!S.scene) return;

  state.customerNumber++;

  const name =
    NAMES[
      Math.floor(Math.random() * NAMES.length)
    ];

  const customer = new THREE.Group();

  customer.name = `Customer_${state.customerNumber}`;

  /*
   * Simple original NPC:
   * head
   * body
   * arms
   * legs
   *
   * These are deliberately simple shapes so the game
   * does not depend on external character assets.
   */

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.7, 6, 12),
    new THREE.MeshStandardMaterial({
      color: randomBodyColor()
    })
  );

  body.position.y = 1.0;

  customer.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0xd39a72
    })
  );

  head.position.y = 1.7;

  customer.add(head);

  const leftArm = createLimb(0.11, 0.65);

  leftArm.position.set(
    -0.38,
    1.05,
    0
  );

  leftArm.rotation.z = -0.15;

  customer.add(leftArm);

  const rightArm = createLimb(0.11, 0.65);

  rightArm.position.set(
    0.38,
    1.05,
    0
  );

  rightArm.rotation.z = 0.15;

  customer.add(rightArm);

  const leftLeg = createLimb(0.13, 0.75);

  leftLeg.position.set(
    -0.14,
    0.38,
    0
  );

  customer.add(leftLeg);

  const rightLeg = createLimb(0.13, 0.75);

  rightLeg.position.set(
    0.14,
    0.38,
    0
  );

  customer.add(rightLeg);

  customer.position.set(
    randomSpawnX(),
    0,
    -4.5
  );

  state.customerGroup = customer;

  S.scene.add(customer);

  state.customer = {
    name,
    group: customer,
    state: "walkingIn",
    speed: 1.1 + Math.random() * 0.3,
    targetZ: 0.25,
    reaction: "",
    reactionTimer: 0,
    orderComplete: false
  };

  state.order = createOrder();

  state.waiting = false;
  state.leaving = false;
  state.timer = 0;

  if (typeof S.setOrder === "function") {
    S.setOrder(state.order);
  }

  if (typeof S.systems?.game?.customerArrived === "function") {
    S.systems.game.customerArrived();
  }

  console.log(
    `[Customers] ${name} arrived with ${state.order.items.length} items`
  );
}

function createLimb(radius, length) {
  const limb = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      radius,
      length,
      5,
      8
    ),
    new THREE.MeshStandardMaterial({
      color: 0x30343a
    })
  );

  return limb;
}

function randomBodyColor() {
  const colors = [
    0x3c6e91,
    0x7c4d91,
    0x3d8059,
    0x91513c,
    0x4d526d,
    0x7c713c
  ];

  return colors[
    Math.floor(Math.random() * colors.length)
  ];
}

function randomSpawnX() {
  return -2.5 + Math.random() * 5;
}

function createOrder() {
  const itemCount =
    1 + Math.floor(Math.random() * 3);

  const items = [];

  let total = 0;

  for (let i = 0; i < itemCount; i++) {
    const product =
      PRODUCTS[
        Math.floor(Math.random() * PRODUCTS.length)
      ];

    items.push({
      name: product.name,
      price: product.price
    });

    total += product.price;
  }

  return {
    items,
    total: Number(total.toFixed(2)),
    scanned: [],
    paid: false,
    bagged: false,
    receiptPrinted: false
  };
}

function updateCustomerMovement(delta) {
  if (!state.customer) return;

  const customer = state.customer;
  const group = customer.group;

  if (!group) return;

  if (customer.state === "walkingIn") {
    moveToward(
      group,
      new THREE.Vector3(
        group.position.x,
        0,
        customer.targetZ
      ),
      customer.speed,
      delta
    );

    if (
      Math.abs(
        group.position.z - customer.targetZ
      ) < 0.08
    ) {
      customer.state = "waiting";
      state.waiting = true;

      faceCounter();

      showReaction(
        `${customer.name} is waiting for checkout.`
      );
    }

    return;
  }

  if (customer.state === "leaving") {
    moveToward(
      group,
      new THREE.Vector3(
        group.position.x,
        0,
        -4.5
      ),
      customer.speed * 1.2,
      delta
    );

    if (group.position.z < -4.2) {
      removeCustomer();

      state.nextCustomerTimer =
        1.5 + Math.random() * 2;

      return;
    }
  }
}

function moveToward(object, target, speed, delta) {
  const direction = target
    .clone()
    .sub(object.position);

  direction.y = 0;

  const distance = direction.length();

  if (distance < 0.001) return;

  direction.normalize();

  const amount = Math.min(
    distance,
    speed * delta
  );

  object.position.addScaledVector(
    direction,
    amount
  );

  if (direction.lengthSq() > 0) {
    const angle =
      Math.atan2(
        direction.x,
        direction.z
      );

    object.rotation.y = angle;
  }
}

function faceCounter() {
  if (!state.customerGroup) return;

  const target = new THREE.Vector3(
    state.customerGroup.position.x,
    1.2,
    1.1
  );

  state.customerGroup.lookAt(target);
}

function updateCustomerOrder() {
  if (!state.customer || !state.order) return;

  /*
   * The customer stays at the counter until
   * the player completes the transaction.
   */

  if (
    state.customer.state === "waiting" &&
    state.orderComplete()
  ) {
    finishCustomer();
  }
}

function updateCustomerReaction(delta) {
  if (!state.customer) return;

  if (state.customer.reactionTimer > 0) {
    state.customer.reactionTimer -= delta;

    if (
      state.customer.reactionTimer <= 0
    ) {
      state.customer.reaction = "";
    }
  }
}

function finishCustomer() {
  if (!state.customer) return;

  state.customer.orderComplete = true;
  state.customer.state = "leaving";
  state.waiting = false;

  const amount = state.order.total;

  if (
    typeof S.systems?.game?.orderCompleted ===
    "function"
  ) {
    S.systems.game.orderCompleted(amount);
  }

  if (typeof S.clearOrder === "function") {
    S.clearOrder();
  }

  showReaction(
    `${state.customer.name} paid $${amount.toFixed(2)}.`
  );

  console.log(
    `[Customers] Order complete: $${amount.toFixed(2)}`
  );
}

function removeCustomer() {
  if (state.customerGroup) {
    state.customerGroup.removeFromParent();
  }

  state.customer = null;
  state.customerGroup = null;
  state.order = null;
  state.waiting = false;
  state.leaving = false;
}

function showReaction(message) {
  if (!state.customer) return;

  state.customer.reaction = message;
  state.customer.reactionTimer = 3;

  console.log(
    `[Customer Reaction] ${message}`
  );
}

export function getCurrentCustomer() {
  return state.customer;
}

export function getCurrentOrder() {
  return state.order;
}

export function isCustomerWaiting() {
  return (
    !!state.customer &&
    state.customer.state === "waiting"
  );
}

export function scanCurrentProduct(productName) {
  if (!state.order) return false;

  const itemIndex =
    state.order.items.findIndex(
      item =>
        item.name === productName &&
        !state.order.scanned.includes(item)
    );

  if (itemIndex === -1) {
    showReaction(
      "That item isn't on this order."
    );

    return false;
  }

  const item =
    state.order.items[itemIndex];

  state.order.scanned.push(item);

  showReaction(
    `${item.name} scanned.`
  );

  return true;
}

export function markPaid() {
  if (!state.order) return false;

  if (
    state.order.scanned.length <
    state.order.items.length
  ) {
    showReaction(
      "There are still items to scan."
    );

    return false;
  }

  state.order.paid = true;

  showReaction("Payment accepted.");

  return true;
}

export function markBagged() {
  if (!state.order) return false;

  state.order.bagged = true;

  showReaction("Order bagged.");

  return true;
}

export function printReceipt() {
  if (!state.order) return false;

  if (!state.order.paid) {
    showReaction(
      "Payment is needed first."
    );

    return false;
  }

  state.order.receiptPrinted = true;

  showReaction("Receipt printed.");

  return true;
}

export function completeOrder() {
  if (!state.order) return false;

  const allScanned =
    state.order.scanned.length >=
    state.order.items.length;

  if (!allScanned) {
    showReaction(
      "Scan every item first."
    );

    return false;
  }

  if (!state.order.paid) {
    showReaction(
      "Take payment first."
    );

    return false;
  }

  /*
   * Bagging and printing are optional for now.
   * This keeps the first playable version simple.
   */

  finishCustomer();

  return true;
}

export function getCustomerState() {
  return {
    running: state.running,
    hasCustomer: !!state.customer,
    waiting: state.waiting,
    leaving: state.leaving,
    customerName:
      state.customer?.name || null,
    order: state.order
      ? {
          itemCount: state.order.items.length,
          scanned: state.order.scanned.length,
          total: state.order.total,
          paid: state.order.paid,
          bagged: state.order.bagged,
          receiptPrinted:
            state.order.receiptPrinted
        }
      : null
  };
}