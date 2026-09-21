/* =========================================================
   LIFE: WebXR
   world.js
   Neighborhood / buildings / roads / environment
========================================================= */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export class WorldSystem {

  constructor(game) {
    this.game = game;

    this.scene = game.scene;

    this.objects = [];
    this.buildings = [];
    this.trees = [];
    this.interactives = [];

    this.clock = 0;

    this.worldSize = 220;

    this.materials = {};
  }

  /* =======================================================
     START
  ======================================================= */

  init() {

    this.createMaterials();

    this.createGround();

    this.createRoads();

    this.createSidewalks();

    this.createNeighborhood();

    this.createPlayerHouse();

    this.createStores();

    this.createJobArea();

    this.createParks();

    this.createStreetLights();

    this.createEnvironment();

    return this;
  }

  /* =======================================================
     MATERIALS
  ======================================================= */

  createMaterials() {

    this.materials.grass =
      new THREE.MeshStandardMaterial({
        color: 0x3f7042,
        roughness: 1
      });

    this.materials.road =
      new THREE.MeshStandardMaterial({
        color: 0x24272b,
        roughness: 0.95
      });

    this.materials.sidewalk =
      new THREE.MeshStandardMaterial({
        color: 0x969696,
        roughness: 1
      });

    this.materials.white =
      new THREE.MeshStandardMaterial({
        color: 0xf0f0f0
      });

    this.materials.yellow =
      new THREE.MeshStandardMaterial({
        color: 0xe5b82d
      });

    this.materials.house =
      new THREE.MeshStandardMaterial({
        color: 0xc7a78b,
        roughness: 0.9
      });

    this.materials.house2 =
      new THREE.MeshStandardMaterial({
        color: 0x9eafb8,
        roughness: 0.9
      });

    this.materials.roof =
      new THREE.MeshStandardMaterial({
        color: 0x373737,
        roughness: 1
      });

    this.materials.window =
      new THREE.MeshStandardMaterial({
        color: 0x6c9fc0,
        roughness: 0.25,
        metalness: 0.1
      });

    this.materials.door =
      new THREE.MeshStandardMaterial({
        color: 0x4c3022,
        roughness: 0.8
      });

    this.materials.tree =
      new THREE.MeshStandardMaterial({
        color: 0x315b34
      });

    this.materials.trunk =
      new THREE.MeshStandardMaterial({
        color: 0x5a3822
      });

    this.materials.shop =
      new THREE.MeshStandardMaterial({
        color: 0x42678c,
        roughness: 0.8
      });

    this.materials.parking =
      new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 1
      });

    this.materials.streetLight =
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.4,
        roughness: 0.7
      });

    this.materials.light =
      new THREE.MeshStandardMaterial({
        color: 0xffe9a3,
        emissive: 0xffc94a,
        emissiveIntensity: 2
      });
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  box(
    x,
    y,
    z,
    width,
    height,
    depth,
    material,
    parent = this.scene
  ) {

    const geometry =
      new THREE.BoxGeometry(
        width,
        height,
        depth
      );

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.set(
      x,
      y,
      z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    this.objects.push(mesh);

    return mesh;
  }

  cylinder(
    x,
    y,
    z,
    radius,
    height,
    material,
    parent = this.scene
  ) {

    const geometry =
      new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        16
      );

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.set(
      x,
      y,
      z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    this.objects.push(mesh);

    return mesh;
  }

  /* =======================================================
     GROUND
  ======================================================= */

  createGround() {

    const ground =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          this.worldSize,
          0.5,
          this.worldSize
        ),
        this.materials.grass
      );

    ground.position.y = -0.25;

    ground.receiveShadow = true;

    this.scene.add(ground);

    this.ground = ground;

    this.objects.push(ground);
  }

  /* =======================================================
     ROADS
  ======================================================= */

  createRoads() {

    const roadWidth = 14;

    // Main north/south road
    this.box(
      0,
      0,
      0,
      roadWidth,
      0.12,
      this.worldSize,
      this.materials.road
    );

    // Main east/west road
    this.box(
      0,
      0,
      0,
      this.worldSize,
      0.12,
      roadWidth,
      this.materials.road
    );

    // Secondary roads
    const secondaryRoads = [
      -65,
      -35,
      35,
      65
    ];

    for (const x of secondaryRoads) {

      this.box(
        x,
        0,
        0,
        9,
        0.1,
        this.worldSize,
        this.materials.road
      );
    }

    for (const z of secondaryRoads) {

      this.box(
        0,
        0,
        z,
        this.worldSize,
        0.1,
        9,
        this.materials.road
      );
    }

    this.createRoadLines();
  }

  createRoadLines() {

    const lineMaterial =
      this.materials.yellow;

    // Center road markings

    for (
      let z = -100;
      z <= 100;
      z += 8
    ) {

      this.box(
        0,
        0.08,
        z,
        0.3,
        0.025,
        4,
        lineMaterial
      );
    }

    for (
      let x = -100;
      x <= 100;
      x += 8
    ) {

      this.box(
        x,
        0.08,
        0,
        4,
        0.025,
        0.3,
        lineMaterial
      );
    }
  }

  /* =======================================================
     SIDEWALKS
  ======================================================= */

  createSidewalks() {

    const sidewalkMaterial =
      this.materials.sidewalk;

    // Main roads

    this.box(
      -9,
      0.08,
      0,
      3,
      0.16,
      this.worldSize,
      sidewalkMaterial
    );

    this.box(
      9,
      0.08,
      0,
      3,
      0.16,
      this.worldSize,
      sidewalkMaterial
    );

    this.box(
      0,
      0.08,
      -9,
      this.worldSize,
      0.16,
      3,
      sidewalkMaterial
    );

    this.box(
      0,
      0.08,
      9,
      this.worldSize,
      0.16,
      3,
      sidewalkMaterial
    );

    // Smaller road sidewalks

    const positions = [
      -65,
      -35,
      35,
      65
    ];

    for (const p of positions) {

      this.box(
        p - 6,
        0.08,
        0,
        2,
        0.16,
        this.worldSize,
        sidewalkMaterial
      );

      this.box(
        p + 6,
        0.08,
        0,
        2,
        0.16,
        this.worldSize,
        sidewalkMaterial
      );

      this.box(
        0,
        0.08,
        p - 6,
        this.worldSize,
        0.16,
        2,
        sidewalkMaterial
      );

      this.box(
        0,
        0.08,
        p + 6,
        this.worldSize,
        0.16,
        2,
        sidewalkMaterial
      );
    }
  }

  /* =======================================================
     HOUSE
  ======================================================= */

  createHouse(
    x,
    z,
    options = {}
  ) {

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    const width =
      options.width || 12;

    const depth =
      options.depth || 10;

    const height =
      options.height || 5;

    const material =
      options.material ||
      this.materials.house;

    // Main building

    this.box(
      0,
      height / 2,
      0,
      width,
      height,
      depth,
      material,
      group
    );

    // Roof

    const roof =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          Math.max(width, depth) * 0.75,
          4,
          4
        ),
        this.materials.roof
      );

    roof.rotation.y =
      Math.PI / 4;

    roof.position.y =
      height + 2;

    roof.castShadow = true;

    group.add(roof);

    // Door

    const door =
      this.box(
        0,
        1.35,
        depth / 2 + 0.08,
        2,
        2.7,
        0.18,
        this.materials.door,
        group
      );

    door.userData.type = "door";

    // Windows

    const windowPositions = [
      [-width * 0.3, 2.4, depth / 2 + 0.1],
      [ width * 0.3, 2.4, depth / 2 + 0.1]
    ];

    for (const p of windowPositions) {

      this.box(
        p[0],
        p[1],
        p[2],
        2.3,
        1.5,
        0.15,
        this.materials.window,
        group
      );
    }

    group.userData.type = "house";

    group.userData.interactive = true;

    this.buildings.push(group);

    return group;
  }

  /* =======================================================
     NEIGHBORHOOD
  ======================================================= */

  createNeighborhood() {

    const houses = [
      [-48, -48],
      [-25, -48],
      [25, -48],
      [48, -48],

      [-48, -25],
      [48, -25],

      [-48, 25],
      [48, 25],

      [-48, 48],
      [-25, 48],
      [25, 48],
      [48, 48],

      [-78, -48],
      [-78, -20],
      [-78, 20],
      [-78, 48],

      [78, -48],
      [78, -20],
      [78, 20],
      [78, 48]
    ];

    houses.forEach(
      ([x, z], index) => {

        this.createHouse(
          x,
          z,
          {
            width: 11,
            depth: 9,
            height: 4.5,
            material:
              index % 2 === 0
                ? this.materials.house
                : this.materials.house2
          }
        );
      }
    );
  }

  /* =======================================================
     PLAYER HOUSE
  ======================================================= */

  createPlayerHouse() {

    const house =
      this.createHouse(
        25,
        -25,
        {
          width: 15,
          depth: 12,
          height: 5,
          material:
            new THREE.MeshStandardMaterial({
              color: 0x8b6c55,
              roughness: 0.85
            })
        }
      );

    house.userData.playerHome = true;

    house.userData.name =
      "Player Home";

    // Mailbox

    const mailbox =
      this.box(
        8,
        0.8,
        -25,
        0.7,
        1.2,
        0.7,
        this.materials.door
      );

    mailbox.userData.type =
      "mailbox";

    mailbox.userData.interactive =
      true;

    // Driveway

    this.box(
      17,
      0.08,
      -18,
      8,
      0.15,
      14,
      this.materials.parking
    );

    return house;
  }

  /* =======================================================
     STORES
  ======================================================= */

  createStores() {

    this.createStore(
      -25,
      25,
      "GENERAL STORE",
      0x416c92
    );

    this.createStore(
      25,
      25,
      "FOOD MARKET",
      0x557c4a
    );

    this.createStore(
      -25,
      -25,
      "ELECTRONICS",
      0x674e88
    );
  }

  createStore(
    x,
    z,
    name,
    color
  ) {

    const material =
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75
      });

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    this.box(
      0,
      4,
      0,
      18,
      8,
      13,
      material,
      group
    );

    // Sign

    const signMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x202020
      });

    this.box(
      0,
      8.5,
      6.7,
      15,
      2,
      0.4,
      signMaterial,
      group
    );

    // Entrance

    const entrance =
      this.box(
        0,
        1.5,
        6.65,
        3,
        3,
        0.2,
        this.materials.window,
        group
      );

    entrance.userData.type =
      "store";

    entrance.userData.storeName =
      name;

    entrance.userData.interactive =
      true;

    group.userData.type =
      "store";

    group.userData.name =
      name;

    this.buildings.push(group);

    return group;
  }

  /* =======================================================
     JOB AREA
  ======================================================= */

  createJobArea() {

    const group =
      new THREE.Group();

    group.position.set(
      -25,
      0,
      70
    );

    this.scene.add(group);

    // Building

    this.box(
      0,
      4,
      0,
      18,
      8,
      12,
      this.materials.house2,
      group
    );

    // Job sign

    this.box(
      0,
      8.5,
      6.2,
      12,
      2,
      0.3,
      this.materials.roof,
      group
    );

    const board =
      this.box(
        0,
        2,
        6.4,
        4,
        4,
        0.3,
        this.materials.yellow,
        group
      );

    board.userData.type =
      "job-board";

    board.userData.interactive =
      true;

    board.userData.jobs = [
      "Delivery Worker",
      "Store Worker",
      "Mechanic",
      "Cleaner"
    ];

    group.userData.type =
      "job-center";

    return group;
  }

  /* =======================================================
     PARKS
  ======================================================= */

  createParks() {

    this.createPark(
      -72,
      70,
      28
    );

    this.createPark(
      72,
      70,
      28
    );

    this.createPark(
      -72,
      -70,
      28
    );
  }

  createPark(
    x,
    z,
    size
  ) {

    const grass =
      new THREE.MeshStandardMaterial({
        color: 0x4f854d
      });

    const park =
      this.box(
        x,
        0.05,
        z,
        size,
        0.1,
        size,
        grass
      );

    park.userData.type =
      "park";

    // Trees

    const treePositions = [
      [-9, -9],
      [9, -9],
      [-9, 9],
      [9, 9],
      [0, 0]
    ];

    for (const [tx, tz] of treePositions) {

      this.createTree(
        x + tx,
        z + tz
      );
    }

    // Bench

    this.createBench(
      x,
      z + 10
    );
  }

  /* =======================================================
     TREES
  ======================================================= */

  createTree(
    x,
    z
  ) {

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.35,
          0.45,
          3,
          10
        ),
        this.materials.trunk
      );

    trunk.position.y =
      1.5;

    trunk.castShadow = true;

    group.add(trunk);

    const leaves =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          2.1,
          12,
          10
        ),
        this.materials.tree
      );

    leaves.position.y =
      4;

    leaves.castShadow = true;

    group.add(leaves);

    group.userData.type =
      "tree";

    this.trees.push(group);

    return group;
  }

  /* =======================================================
     BENCH
  ======================================================= */

  createBench(
    x,
    z
  ) {

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    this.box(
      0,
      1,
      0,
      4,
      0.35,
      1,
      this.materials.door,
      group
    );

    this.box(
      0,
      2,
      -0.35,
      4,
      1.5,
      0.3,
      this.materials.door,
      group
    );

    this.box(
      -1.5,
      0.5,
      0,
      0.3,
      1,
      1,
      this.materials.door,
      group
    );

    this.box(
      1.5,
      0.5,
      0,
      0.3,
      1,
      1,
      this.materials.door,
      group
    );

    group.userData.type =
      "bench";

    group.userData.interactive =
      true;

    return group;
  }

  /* =======================================================
     STREET LIGHTS
  ======================================================= */

  createStreetLights() {

    const positions = [
      [-12, -12],
      [12, -12],
      [-12, 12],
      [12, 12],

      [-42, 0],
      [42, 0],
      [0, -42],
      [0, 42],

      [-72, 0],
      [72, 0],
      [0, -72],
      [0, 72]
    ];

    for (const [x, z] of positions) {

      this.createStreetLight(
        x,
        z
      );
    }
  }

  createStreetLight(
    x,
    z
  ) {

    const group =
      new THREE.Group();

    group.position.set(
      x,
      0,
      z
    );

    this.scene.add(group);

    this.cylinder(
      0,
      3,
      0,
      0.12,
      6,
      this.materials.streetLight,
      group
    );

    const lamp =
      this.box(
        0,
        6.1,
        0,
        0.8,
        0.35,
        0.8,
        this.materials.light,
        group
      );

    lamp.userData.type =
      "street-light";

    return group;
  }

  /* =======================================================
     ENVIRONMENT
  ======================================================= */

  createEnvironment() {

    // Outer trees make the map feel larger.

    for (
      let i = 0;
      i < 80;
      i++
    ) {

      const side =
        Math.floor(
          Math.random() * 4
        );

      let x;
      let z;

      if (side === 0) {

        x =
          -105 +
          Math.random() * 10;

        z =
          -100 +
          Math.random() * 200;

      } else if (side === 1) {

        x =
          95 +
          Math.random() * 10;

        z =
          -100 +
          Math.random() * 200;

      } else if (side === 2) {

        x =
          -100 +
          Math.random() * 200;

        z =
          -105 +
          Math.random() * 10;

      } else {

        x =
          -100 +
          Math.random() * 200;

        z =
          95 +
          Math.random() * 10;
      }

      this.createTree(
        x,
        z
      );
    }
  }

  /* =======================================================
     UPDATE
  ======================================================= */

  update(delta) {

    this.clock += delta;

    // Small environmental animation.

    for (
      let i = 0;
      i < this.trees.length;
      i++
    ) {

      const tree =
        this.trees[i];

      if (!tree) continue;

      const sway =
        Math.sin(
          this.clock * 0.7 +
          i
        ) * 0.015;

      tree.rotation.z =
        sway;
    }
  }

  /* =======================================================
     GETTERS
  ======================================================= */

  getBuildings() {
    return this.buildings;
  }

  getTrees() {
    return this.trees;
  }

  getObjects() {
    return this.objects;
  }
}