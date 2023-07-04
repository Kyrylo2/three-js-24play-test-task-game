import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import Stats from 'three/addons/libs/stats.module.js';

// Змінні
const container = document.getElementById('game-container');
const totalScoreContainer = document.getElementById('game-score-container');
const loader = new GLTFLoader();
const clock = new THREE.Clock();
const smoothness = 0.1;
let targetX = 0;
let stickMan, mixer, idleAction;
let action = 'Run';

let brainEnemyTargetZ = -30;
let totalBrainEnemies = 0;
let brainsArray = [];
let textMeshArray = [];
let totalUsersScore = 0;

let leftCubePositionZ = 0;
let rightCubePositionZ = 0;

let isGameStarted = false;

let color = 0xff9c7c;

// Оновлення кольору чоловічка
function updateStickManColor() {
  console.log(stickMan);
  if (stickMan) {
    stickMan.traverse((node) => {
      if (node.isMesh && node.name === 'Stickman') {
        node.material.color.setHex(color);
        node.castShadow = true;
      }
    });
  }
}

// Обробка натискання клавіш

function handleKeyPress(event) {
  if (event.key === 'ArrowLeft') {
    if (targetX < 3) {
      targetX += 3;
    }
  } else if (event.key === 'ArrowRight') {
    if (targetX > -3) {
      targetX -= 3;
    }
  }
}

// Ініціалізація сцени, камери
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x87ceeb);
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
// renderer.shadowMap.needsUpdate = true;
container.appendChild(renderer.domElement);

// Додаткові налаштування камери
const cameraDistance = 20;
const cameraOffsetY = 10;
const cameraOffsetZ = 10;
const cameraTargetY = 0;
camera.position.set(0, cameraOffsetY, -cameraDistance);
camera.lookAt(new THREE.Vector3(0, cameraTargetY, cameraOffsetZ));

// Основні функції
init();
loadModels();
animate();

// Ініціалізація сцени та розмірів
function init() {
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('keydown', handleKeyPress, false);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  ambientLight.position.y = 3;
  ambientLight.position.z = 2;
  ambientLight.position.x = -1;
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(20, 30, 10); // Експериментуйте з позицією світла
  directionalLight.castShadow = true;

  // Налаштування тіней камери
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -60;
  directionalLight.shadow.camera.right = 60;
  directionalLight.shadow.camera.top = 60;
  directionalLight.shadow.camera.bottom = -60;

  const shadowMapSize = 1024 * 10;

  // Застосувати розмиття до тіні
  directionalLight.shadow.mapSize.width = shadowMapSize;
  directionalLight.shadow.mapSize.height = shadowMapSize;

  directionalLight.shadow.bias = -0.0009;

  scene.add(directionalLight);
}

// Завантаження моделей
function loadModels() {
  //load tracks
  loadTrack();

  //Load StickMan
  loadStickMan(action);

  //Load Brain Enemy
  loadBrainEnemy();

  //Load Cubs for background
  generatorLoadBackGroundCube(40, 'left');
  generatorLoadBackGroundCube(40, 'right');

  // Load background water
  loadWaterBackground();
}

function generatorLoadBackGroundCube(quantity, side) {
  let randomSideSize;
  for (let i = 0; i <= quantity; i++) {
    randomSideSize = getRandomValue(2, 6);
    loadBackGroundCube(randomSideSize, side);
  }
}

function loadWaterBackground() {
  const textureLoader = new THREE.TextureLoader();
  const waterTexture = textureLoader.load('/src/assets/textures/water.jpg');
  waterTexture.wrapS = THREE.RepeatWrapping;
  waterTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.repeat.set(100, 100);

  const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x0044ff,
    map: waterTexture,
  });

  const waterPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  waterPlane.rotation.x = -Math.PI / 2; // Повернути площину на 90 градусів
  waterPlane.position.y = -10;

  scene.add(waterPlane);

  // Змінні для анімації руху води
  const speed = 0.003; // Швидкість руху води
  let offsetX = 0;
  let offsetY = 0;

  // Функція оновлення анімації
  function animateWater() {
    offsetX += speed;
    offsetY += speed - 0.002;
    waterTexture.offset.set(offsetX, offsetY);
    renderer.render(scene, camera);
    requestAnimationFrame(animateWater);
  }

  animateWater();
}

