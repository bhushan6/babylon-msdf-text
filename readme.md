# babylon-msdf-text

Introducing babylon-msdf-text, that implements the Multi-channel Signed Distance Field (MSDF) technique for text rendering. This library provides developers with an efficient and straightforward way to render high-quality, scalable, and anti-aliased text in their Babylon.js projects. Leveraging the power of MSDF, it allows for superior text rendering, especially in WebGL contexts, overcoming the limitations of traditional bitmap fonts.
Here is [Live Demo](https://64d52b0b504b31091f46c3dc--singular-yeot-d552d6.netlify.app/)

![npm](https://img.shields.io/npm/v/babylon-msdf-text.svg?style=flat-square) ![npm](https://img.shields.io/npm/dt/babylon-msdf-text.svg?style=flat-square)

## Installation

```bash
npm install babylon-msdf-text
```

## Usage

```javascript
import { createTextMesh } from "babylon-msdf-text";
```

The createTextMesh function is used to create a text mesh. It accepts the following parameters:
align (string) can be "left", "center" or "right" (default: left)
letterSpacing (number) the letter spacing in pixels (default: 0)
lineHeight (number) the line height in pixels (default to font.common.lineHeight)

- `text`: The text string you want to render in the scene.
- `font`: A JSON file with font data (Required).
- `scene`: The Babylon.js scene in which you want to render the text (Required).
- `atlas`: A PNG image of the font (Required).
- `engine`: The Babylon.js engine (Required).
- `width` : width of text block.
- `opacity` : opacity of text.
- `lineHeight` : The line height in percent. Default and minimum is 1.
- `letterSpacing` : the letter spacing in pixel
- `align` : Horizontal text alignment. Can be "left", 'center' or "right". Default is "left"
- `color` : fill color of text. can be babylon's Color3 class or object of r, g and b values.

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

## How to create assets for MSDF

You can use [online MSDF assets generator](https://msdf-bmfont.donmccurdy.com/) to generate json and png file.

- Just upload `.ttf` file of your choice of font
- Type the characters you wanna pack in assets (including space)
- select the size of texture
- And create MSDF and that's it 🎉

## Roadmap

- Option to add stroke
- More Examples
- NPM Publish workflow

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
