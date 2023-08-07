import "./style.css";
import * as BABYLON from "@babylonjs/core";
import fnt from "./fontAssets/abel-regular-msdf.json";
import png from "./fontAssets/abel-regular.png";
import { createLayout } from "./MSDF-Text/TextLayout";
import vertices from "./MSDF-Text/vertices";
import createIndices from "quad-indices";
const setCustomAttributes = ({ engine, data, kind, stride, mesh }) => {
  const buffer = new BABYLON.VertexBuffer(
    engine,
    data,
    kind,
    true,
    false,
    stride
  );

  mesh.setVerticesBuffer(buffer);
};

const createTextGeometry = (options = {}) => {
  const layout = createLayout(options);
  const font = options.font;

  // determine texture size from font file
  const texWidth = font.common.scaleW;
  const texHeight = font.common.scaleH;

  // get visible glyphs
  const glyphs = layout.glyphs.filter((glyph) => {
    const bitmap = glyph.data;
    return bitmap.width * bitmap.height > 0;
  });

  // const visibleGlyphs = glyphs;

  const attributes = vertices.attributes(
    glyphs,
    texWidth,
    texHeight,
    true,
    layout
  );

  const infos = vertices.infos(glyphs, layout);
  const indices = createIndices([], {
    clockwise: true,
    type: "uint16",
    count: glyphs.length,
  });

  const textMesh = new BABYLON.Mesh(options.text || "text", options.scene);

  const vertexData = new BABYLON.VertexData();

  vertexData.positions = attributes.positions;
  vertexData.indices = indices;
  vertexData.uvs = attributes.uvs;

  var normals = [];
  BABYLON.VertexData.ComputeNormals(attributes.positions, indices, normals);
  vertexData.normals = normals;

  setCustomAttributes({
    engine: options.engine,
    data: attributes.centers,
    kind: "center",
    stride: 2,
    mesh: textMesh,
  });

  setCustomAttributes({
    engine: options.engine,
    data: attributes.layoutUvs,
    kind: "layoutUv",
    stride: 2,
    mesh: textMesh,
  });

  // // this.setAttribute('linesTotal', new BufferAttribute(infos.linesTotal, 1)); // Use uniforms instead
  setCustomAttributes({
    engine: options.engine,
    data: infos.lineIndex,
    kind: "lineIndex",
    stride: 1,
    mesh: textMesh,
  });

  setCustomAttributes({
    engine: options.engine,
    data: infos.lineLettersTotal,
    kind: "lineLettersTotal",
    stride: 1,
    mesh: textMesh,
  });

  setCustomAttributes({
    engine: options.engine,
    data: infos.lineLetterIndex,
    kind: "lineLetterIndex",
    stride: 1,
    mesh: textMesh,
  });

  setCustomAttributes({
    engine: options.engine,
    data: infos.lineWordsTotal,
    kind: "lineWordsTotal",
    stride: 1,
    mesh: textMesh,
  });

  setCustomAttributes({
    engine: options.engine,
    data: infos.lineWordIndex,
    kind: "lineWordIndex",
    stride: 1,
    mesh: textMesh,
  });

  // // this.setAttribute('wordsTotal', new BufferAttribute(infos.wordsTotal, 1)); // Use uniforms instead
  setCustomAttributes({
    engine: options.engine,
    data: infos.wordIndex,
    kind: "wordIndex",
    stride: 1,
    mesh: textMesh,
  });

  // // this.setAttribute('lettersTotal', new BufferAttribute(infos.lettersTotal, 1)); // Use uniforms instead
  setCustomAttributes({
    engine: options.engine,
    data: infos.letterIndex,
    kind: "letterIndex",
    stride: 1,
    mesh: textMesh,
  });

  vertexData.applyToMesh(textMesh);
  textMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

  textMesh.rotation.y = 0;
  textMesh.rotation.x = 3.14;

  BABYLON.Effect.ShadersStore["customVertexShader"] = `
  precision highp float; 
  // Attributes 
  attribute vec3 position; 
  attribute vec2 uv; 
  attribute vec2 center; 
  // Uniforms 
  uniform mat4 worldViewProjection; 
  // Varying 
  varying vec2 vUV; 
  varying vec2 vCenter; 
  void main(void) { 
    gl_Position = worldViewProjection * vec4(position, 1.0); 
    vUV = uv; 
    vCenter = center;
  }
  `;

  BABYLON.Effect.ShadersStore["customFragmentShader"] = `
  precision highp float; 
  varying vec2 vUV; 
  varying vec2 vCenter; 
  uniform sampler2D uFontAtlas; 
  
  float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
  }
  
  void main(void) { 
    float uThreshold = 0.05;
    float uStrokeOutsetWidth = 0.1;
    float uStrokeInsetWidth = 0.1;
    float  uOpacity =  1.0;
    vec3 uColor = vec3(0.);
    float uAlphaTest =  0.01;
    vec3 uStrokeColor = vec3(1., 0., 0.);

    vec3 s = texture2D(uFontAtlas, vUV).rgb;
    float sigDist = median(s.r, s.g, s.b) - 0.5;
    float afwidth = 1.4142135623730951 / 2.0;
    
    #ifdef IS_SMALL
    float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
    #else
    float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
    #endif
    
    float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
    
    // Inset
    float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;
    
    #ifdef IS_SMALL
    float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
    float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
    #else
    float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
    float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
    #endif
    
    float border = outset * inset;
    
    // Alpha Test
    if (alpha < uAlphaTest) discard;

    // Output: Common
    vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
    
    // Output: Strokes
    vec4 strokedFragColor = vec4(uStrokeColor, uOpacity * border);
    
    gl_FragColor = filledFragColor ; 
  }
  `;

  var shaderMaterial = new BABYLON.ShaderMaterial(
    "shader",
    scene,
    {
      vertex: "custom",
      fragment: "custom",
    },

    {
      attributes: [
        "position",
        "normal",
        "uv",
        "center",
        "layoutUv",
        "lineIndex",
        "lineLettersTotal",
        "lineLetterIndex",
        "lineWordsTotal",
        "lineWordIndex",
        "wordIndex",
        "letterIndex",
      ],
      uniforms: [
        "world",
        "worldView",
        "worldViewProjection",
        "view",
        "projection",
      ],
    }
  );

  const mainTexture = new BABYLON.Texture(options.atlas, scene);
  shaderMaterial.setTexture("uFontAtlas", mainTexture);

  console.log(mainTexture);

  shaderMaterial.backFaceCulling = false;

  textMesh.material = shaderMaterial;

  return textMesh;
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
  camera.setPosition(new BABYLON.Vector3(0, 0, -200));
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

let textGeo = createTextGeometry({
  text: `
  MSDF stands for Multi-channel Signed Distance Field. It's a technique used in text rendering, particularly in computer graphics and game development, to create high-quality, scalable text.
  Traditional bitmap fonts can become blurry or pixelated when scaled up. MSDF text rendering, on the other hand, allows for much higher quality text rendering at various scales and distances    `,
  font: fnt,
  scene,
  atlas: png,
  engine,
  width: 700,
});

textGeo.position.x = -textGeo.getBoundingInfo().boundingBox.center.x / 2;
textGeo.position.y = textGeo.getBoundingInfo().boundingBox.center.y / 2;

const inputField = document.getElementById("text-input");

inputField.addEventListener("change", (e) => {
  textGeo.dispose();
  textGeo = createTextGeometry({
    text: e.target.value,
    font: fnt,
    scene,
    atlas: png,
    engine,
    width: 700,
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