function loadBackGroundCube(sideSize = 3, side = 'left') {
  const texture = new THREE.TextureLoader().load(
    '/src/assets/textures/crate.gif'
  );

  const cubePositionZ =
    side === 'left' ? leftCubePositionZ : rightCubePositionZ;

  const newPointPositionZ = cubePositionZ + sideSize / 2;

  texture.colorSpace = THREE.sRGBColorSpace;

  const geometry = new THREE.BoxGeometry(sideSize, sideSize, sideSize);
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const cube = new THREE.Mesh(geometry, material);

  cube.position.x = getRandomValue(6, 12) * (side === 'left' ? 1 : -1);
  cube.position.y = -6 + sideSize / 2;
  cube.position.z = newPointPositionZ;

  scene.add(cube);
  side === 'left'
    ? (leftCubePositionZ += sideSize)
    : (rightCubePositionZ += sideSize);
}

function loadTrack() {
  loader.load('/src/assets/models/TrackFloor.glb', (gltf) => {
    const track = gltf.scene;

    track.traverse((node) => {
      if (node.isMesh) {
        node.receiveShadow = true;
      }
    });

    // Додайте наступний код для отримання розмірів моделі
    const bbox = new THREE.Box3().setFromObject(track);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Збільшення масштабу фігури

    track.scale.set(1, 1, 10); // Оновлення матриці світу моделі

    track.updateMatrixWorld();

    const bbox1 = new THREE.Box3().setFromObject(track);
    const size1 = new THREE.Vector3();
    bbox1.getSize(size1);

    track.position.z = size1.z - 20;

    scene.add(track);
  });
}

function loadStickMan(action) {
  loader.load('/src/assets/models/Stickman.glb', (gltf) => {
    stickMan = gltf.scene;

    const stickManAnimations = gltf.animations;

    stickMan.traverse((node) => {
      if (node.isMesh && node.name === 'Stickman') {
        node.material.color.setHex(color);
        node.castShadow = true;
      }

      if (node.isMesh && node.name === 'Plane') {
        // node.material = material;
        node.material.transparent = true;
        node.material.opacity = 0.0;
        node.castShadow = false;
      }
    });

    // Додайте наступний код для отримання розмірів моделі
    const stickManBox = new THREE.Box3().setFromObject(stickMan);
    const stickManSize = new THREE.Vector3();
    stickManBox.getSize(stickManSize);

    console.log(
      'Size man: x:',
      stickManSize.x,
      ', y:',
      stickManSize.y,
      ', z:',
      stickManSize.z
    );
    console.log(stickMan);
    scene.add(stickMan);
    stickMan.position.z = -10;

    mixer = new THREE.AnimationMixer(stickMan);
    console.log(mixer);
    const idleClip = THREE.AnimationClip.findByName(stickManAnimations, action);
    idleAction = mixer.clipAction(idleClip);
    idleAction.play();
  });
}

