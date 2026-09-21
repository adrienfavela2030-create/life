import * as THREE from "three";

let S = null;

const state = {
  running: false,
  root: null,

  counter: null,
  scanner: null,
  register: null,
  cashDrawer: null,
  cardReader: null,
  receiptPrinter: null,
  bagArea: null,

  products: [],
  money: [],

  scannerLight: null,
  registerScreen: null,
  receiptText: null,

  drawerOpen: false,
  lastScanTime: 0
};

const COLORS = {
  counter: 0x24262b,
  counterTop: 0x363940,
  metal: 0x777b82,
  dark: 0x111318,
  screen: 0x18241d,
  green: 0x39ff88,
  red: 0xff4545,
  white: 0xf4f4f4,
  yellow: 0xffd34d,
  cardboard: 0xb8793d,
  bag: 0xdde7e4
};

export function setup(game) {
  S = game;

  state.running = false;
  state.root = null;
  state.products = [];
  state.money = [];
  state.drawerOpen = false;
  state.lastScanTime = 0;

  console.log("[Store] Setup complete");
}

export function start(game) {
  S = game;
  state.running = true;

  createStore();

  console.log("[Store] Store created");
}

export function update(delta, game) {
  if (!state.running) return;

  updateScanner();
  updateRegisterScreen();
  updateMoneyPhysics(delta);
}

export function stop() {
  state.running = false;

  if (state.root) {
    state.root.removeFromParent();
  }

  state.root = null;
}

function createStore() {
  if (!S || !S.scene) return;

  state.root = new THREE.Group();
  state.root.name = "Store";

  S.scene.add(state.root);

  createFloor();
  createCounter();
  createScanner();
  createRegister();
  createCardReader();
  createReceiptPrinter();
  createBagArea();
  createProductDisplay();
  createMoney();

  console.log("[Store] All store equipment created");
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.15, 10),
    new THREE.MeshStandardMaterial({
      color: 0x202225,
      roughness: 0.85
    })
  );

  floor.position.set(0, -0.15, 0);

  floor.name = "StoreFloor";

  state.root.add(floor);
}

function createCounter() {
  const counter = new THREE.Group();

  counter.name = "CheckoutCounter";

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 1.35, 1.25),
    new THREE.MeshStandardMaterial({
      color: COLORS.counter,
      roughness: 0.65
    })
  );

  base.position.set(0, 0.68, 1.15);

  counter.add(base);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(5.45, 0.16, 1.45),
    new THREE.MeshStandardMaterial({
      color: COLORS.counterTop,
      roughness: 0.45
    })
  );

  top.position.set(0, 1.39, 1.15);

  counter.add(top);

  const frontPanel = new THREE.Mesh(
    new THREE.BoxGeometry(5.05, 1.05, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x15171a
    })
  );

  frontPanel.position.set(0, 0.7, 1.8);

  counter.add(frontPanel);

  state.counter = counter;

  state.root.add(counter);
}

function createScanner() {
  const scanner = new THREE.Group();

  scanner.name = "BarcodeScanner";

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.18, 0.7),
    new THREE.MeshStandardMaterial({
      color: COLORS.dark,
      roughness: 0.4
    })
  );

  body.position.y = 0.12;

  scanner.add(body);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.5, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x292c31
    })
  );

  handle.rotation.x = -0.3;
  handle.position.set(0, -0.08, 0.1);

  scanner.add(handle);

  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.035, 0.035),
    new THREE.MeshBasicMaterial({
      color: COLORS.red
    })
  );

  light.position.set(0, 0.22, -0.34);

  scanner.add(light);

  state.scannerLight = light;
  state.scanner = scanner;

  scanner.position.set(-1.45, 1.58, 1.08);

  state.root.add(scanner);

  makeInteractive(scanner, {
    type: "scanner"
  });
}

function createRegister() {
  const register = new THREE.Group();

  register.name = "CashRegister";

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.3, 0.75),
    new THREE.MeshStandardMaterial({
      color: COLORS.dark,
      roughness: 0.45
    })
  );

  base.position.y = 0.15;

  register.add(base);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.58, 0.08),
    new THREE.MeshStandardMaterial({
      color: COLORS.screen,
      emissive: 0x102518,
      emissiveIntensity: 0.5
    })
  );

  screen.position.set(0, 0.55, -0.08);

  register.add(screen);

  const screenGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.4),
    new THREE.MeshBasicMaterial({
      color: 0x7affae
    })
  );

  screenGlow.position.set(0, 0.55, -0.035);

  register.add(screenGlow);

  state.registerScreen = screenGlow;

  register.position.set(0, 1.48, 1.1);

  state.register = register;

  state.root.add(register);

  makeInteractive(register, {
    type: "register"
  });
}

