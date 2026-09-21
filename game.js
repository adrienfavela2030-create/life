import * as THREE from "three";

let S = null;

const state = {
  running: false,
  elapsed: 0,

  shift: 1,
  shiftTime: 0,

  registerOpen: true,

  customerCount: 0,
  completedOrders: 0,

  money: 0,

  player: {
    position: new THREE.Vector3(0, 1.6, 3.5)
  }
};


/*
 * ---------------------------------------------------------
 * SETUP
 * ---------------------------------------------------------
 */

export function setup(game) {

  S = game;

  if (!S) {
    throw new Error("Store Shift VR: Game system received no game state.");
  }

  state.running = false;
  state.elapsed = 0;
  state.shiftTime = 0;

  console.log("Store Shift VR: game system ready.");
}


/*
 * ---------------------------------------------------------
 * START
 * ---------------------------------------------------------
 */

export function start(game) {

  if (game) {
    S = game;
  }

  state.running = true;
  state.elapsed = 0;
  state.shiftTime = 0;

  state.shift =
    Number(S.shift) || 1;

  state.money =
    Number(S.money) || 0;

  /*
   * Put the player behind the counter.
   */

  if (S.player) {

    S.player.position.set(
      0,
      1.6,
      3.5
    );

  }

  console.log(
    "Store Shift VR: shift started."
  );

}


/*
 * ---------------------------------------------------------
 * UPDATE
 * ---------------------------------------------------------
 */

export function update(delta, game) {

  if (game) {
    S = game;
  }

  if (!state.running) {
    return;
  }

  if (
    !Number.isFinite(delta) ||
    delta <= 0
  ) {
    return;
  }

  const safeDelta =
    Math.min(delta, 0.05);

  state.elapsed += safeDelta;
  state.shiftTime += safeDelta;


  /*
   * Keep the player behind the counter.
   *
   * The player can move their head and hands,
   * but the actual player rig stays in the
   * cashier area.
   */

  keepPlayerBehindCounter();


  /*
   * Slowly increase the shift difficulty.
   */

  updateDifficulty();


  /*
   * Keep HUD values synchronized.
   */

  if (
    typeof S.addMoney === "function"
  ) {

    /*
     * Money is controlled by this game system
     * and updated when orders are completed.
     */

  }

}


/*
 * ---------------------------------------------------------
 * PLAYER AREA
 * ---------------------------------------------------------
 */

function keepPlayerBehindCounter() {

  if (!S || !S.player) {
    return;
  }

  /*
   * Counter area:
   *
   * X = left/right movement
   * Z = forward/backward
   *
   * The customer side is behind the counter
   * boundary.
   */

  const maxX = 1.55;

  const minZ = 2.0;
  const maxZ = 4.3;


  S.player.position.x =
    THREE.MathUtils.clamp(
      S.player.position.x,
      -maxX,
      maxX
    );


  S.player.position.z =
    THREE.MathUtils.clamp(
      S.player.position.z,
      minZ,
      maxZ
    );

}


/*
 * ---------------------------------------------------------
 * DIFFICULTY
 * ---------------------------------------------------------
 */

function updateDifficulty() {

  /*
   * Every 90 seconds the shift gets slightly harder.
   */

  const level =
    Math.floor(
      state.shiftTime / 90
    );

  state.difficulty =
    Math.max(
      1,
      level + 1
    );

}


/*
 * ---------------------------------------------------------
 * CUSTOMER COUNT
 * ---------------------------------------------------------
 */

export function customerArrived() {

  state.customerCount++;

}


export function orderCompleted(amount = 0) {

  const payment =
    Number(amount);

  if (
    !Number.isFinite(payment)
  ) {
    return;
  }


  state.completedOrders++;


  /*
   * Add money.
   */

  state.money += payment;


  if (S) {

    S.money =
      state.money;

    if (
      typeof S.addMoney !== "function"
    ) {

      const moneyElement =
        document.getElementById(
          "moneyAmount"
        );

      if (moneyElement) {

        moneyElement.textContent =
          state.money.toFixed(2);

      }

    }

  }


  console.log(
    `Order completed: +$${payment.toFixed(2)}`
  );

}


/*
 * ---------------------------------------------------------
 * CUSTOMER LEFT
 * ---------------------------------------------------------
 */

export function customerLeft() {

  /*
   * This exists so the customer system can
   * notify the game when an NPC leaves.
   */

}


/*
 * ---------------------------------------------------------
 * SHIFT
 * ---------------------------------------------------------
 */

export function getShift() {

  return state.shift;

}


export function getShiftTime() {

  return state.shiftTime;

}


export function getDifficulty() {

  return state.difficulty || 1;

}


export function getCompletedOrders() {

  return state.completedOrders;

}


/*
 * ---------------------------------------------------------
 * REGISTER
 * ---------------------------------------------------------
 */

export function openRegister() {

  state.registerOpen = true;

}


export function closeRegister() {

  state.registerOpen = false;

}


export function isRegisterOpen() {

  return state.registerOpen;

}


/*
 * ---------------------------------------------------------
 * MONEY
 * ---------------------------------------------------------
 */

export function getMoney() {

  return state.money;

}


export function setMoney(amount) {

  const value =
    Number(amount);

  if (
    !Number.isFinite(value)
  ) {
    return;
  }

  state.money =
    Math.max(0, value);

  if (S) {

    S.money =
      state.money;

  }

}


/*
 * ---------------------------------------------------------
 * GAME STATE
 * ---------------------------------------------------------
 */

export function isRunning() {

  return state.running;

}


export function pause() {

  state.running = false;

}


export function resume() {

  state.running = true;

}


/*
 * ---------------------------------------------------------
 * NEW SHIFT
 * ---------------------------------------------------------
 */

export function newShift() {

  state.shift++;

  state.shiftTime = 0;

  state.completedOrders = 0;

  state.customerCount = 0;

  state.registerOpen = true;


  if (S) {

    S.shift =
      state.shift;

  }


  console.log(
    `Starting shift ${state.shift}`
  );

}


/*
 * ---------------------------------------------------------
 * RESET
 * ---------------------------------------------------------
 */

export function reset() {

  state.running = false;

  state.elapsed = 0;

  state.shiftTime = 0;

  state.shift = 1;

  state.customerCount = 0;

  state.completedOrders = 0;

  state.money = 0;

  state.registerOpen = true;

  state.difficulty = 1;


  if (S) {

    S.shift = 1;
    S.money = 0;
    S.currentOrder = null;

  }

}


/*
 * ---------------------------------------------------------
 * INFORMATION
 * ---------------------------------------------------------
 */

export function getGameState() {

  return {

    running:
      state.running,

    shift:
      state.shift,

    shiftTime:
      state.shiftTime,

    difficulty:
      state.difficulty || 1,

    registerOpen:
      state.registerOpen,

    customerCount:
      state.customerCount,

    completedOrders:
      state.completedOrders,

    money:
      state.money

  };

}