function loadBrainEnemy() {
  loader.load('/src/assets/models/Brain.glb', (gltf) => {
    totalBrainEnemies += 1;
    const brainEnemy = gltf.scene;
    const randomPositionX = getRandomPosition();
    const [randomColor, randomValue] = getRandomColorAndValue();

    brainEnemy.traverse((node) => {
      if (node.isMesh) {
        // Встановлюємо випадковий колір для Brain

        node.material.color.setHex(randomColor);
        node.castShadow = true;
      }
    });

    // Встановлюємо випадкове значення для Brain

    brainEnemy.userData.value = randomValue;

    // Збільшення масштабу фігури
    brainEnemy.scale.set(2, 2, 2);
    brainEnemy.position.y = 1;
    brainEnemy.position.x = randomPositionX;
    brainEnemy.position.z = 200;

    // Додавання Brain в сцену
    scene.add(brainEnemy);
    brainsArray.push(brainEnemy);

    const fontLoader = new FontLoader();

    fontLoader.load('/src/helvetiker_bold.typeface.json', function (font) {
      const textGeometry = new TextGeometry(randomValue.toString(), {
        font: font,
        size: 1,
        height: 1,
        bevelThickness: 1,
        // curveSegments: 12,
      });

      const matLite = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        mirror: false,
      }); // Червоний колір

      const text = new THREE.Mesh(textGeometry, matLite);
      text.position.copy(brainEnemy.position);

      text.position.copy(brainEnemy.position);

      console.log(text);

      textMeshArray.push(text);

      scene.add(text);
    });
  });
}

function loadBoxEnemy() {
  const texture = new THREE.TextureLoader().load(
    '/src/assets/textures/crate.gif'
  );

  const sideSize = 3;

  // const cubePositionZ =
  //   side === 'left' ? leftCubePositionZ : rightCubePositionZ;

  // const newPointPositionZ = cubePositionZ + sideSize / 2;

  texture.colorSpace = THREE.sRGBColorSpace;

  const geometry = new THREE.BoxGeometry(sideSize, sideSize, sideSize);
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;

  cube.position.x = getRandomValue(6, 12) * (side === 'left' ? 1 : -1);
  cube.position.y = -6 + sideSize / 2;
  cube.position.z = newPointPositionZ;

  scene.add(cube);

  // Встановлюємо випадкове значення для Brain

  brainEnemy.userData.value = randomValue;

  // Збільшення масштабу фігури
  brainEnemy.scale.set(2, 2, 2);
  brainEnemy.position.y = 1;
  brainEnemy.position.x = randomPositionX;
  brainEnemy.position.z = 100;

  // Додавання Brain в сцену
  scene.add(brainEnemy);
  brainsArray.push(brainEnemy);

  const fontLoader = new FontLoader();

  fontLoader.load('/src/helvetiker_bold.typeface.json', function (font) {
    const textGeometry = new TextGeometry(randomValue.toString(), {
      font: font,
      size: 1,
      height: 1,
      bevelThickness: 1,
      // curveSegments: 12,
    });

    const matLite = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      mirror: false,
    }); // Червоний колір

    const text = new THREE.Mesh(textGeometry, matLite);
    text.position.copy(brainEnemy.position);

    text.position.copy(brainEnemy.position);

    console.log(text);

    textMeshArray.push(text);

    scene.add(text);
  });

  // ----------------------------------------------------------------

  loader.load('/src/assets/models/Brain.glb', (gltf) => {
    totalBrainEnemies += 1;
    const brainEnemy = gltf.scene;
    const randomPositionX = getRandomPosition();
    const [randomColor, randomValue] = getRandomColorAndValue();

    brainEnemy.traverse((node) => {
      if (node.isMesh) {
        // Встановлюємо випадковий колір для Brain

        node.material.color.setHex(randomColor);
        node.castShadow = true;
      }
    });

    // Встановлюємо випадкове значення для Brain

    brainEnemy.userData.value = randomValue;

    // Збільшення масштабу фігури
    brainEnemy.scale.set(2, 2, 2);
    brainEnemy.position.y = 1;
    brainEnemy.position.x = randomPositionX;
    brainEnemy.position.z = 100;

    // Додавання Brain в сцену
    scene.add(brainEnemy);
    brainsArray.push(brainEnemy);

    const fontLoader = new FontLoader();

    fontLoader.load('/src/helvetiker_bold.typeface.json', function (font) {
      const textGeometry = new TextGeometry(randomValue.toString(), {
        font: font,
        size: 1,
        height: 1,
        bevelThickness: 1,
        // curveSegments: 12,
      });

      const matLite = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        mirror: false,
      }); // Червоний колір

      const text = new THREE.Mesh(textGeometry, matLite);
      text.position.copy(brainEnemy.position);

      text.position.copy(brainEnemy.position);

      console.log(text);

      textMeshArray.push(text);

      scene.add(text);
    });
  });
}

