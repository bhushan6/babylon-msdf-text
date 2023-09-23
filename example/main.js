import "./style.css";
import * as BABYLON from "@babylonjs/core";
import { createTextMesh } from "babylon-msdf-text";
import fnt from "./fontAssets/roboto-regular.json";
import png from "./fontAssets/roboto-regular.png";
import { Pane } from "tweakpane";

const PARAMS = {
  text: "Hello Babylon",
  lineHeight: 1,
  letterSpacing: 0,
  width: 2500,
  align: "left",
  color: { r: 255 / 255, g: 105 / 255, b: 180 / 255 },
  opacity: 1,
};

const initCamera = (scene) => {
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    0,
    0,
    10,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );

  camera.attachControl(true);
  camera.setPosition(new BABYLON.Vector3(0, 0, -600));
  return camera;
};

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas);

const createScene = function (engine) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0, 0, 0);
  //CAMERA
  initCamera(scene);

  return scene;
};

const scene = createScene(engine);

let textMesh = createTextMesh({
  text: `Hello`,
  font: fnt,
  scene,
  atlas: png,
  engine,
  color: new BABYLON.Color3(1, 0, 0),
  ...PARAMS,
});

textMesh.position.x = -textMesh.getBoundingInfo().boundingBox.center.x / 2;
textMesh.position.y = textMesh.getBoundingInfo().boundingBox.center.y / 2;

const sceneSize = 100;
const initialCount = 2;
var addPerFrame = 2;

// let total = 0;
const createTextInstance = function() {
        // if (total > maxCount) {
        //     addPerFrame = 0;
        //     scene.freeActiveMeshes();
        //     return;
        // }
        // total++;
        var clone = textMesh.createInstance(i + "text")
        let radius = Math.random() * 2.5 * sceneSize;
        let angle = Math.PI * 2 * Math.random();
        clone.position = new BABYLON.Vector3(
          Math.cos(angle) * radius,
          Math.random() * 2 * sceneSize - sceneSize,
          Math.sin(angle) * radius
        );

        clone.rotation.x = 3.14;
        clone.rotationQuaternion = null;
        clone.alwaysSelectAsActiveMesh = true;
        clone.freezeWorldMatrix();
        clone.isPickable = false;
        clone.material.freeze();
    }

    for (let i = 0; i < initialCount; i++) {
        createTextInstance();
    }


//GUI PANEL
const pane = new Pane();

const lineHeightInput = pane.addBinding(PARAMS, "lineHeight", {
  min: 1,
  max: 10,
  step: 0.1,
});

const textInput = pane.addBinding(PARAMS, "text");

const letterSpacingInput = pane.addBinding(PARAMS, "letterSpacing", {
  min: 0,
  max: 100,
  step: 0.1,
});

const widthInput = pane.addBinding(PARAMS, "width", {
  min: 100,
  max: 5000,
  step: 10,
});

const alignInput = pane.addBinding(PARAMS, "align", {
  options: { Left: "left", Center: "center", Right: "right" },
});

const colorInput = pane.addBinding(PARAMS, "color", {
  color: { type: "float" },
});
const opacityInput = pane.addBinding(PARAMS, "opacity", {
  min: 0,
  max: 1,
  step: 0.1,
});

const updateMesh = () => {
  textMesh.dispose();
  textMesh = createTextMesh({
    text: `hello`,
    font: fnt,
    atlas: png,
    scene,
    engine,
    color: new BABYLON.Color3(1, 0, 0),
    width: 2500,
    ...PARAMS,
  });

  textMesh.position.x = -textMesh.getBoundingInfo().boundingBox.center.x / 2;
  textMesh.position.y = textMesh.getBoundingInfo().boundingBox.center.y / 2;

  for (let i = 0; i < initialCount; i++) {
    createTextInstance();
}
};

lineHeightInput.on("change", (e) => {
  updateMesh();
});

textInput.on("change", (e) => {
  updateMesh();
});

widthInput.on("change", (e) => {
  updateMesh();
});

letterSpacingInput.on("change", (e) => {
  updateMesh();
});

alignInput.on("change", (e) => {
  updateMesh();
});

colorInput.on("change", (e) => {
  updateMesh();
});

opacityInput.on("change", (e) => {
  updateMesh();
});




    // let alphaSpeed = 0.001;
    // scene.registerBeforeRender(() => {
    //     scene.activeCamera.alpha += alphaSpeed;

    //     if (alphaSpeed < 0.005) {
    //         alphaSpeed *= 1.05;
    //     }

    //     for (var i = 0; i < addPerFrame; i++) {
    //         createTextInstance();
    //     }
    // });  

    for (var i = 0; i < addPerFrame; i++) {
      // createTextInstance();
    }

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});