function createCardReader() {
  const reader = new THREE.Group();

  reader.name = "CardReader";

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.22, 0.48),
    new THREE.MeshStandardMaterial({
      color: 0x292c32,
      roughness: 0.4
    })
  );

  body.position.y = 0.11;

  reader.add(body);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.24, 0.035),
    new THREE.MeshStandardMaterial({
      color: 0x17201a,
      emissive: 0x183d26,
      emissiveIntensity: 0.45
    })
  );

  screen.position.set(0, 0.3, -0.05);

  reader.add(screen);

  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.025, 0.05),
    new THREE.MeshStandardMaterial({
      color: COLORS.black || 0x050505
    })
  );

  slot.position.set(0, 0.18, 0.25);

  reader.add(slot);

  reader.position.set(1.0, 1.52, 1.05);

  state.cardReader = reader;

  state.root.add(reader);

  makeInteractive(reader, {
    type: "cardReader"
  });
}

function createReceiptPrinter() {
  const printer = new THREE.Group();

  printer.name = "ReceiptPrinter";

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.45, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6
    })
  );

  body.position.y = 0.225;

  printer.add(body);

  const slot = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.035, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x222222
    })
  );

  slot.position.set(0, 0.34, 0.28);

  printer.add(slot);

  state.receiptText = slot;

  printer.position.set(1.65, 1.45, 1.05);

  state.receiptPrinter = printer;

  state.root.add(printer);

  makeInteractive(printer, {
    type: "receiptPrinter"
  });
}

function createBagArea() {
  const area = new THREE.Group();

  area.name = "BagArea";

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.08, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x303238
    })
  );

  platform.position.y = 0.04;

  area.add(platform);

  for (let i = 0; i < 3; i++) {
    const bag = createBag();

    bag.position.set(
      (i - 1) * 0.28,
      0.18,
      0
    );

    area.add(bag);
  }

  area.position.set(2.0, 1.43, 1.05);

  state.bagArea = area;

  state.root.add(area);
}

function createBag() {
  const bag = new THREE.Group();

  bag.name = "ShoppingBag";

  const material = new THREE.MeshStandardMaterial({
    color: COLORS.bag,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.5, 0.25),
    material
  );

  body.position.y = 0.25;

  bag.add(body);

  const handleLeft = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI),
    material
  );

  handleLeft.rotation.z = Math.PI;
  handleLeft.position.set(-0.09, 0.55, 0);

  bag.add(handleLeft);

  const handleRight = handleLeft.clone();

  handleRight.position.x = 0.09;

  bag.add(handleRight);

  makeInteractive(bag, {
    type: "bag",
    scalable: true
  });

  return bag;
}

function createProductDisplay() {
  const products = [
    {
      name: "Soda",
      color: 0xd93636,
      price: 2.49,
      scale: 0.9
    },
    {
      name: "Cereal",
      color: 0xf2c94c,
      price: 4.99,
      scale: 1
    },
    {
      name: "Chips",
      color: 0xe58c32,
      price: 3.49,
      scale: 0.85
    },
    {
      name: "Milk",
      color: 0xf0f0e8,
      price: 2.99,
      scale: 1
    },
    {
      name: "Apple",
      color: 0xe33b3b,
      price: 1.49,
      scale: 0.65
    },
    {
      name: "Juice",
      color: 0xef8d31,
      price: 3.29,
      scale: 0.9
    }
  ];

  products.forEach((data, index) => {
    const product = createProduct(data);

    const row = Math.floor(index / 3);
    const column = index % 3;

    product.position.set(
      -2.0 + column * 0.65,
      1.55 + row * 0.42,
      0.95
    );

    state.root.add(product);
    state.products.push(product);
  });
}

function createProduct(data) {
  const product = new THREE.Group();

  product.name = data.name;

  let geometry;

  if (data.name === "Apple") {
    geometry = new THREE.SphereGeometry(0.17, 16, 12);
  } else {
    geometry = new THREE.BoxGeometry(
      0.36,
      0.42,
      0.28
    );
  }

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.6
    })
  );

  product.add(mesh);

  product.userData.product = {
    name: data.name,
    price: data.price
  };

  product.scale.setScalar(data.scale);

  makeInteractive(product, {
    type: "product",
    scalable: true
  });

  return product;
}

