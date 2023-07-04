import * as THREE from 'three';
// import { AxesHelper } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let animatedObject;
let mixer;
let action;

const AxesHelper = new THREE.AxesHelper(5);
scene.add(AxesHelper);

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(boxGeometry, boxMaterial);
// scene.add(cube);

const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  // opacity: 0.5,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

plane.rotation.x = -0.5 * Math.PI;

const gridHalper = new THREE.GridHelper(20);
scene.add(gridHalper);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0xdef6ff);

const assetsLoader = new GLTFLoader();

assetsLoader.load(
  '/src/assets/models/Stickman.glb',
  function (gltf) {
    scene.add(gltf.scene);
    console.log(gltf.animations);
    const animationClip = gltf.animations[4];

    mixer = new THREE.AnimationMixer(gltf.scene);
    action = mixer.clipAction(animationClip);
    console.log(action);
    action.play();
    // gltf.animations; // Array<THREE.AnimationClip>
    // gltf.scene; // THREE.Group
    // gltf.scenes; // Array<THREE.Group>
    // gltf.cameras; // Array<THREE.Camera>
    // gltf.asset; // Object
  },
  function (err) {
    console.log('1', err);
  },
  function (err) {
    console.log('2', err);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 15, -20);
console.log('3', camera.position);

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  if (mixer) {
    mixer.update();
  }
}

animate();