// Отримання випадкового значення для Brain (1, 2 або 3)
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Отримання випадкового кольору для Brain
function getRandomColorAndValue() {
  const colors = [0xff9c7c, 0x00ff00, 0xffff00]; // Червоний, Зелений, Жовтий
  const values = [1, 2, 3];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return [colors[randomIndex], values[randomIndex]];
}

function getRandomPosition() {
  const pointX = [-3, 0, 3]; // зліва, по центру, справа
  const randomIndex = Math.floor(Math.random() * pointX.length);
  return pointX[randomIndex];
}

// Оновлення розмірів вікна
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollisions() {
  if (stickMan) {
    const stickManBox = new THREE.Box3().setFromObject(stickMan);

    for (let i = brainsArray.length - 1; i >= 0; i--) {
      const brainEnemy = brainsArray[i];
      const textMesh = textMeshArray[i];
      const brainEnemyBox = new THREE.Box3().setFromObject(brainEnemy);

      if (stickManBox.intersectsBox(brainEnemyBox)) {
        console.log('виявлено зіткнення з BOX', i);
        // Виявлено зіткнення
        const value = brainEnemy.userData.value;
        const color = brainEnemy.children[0].material.color.getHex();
        console.log(brainEnemy);
        // Оновлення балів
        updateScore(value);

        // Видалення Brain зі сцени
        brainsArray.splice(i, 1);
        textMeshArray.splice(i, 1);

        scene.remove(brainEnemy);
        scene.remove(textMesh);

        // Оновлення кольору гравця
        updatePlayerColor(color);

        break; // Вийти з циклу, якщо виявлено зіткнення з одним мозком (щоб не обробляти решту мозків)
      }
    }
  }
}

// Оновлення кольору гравця
function updatePlayerColor(color) {
  stickMan.traverse((node) => {
    if (node.isMesh && node.name === 'Stickman') {
      node.material.color.setHex(color);
    }
  });
}

// Оновлення загальних балів користувача
function updateScore(value) {
  totalUsersScore += value;
  totalScoreContainer.innerHTML = `Total Score: ${totalUsersScore}`;
}

// Оновлення анімації сцени
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsedSeconds = clock.getElapsedTime();

  if (mixer) {
    mixer.update(delta);
  }

  if (stickMan) {
    const currentPosition = stickMan.position.x;
    const targetPosition = targetX;
    const newPosition = THREE.MathUtils.lerp(
      currentPosition,
      targetPosition,
      smoothness
    );

    stickMan.position.x = newPosition;
  }

  // Генерація нового Brain кожну секунду
  if (elapsedSeconds > 1) {
    loadBrainEnemy();
    clock.start(); // Перезапуск годинника
  }

  // Оновлення позицій і балів для кожного Brain
  brainsArray.forEach((brainEnemy, i) => {
    if (brainEnemy.position.z !== brainEnemyTargetZ) {
      const brainEnemyCurrentPosition = brainEnemy.position.z;
      const newPosition = THREE.MathUtils.lerp(
        brainEnemyCurrentPosition,
        brainEnemyTargetZ,
        smoothness / 10
      );

      brainEnemy.position.z = newPosition;

      // Перевірка на зіткнення з гравцем
      checkCollisions();
    }

    const textMesh = textMeshArray[i];

    if (brainEnemy.position.z < -25) {
      scene.remove(brainEnemy);
      scene.remove(textMesh);
    }

    if (textMesh.position) {
      // Оновлення позиції текстового об'єкту
      textMesh.position.copy(brainEnemy.position);
      textMesh.position.z -= 3;
      textMesh.position.x -= 0.5;
    }
  });

  renderer.render(scene, camera);
}