function createMoney() {
  const drawer = new THREE.Group();

  drawer.name = "CashDrawer";

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.18, 0.8),
    new THREE.MeshStandardMaterial({
      color: COLORS.dark
    })
  );

  base.position.y = 0.09;

  drawer.add(base);

  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.08, 0.58),
    new THREE.MeshStandardMaterial({
      color: 0x393c42
    })
  );

  inner.position.set(0, 0.2, 0);

  drawer.add(inner);

  drawer.position.set(-0.05, 1.48, 1.9);

  state.cashDrawer = drawer;

  state.root.add(drawer);

  makeInteractive(drawer, {
    type: "cashDrawer"
  });

  const denominations = [1, 5, 10, 20];

  denominations.forEach((value, index) => {
    const bill = createBill(value);

    bill.position.set(
      -0.5 + index * 0.34,
      1.62,
      1.9
    );

    state.root.add(bill);
    state.money.push(bill);
  });
}

function createBill(value) {
  const bill = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.015, 0.13),
    new THREE.MeshStandardMaterial({
      color: 0x83b98b,
      roughness: 0.8
    })
  );

  bill.name = `$${value}`;

  bill.userData.money = value;

  makeInteractive(bill, {
    type: "money",
    scalable: false
  });

  return bill;
}

function makeInteractive(object, options = {}) {
  object.userData.interactive = true;
  object.userData.interactionType = options.type || "object";

  if (S && S.systems && S.systems.physics) {
    S.systems.physics.registerObject(object, {
      scalable: options.scalable ?? true,
      throwable: options.throwable ?? true
    });
  }

  return object;
}

function updateScanner() {
  if (!state.scannerLight) return;

  const elapsed = performance.now() - state.lastScanTime;

  if (elapsed < 250) {
    state.scannerLight.material.color.setHex(COLORS.green);
  } else {
    state.scannerLight.material.color.setHex(COLORS.red);
  }
}

function updateRegisterScreen() {
  if (!state.registerScreen) return;

  const currentOrder = S?.currentOrder;

  if (currentOrder && currentOrder.total) {
    state.registerScreen.material.color.setHex(0x79ff9d);
  } else {
    state.registerScreen.material.color.setHex(0x42624c);
  }
}

function updateMoneyPhysics(delta) {
  for (const bill of state.money) {
    if (!bill || bill.userData.heldBy) continue;

    if (!bill.userData.velocity) continue;

    bill.position.addScaledVector(
      bill.userData.velocity,
      delta
    );

    bill.userData.velocity.multiplyScalar(
      Math.pow(0.04, delta)
    );

    if (bill.position.y < 1.48) {
      bill.position.y = 1.48;
      bill.userData.velocity.set(0, 0, 0);
    }
  }
}

export function scanProduct(product) {
  if (!product) return null;

  const data = product.userData?.product;

  if (!data) return null;

  state.lastScanTime = performance.now();

  flashScanner();

  console.log(
    `[Store] Scanned ${data.name} - $${data.price.toFixed(2)}`
  );

  return {
    name: data.name,
    price: data.price
  };
}

function flashScanner() {
  if (!state.scannerLight) return;

  state.scannerLight.material.color.setHex(COLORS.green);

  setTimeout(() => {
    if (state.scannerLight) {
      state.scannerLight.material.color.setHex(COLORS.red);
    }
  }, 220);
}

export function toggleCashDrawer() {
  if (!state.cashDrawer) return;

  state.drawerOpen = !state.drawerOpen;

  const targetZ = state.drawerOpen ? 2.28 : 1.9;

  state.cashDrawer.position.z = targetZ;
}

export function isCashDrawerOpen() {
  return state.drawerOpen;
}

export function getProducts() {
  return [...state.products];
}

export function getStoreObjects() {
  return {
    counter: state.counter,
    scanner: state.scanner,
    register: state.register,
    cashDrawer: state.cashDrawer,
    cardReader: state.cardReader,
    receiptPrinter: state.receiptPrinter,
    bagArea: state.bagArea
  };
}

export function getStoreState() {
  return {
    running: state.running,
    drawerOpen: state.drawerOpen,
    productCount: state.products.length,
    moneyCount: state.money.length
  };
}

export function openDrawer() {
  if (!state.drawerOpen) {
    toggleCashDrawer();
  }
}

export function closeDrawer() {
  if (state.drawerOpen) {
    toggleCashDrawer();
  }
}