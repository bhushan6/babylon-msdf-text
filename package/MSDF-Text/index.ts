import * as BABYLON from "@babylonjs/core";
import { createLayout, TextLayoutOptions } from "./TextLayout";
import { TextMeshAttributes, TextMeshInfos } from "./Vertices";
//@ts-ignore
import createIndices from "quad-indices";

/**
 * Options for creating a text mesh
 */
export interface TextMeshOptions extends TextLayoutOptions {
  atlas: string | BABYLON.Texture;
  color?: BABYLON.Color3;
  strokeColor?: BABYLON.Color3;
  opacity?: number;
  strokeWidth?: number;
}

/**
 * Creates a text mesh using MSDF technique
 * @param options - Configuration options for the text mesh
 * @returns A Babylon.js Mesh with MSDF text rendering
 */
export function createTextMesh(
  name: string,
  options: TextMeshOptions,
  scene: BABYLON.Scene
): BABYLON.Mesh {
  const {
    color = new BABYLON.Color3(0, 0, 0),
    strokeColor = new BABYLON.Color3(0, 0, 0),
    opacity = 1,
    strokeWidth = 0.5,
    atlas,
    ...layoutOptions
  } = options;

  const engine = scene.getEngine() as BABYLON.Engine;

  const layout = createLayout(layoutOptions);
  const font = options.font;

  // Determine texture size from font file
  const texWidth = font.common.scaleW;
  const texHeight = font.common.scaleH;

  // Get visible glyphs
  const glyphs = layout.glyphs.filter((glyph) => {
    const bitmap = glyph.data;
    return bitmap.width * bitmap.height > 0;
  });

  const attributes = TextMeshAttributes.create(
    glyphs,
    texWidth,
    texHeight,
    true,
    layout
  );
  const infos = TextMeshInfos.create(glyphs);
  const indices = createIndices([], {
    clockwise: true,
    type: "uint16",
    count: glyphs.length,
  });

  const textMesh = new BABYLON.Mesh(name, scene);
  const vertexData = new BABYLON.VertexData();

  vertexData.positions = attributes.positions;
  vertexData.indices = indices;
  vertexData.uvs = attributes.uvs;

  const normals: number[] = [];
  BABYLON.VertexData.ComputeNormals(attributes.positions, indices, normals);
  vertexData.normals = normals;

  // Set custom vertex attributes
  TextMeshAttributes.setCustomAttributes(engine, textMesh, attributes);
  TextMeshInfos.setCustomAttributes(engine, textMesh, infos);

  vertexData.applyToMesh(textMesh);

  // Register shaders
  BABYLON.Effect.ShadersStore["MSDFVertexShader"] = vertexShader;
  BABYLON.Effect.ShadersStore["MSDFFragmentShader"] = fragmentShader;

  // Create material
  const shaderMaterial = new BABYLON.ShaderMaterial(
    "msdfShader",
    scene,
    {
      vertex: "MSDF",
      fragment: "MSDF",
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
        "viewProjection",
        "projection",
        "uColor",
        "uThreshold",
        "uStrokeOutsetWidth",
        "uStrokeInsetWidth",
        "uOpacity",
        "uAlphaTest",
        "uStrokeColor",
        "uLinesTotal",
        "uWordsTotal",
        "uLettersTotal",
      ],
      needAlphaBlending: true,
    }
  );

  // Set material properties
  const mainTexture =
    atlas instanceof BABYLON.Texture
      ? atlas
      : new BABYLON.Texture(atlas, scene);

  shaderMaterial.setTexture("uFontAtlas", mainTexture);
  shaderMaterial.setColor3("uColor", color);
  shaderMaterial.setColor3("uStrokeColor", strokeColor);
  shaderMaterial.setFloat("uThreshold", 0.05);
  shaderMaterial.setFloat("uStrokeOutsetWidth", 0);
  shaderMaterial.setFloat("uStrokeInsetWidth", strokeWidth);
  shaderMaterial.setFloat("uOpacity", opacity);
  shaderMaterial.setFloat("uAlphaTest", 0.01);
  shaderMaterial.setInt("uLinesTotal", infos.linesTotal);
  shaderMaterial.setInt("uWordsTotal", infos.wordsTotal);
  shaderMaterial.setInt("uLettersTotal", infos.lettersTotal);
  shaderMaterial.backFaceCulling = false;

  textMesh.material = shaderMaterial;

  return textMesh;
}

/**
 * MSDF vertex shader
 */
const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec2 center;
attribute float lineIndex;
attribute float lineLettersTotal;
attribute float lineLetterIndex;
attribute float lineWordsTotal;
attribute float lineWordIndex;
attribute float wordIndex;
attribute float letterIndex;

uniform mat4 viewProjection;

varying vec2 vUv;
varying vec2 vCenter;
varying float vLineIndex;
varying float vLineLettersTotal;
varying float vLineLetterIndex;
varying float vLineWordsTotal;
varying float vLineWordIndex;
varying float vWordIndex;
varying float vLetterIndex;

#include<instancesDeclaration>

void main(void) {
  #include<instancesVertex>
  gl_Position = viewProjection * finalWorld * vec4(position, 1.0);
  vUv = uv;
  vCenter = center;
  vLineIndex = lineIndex;
  vLineLettersTotal = lineLettersTotal;
  vLineLetterIndex = lineLetterIndex;
  vLineWordsTotal = lineWordsTotal;
  vLineWordIndex = lineWordIndex;
  vWordIndex = wordIndex;
  vLetterIndex = letterIndex;
}
`;

/**
 * MSDF fragment shader
 */
const fragmentShader = `
precision highp float;

varying vec2 vUv;
varying vec2 vCenter;
varying float vLineIndex;
varying float vLineLettersTotal;
varying float vLineLetterIndex;
varying float vLineWordsTotal;
varying float vLineWordIndex;
varying float vWordIndex;
varying float vLetterIndex;

uniform sampler2D uFontAtlas;
uniform vec3 uStrokeColor;
uniform vec3 uColor;
uniform float uThreshold;
uniform float uStrokeOutsetWidth;
uniform float uStrokeInsetWidth;
uniform float uOpacity;
uniform float uAlphaTest;
uniform int uLinesTotal;
uniform int uWordsTotal;
uniform int uLettersTotal;

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main(void) {
  float thickness = 0.5;
  float softness = 0.5;

  vec3 s = texture2D(uFontAtlas, vUv).rgb;
  float sigDist = median(s.r, s.g, s.b) - 0.5;
  float afwidth = 1.4142135623730951 / 2.0;

  #ifdef IS_SMALL
  float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
  #else
  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
  #endif

  float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
  float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;

  #ifdef IS_SMALL
  float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
  float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
  #else
  float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
  float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
  #endif

  float border = outset * inset;

  if (alpha < uAlphaTest) discard;

  vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
  vec4 strokedFragColor = vec4(uStrokeColor, uOpacity * border);

  gl_FragColor = mix(filledFragColor, strokedFragColor, border);
}
`;
