import { TextLayout, Glyph } from "./TextLayout";
import * as BABYLON from "@babylonjs/core";

/**
 * Text mesh vertex attributes
 */
export interface TextMeshAttributes {
  uvs: Float32Array;
  layoutUvs: Float32Array;
  positions: Float32Array;
  centers: Float32Array;
}

/**
 * Text mesh vertex infos
 */
export interface TextMeshInfos {
  linesTotal: number;
  lineIndex: Float32Array;
  lineLettersTotal: Float32Array;
  lineLetterIndex: Float32Array;
  lineWordsTotal: Float32Array;
  lineWordIndex: Float32Array;
  wordsTotal: number;
  wordIndex: Float32Array;
  lettersTotal: number;
  letterIndex: Float32Array;
}

/**
 * Text mesh attributes utilities
 */
export namespace TextMeshAttributes {
  /**
   * Creates vertex attributes for text mesh
   */
  export function create(
    glyphs: Glyph[],
    texWidth: number,
    texHeight: number,
    flipY: boolean,
    layout: TextLayout
  ): TextMeshAttributes {
    const uvs = new Float32Array(glyphs.length * 4 * 2);
    const layoutUvs = new Float32Array(glyphs.length * 4 * 2);
    const positions = new Float32Array(glyphs.length * 4 * 3);
    const centers = new Float32Array(glyphs.length * 4 * 2);

    let i = 0;
    let j = 0;
    let k = 0;
    let l = 0;

    glyphs.forEach((glyph) => {
      const bitmap = glyph.data;

      // UV
      const bw = bitmap.x + bitmap.width;
      const bh = bitmap.y + bitmap.height;
      const u0 = bitmap.x / texWidth;
      let v1 = bitmap.y / texHeight;
      const u1 = bw / texWidth;
      let v0 = bh / texHeight;

      if (flipY) {
        v1 = (texHeight - bitmap.y) / texHeight;
        v0 = (texHeight - bh) / texHeight;
      }

      uvs[i++] = u0;
      uvs[i++] = v1; // BL
      uvs[i++] = u0;
      uvs[i++] = v0; // TL
      uvs[i++] = u1;
      uvs[i++] = v0; // TR
      uvs[i++] = u1;
      uvs[i++] = v1; // BR

      // Layout UV
      layoutUvs[l++] = glyph.position[0] / layout.width;
      layoutUvs[l++] = (glyph.position[1] + layout.height) / layout.height;
      layoutUvs[l++] = glyph.position[0] / layout.width;
      layoutUvs[l++] =
        (glyph.position[1] + layout.height + bitmap.height) / layout.height;
      layoutUvs[l++] = (glyph.position[0] + bitmap.width) / layout.width;
      layoutUvs[l++] =
        (glyph.position[1] + layout.height + bitmap.height) / layout.height;
      layoutUvs[l++] = (glyph.position[0] + bitmap.width) / layout.width;
      layoutUvs[l++] = (glyph.position[1] + layout.height) / layout.height;

      // Positions
      const x = glyph.position[0] + bitmap.xoffset;
      const y = glyph.position[1] + bitmap.yoffset;
      const z = 0;
      const w = bitmap.width;
      const h = bitmap.height;

      positions[j++] = x;
      positions[j++] = -y;
      positions[j++] = z;
      positions[j++] = x;
      positions[j++] = -(y + h);
      positions[j++] = z;
      positions[j++] = x + w;
      positions[j++] = -(y + h);
      positions[j++] = z;
      positions[j++] = x + w;
      positions[j++] = -y;
      positions[j++] = z;

      // Centers
      const cx = x + w / 2;
      const cy = y + h / 2;
      for (let m = 0; m < 4; m++) {
        centers[k++] = cx;
        centers[k++] = cy;
      }
    });

    return { uvs, layoutUvs, positions, centers };
  }

  /**
   * Sets custom vertex attributes on mesh
   */
  export function setCustomAttributes(
    engine: BABYLON.Engine,
    mesh: BABYLON.Mesh,
    attributes: TextMeshAttributes
  ): void {
    const buffers: [Float32Array, string, number][] = [
      [attributes.centers, "center", 2],
      [attributes.layoutUvs, "layoutUv", 2],
    ];

    for (const [data, kind, stride] of buffers) {
      const buffer = new BABYLON.VertexBuffer(
        engine,
        data,
        kind,
        true,
        false,
        stride
      );
      mesh.setVerticesBuffer(buffer);
    }
  }
}

/**
 * Text mesh infos utilities
 */
export namespace TextMeshInfos {
  /**
   * Creates vertex infos for text mesh
   */
  export function create(glyphs: Glyph[]): TextMeshInfos {
    const lineIndex = new Float32Array(glyphs.length * 4);
    const lineLettersTotal = new Float32Array(glyphs.length * 4);
    const lineLetterIndex = new Float32Array(glyphs.length * 4);
    const lineWordsTotal = new Float32Array(glyphs.length * 4);
    const lineWordIndex = new Float32Array(glyphs.length * 4);
    const wordIndex = new Float32Array(glyphs.length * 4);
    const letterIndex = new Float32Array(glyphs.length * 4);

    let i = 0;
    let j = 0;
    let k = 0;
    let l = 0;
    let m = 0;
    let n = 0;
    let p = 0;
    let wordsTotal = 0;
    let linesTotal = 0;
    let lettersTotal = 0;

    for (const glyph of glyphs) {
      for (let q = 0; q < 4; q++) {
        lineIndex[i++] = glyph.lineIndex;
        lineLettersTotal[j++] = glyph.lineLettersTotal;
        lineLetterIndex[k++] = glyph.lineLetterIndex;
        lineWordsTotal[l++] = glyph.lineWordsTotal;
        lineWordIndex[m++] = glyph.lineWordIndex;
        wordIndex[n++] = glyph.wordIndex;
        letterIndex[p++] = glyph.letterIndex;
      }
      wordsTotal = glyph.wordsTotal;
      linesTotal = glyph.linesTotal;
      lettersTotal = glyph.lettersTotal;
    }

    return {
      linesTotal,
      lineIndex,
      lineLettersTotal,
      lineLetterIndex,
      lineWordsTotal,
      lineWordIndex,
      wordsTotal,
      wordIndex,
      lettersTotal,
      letterIndex,
    };
  }

  /**
   * Sets custom vertex infos on mesh
   */
  export function setCustomAttributes(
    engine: BABYLON.Engine,
    mesh: BABYLON.Mesh,
    infos: TextMeshInfos
  ): void {
    const buffers: [Float32Array, string, number][] = [
      [infos.lineIndex, "lineIndex", 1],
      [infos.lineLettersTotal, "lineLettersTotal", 1],
      [infos.lineLetterIndex, "lineLetterIndex", 1],
      [infos.lineWordsTotal, "lineWordsTotal", 1],
      [infos.lineWordIndex, "lineWordIndex", 1],
      [infos.wordIndex, "wordIndex", 1],
      [infos.letterIndex, "letterIndex", 1],
    ];

    for (const [data, kind, stride] of buffers) {
      const buffer = new BABYLON.VertexBuffer(
        engine,
        data,
        kind,
        true,
        false,
        stride
      );
      mesh.setVerticesBuffer(buffer);
    }
  }
}
