# babylon-msdf-text

Introducing babylon-msdf-text, that implements the Multi-channel Signed Distance Field (MSDF) technique for text rendering. This library provides developers with an efficient and straightforward way to render high-quality, scalable, and anti-aliased text in their Babylon.js projects. Leveraging the power of MSDF, it allows for superior text rendering, especially in WebGL contexts, overcoming the limitations of traditional bitmap fonts.

## Installation

```bash
npm install babylon-msdf-text
```

## Usage

First, import the createTextMesh function from the library:

```javascript
import { createTextMesh } from "babylon-msdf-text";
```

The createTextMesh function is used to create a text mesh. It accepts the following parameters:

- `text`: The text string you want to render in the scene.
- `font`: A JSON file with font data.
- `scene`: The Babylon.js scene in which you want to render the text.
- `atlas`: A PNG image of the font.
- `engine`: The Babylon.js engine.
  Here is a small example of how to use the library:

## Example

```javascript
// Import Babylon.js
import * as BABYLON from "@babylonjs/core";
// Import createTextMesh, font data and font png
import { createTextMesh } from "babylon-msdf-text";
import fnt from "./fontAssets/roboto-regular.json";
import png from "./fontAssets/roboto-regular.png";

// Create Babylon.js scene
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

engine.runRenderLoop(function () {
  scene.render();
});

window.addEventListener("resize", function () {
  engine.resize();
});

// Create text mesh
let textGeo = createTextMesh({
  text: `Hello Babylon`,
  font: fnt,
  scene,
  atlas: png,
  engine,
});

textGeo.position.x = -textGeo.getBoundingInfo().boundingBox.center.x / 2;
textGeo.position.y = textGeo.getBoundingInfo().boundingBox.center.y / 2;
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
