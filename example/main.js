import "./style.css";
import * as BABYLON from "@babylonjs/core";
import fnt from "./fontAssets/roboto-regular.json";
import png from "./fontAssets/roboto-regular.png";
import { createTextMesh } from "babylon-msdf-text";

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
  camera.setPosition(new BABYLON.Vector3(0, 0, -400));
  return camera;
};

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas);

const createScene = function (engine) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(1, 1, 1);
  //CAMERA
  initCamera(scene);

  return scene;
};

const scene = createScene(engine);

let textGeo = createTextMesh({
  text: `
  MSDF stands for Multi-channel Signed Distance Field. It's a technique used in text rendering, particularly in computer graphics and game development, to create high-quality, scalable text.
  Traditional bitmap fonts can become blurry or pixelated when scaled up. MSDF text rendering, on the other hand, allows for much higher quality text rendering at various scales and distances    `,
  font: fnt,
  scene,
  atlas: png,
  engine,
  width: 2500,
});

textGeo.position.x = -textGeo.getBoundingInfo().boundingBox.center.x / 2;
textGeo.position.y = textGeo.getBoundingInfo().boundingBox.center.y / 2;

const inputField = document.getElementById("text-input");

inputField.addEventListener("change", (e) => {
  textGeo.dispose();
  textGeo = createTextMesh({
    text: e.target.value,
    font: fnt,
    scene,
    atlas: png,
    engine,
    width: 1000,
  });

  textGeo.position.x = -textGeo.getBoundingInfo().boundingBox.center.x / 2;
  textGeo.position.y = textGeo.getBoundingInfo().boundingBox.center.y / 2;
});

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});
