import { fragmentShader, setCustomAttributes, vertexShader } from "./utils";
import createIndices from "quad-indices";
import { createLayout } from "./TextLayout";
import vertices from "./vertices";
import * as BABYLON from "@babylonjs/core";

export const createTextMesh = ({
  color = new BABYLON.Color3(0, 0, 0),
  stroke,
  strokeColor = new BABYLON.Color3(0, 0, 0),
  opacity = 1,
  strokeWidth = 0.5,
  instancing= false,
  ...options
}) => {
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

  const normals = [];
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

  setCustomAttributes({
    engine: options.engine,
    data: infos.wordIndex,
    kind: "wordIndex",
    stride: 1,
    mesh: textMesh,
  });
  setCustomAttributes({
    engine: options.engine,
    data: infos.letterIndex,
    kind: "letterIndex",
    stride: 1,
    mesh: textMesh,
  });

  vertexData.applyToMesh(textMesh);
  textMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

  // textMesh.rotation.y = 0;
  // textMesh.rotation.x = 3.14;

  BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;

  BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;

  const instanceDefine = instancing ? ["#define INSTANCES"] : []

  const shaderMaterial = new BABYLON.ShaderMaterial(
    "shader",
    options.scene,
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
      defines: [...instanceDefine],
      needAlphaBlending: true,
    }
  );

  const mainTexture = new BABYLON.Texture(options.atlas, options.scene);
  shaderMaterial.setTexture("uFontAtlas", mainTexture);

  const uColor = new BABYLON.Color3(color.r, color.g, color.b);
  shaderMaterial.setColor3("uColor", uColor);

  const uStrokeColor = new BABYLON.Color3(
    strokeColor.r,
    strokeColor.g,
    strokeColor.b
  );
  shaderMaterial.setColor3("uStrokeColor", uStrokeColor);

  shaderMaterial.setFloat("uThreshold", 0.05);
  shaderMaterial.setFloat("uStrokeOutsetWidth", 0.0);
  shaderMaterial.setFloat("uStrokeInsetWidth", 0.3);
  shaderMaterial.setFloat("uOpacity", opacity);
  shaderMaterial.setFloat("uAlphaTest", 0.01);

  shaderMaterial.setInt("uLinesTotal", infos.linesTotal);
  shaderMaterial.setInt("uWordsTotal", infos.wordsTotal);
  shaderMaterial.setInt("uLettersTotal", infos.lettersTotal);

  shaderMaterial.backFaceCulling = false;

  textMesh.material = shaderMaterial;

  return textMesh;
};
