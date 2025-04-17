import { wordwrapLines } from "./wordWrapper";

const X_HEIGHTS = [
  "x",
  "e",
  "a",
  "o",
  "n",
  "s",
  "r",
  "c",
  "u",
  "m",
  "v",
  "w",
  "z",
];
const M_WIDTHS = ["m", "w"];
const CAP_HEIGHTS = [
  "H",
  "I",
  "N",
  "E",
  "F",
  "K",
  "L",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const TAB_ID = "\t".charCodeAt(0);
const SPACE_ID = " ".charCodeAt(0);
const ALIGN_LEFT = 0;
const ALIGN_CENTER = 1;
const ALIGN_RIGHT = 2;

/**
 * Font character data
 */
interface FontChar {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  page?: number;
  char?: string;
}

/**
 * Font kerning data
 */
interface FontKerning {
  first: number;
  second: number;
  amount: number;
}

/**
 * Font common data
 */
interface FontCommon {
  lineHeight: number;
  base: number;
  scaleW: number;
  scaleH: number;
}

/**
 * Font data structure
 */
interface Font {
  chars: FontChar[];
  kernings: FontKerning[];
  common: FontCommon;
}

/**
 * Glyph data with layout information
 */
export interface Glyph {
  position: [number, number];
  data: FontChar;
  index: number;
  linesTotal: number;
  lineIndex: number;
  lineLettersTotal: number;
  lineLetterIndex: number;
  lineWordsTotal: number;
  lineWordIndex: number;
  wordsTotal: number;
  wordIndex: number;
  lettersTotal: number;
  letterIndex: number;
}

/**
 * Text layout options
 */
export interface TextLayoutOptions {
  text: string;
  font: any;
  width?: number;
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  tabSize?: number;
  lineHeight?: number;
  measure?: (
    text: string,
    start: number,
    end: number,
    width: number
  ) => { start: number; end: number; width: number };
}

/**
 * Text layout class for arranging glyphs
 */
export class TextLayout {
  public glyphs: Glyph[] = [];
  private _width: number = 0;
  private _height: number = 0;
  private _descender: number = 0;
  private _ascender: number = 0;
  private _xHeight: number = 0;
  private _baseline: number = 0;
  private _capHeight: number = 0;
  private _lineHeight: number = 0;
  private _linesTotal: number = 0;
  private _lettersTotal: number = 0;
  private _wordsTotal: number = 0;
  private _options!: TextLayoutOptions;
  private _fallbackSpaceGlyph: FontChar | null = null;
  private _fallbackTabGlyph: FontChar | null = null;

  constructor(options: TextLayoutOptions) {
    this.update(options);
  }

  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get descender(): number {
    return this._descender;
  }
  get ascender(): number {
    return this._ascender;
  }
  get xHeight(): number {
    return this._xHeight;
  }
  get baseline(): number {
    return this._baseline;
  }
  get capHeight(): number {
    return this._capHeight;
  }
  get lineHeight(): number {
    return this._lineHeight;
  }
  get linesTotal(): number {
    return this._linesTotal;
  }
  get lettersTotal(): number {
    return this._lettersTotal;
  }
  get wordsTotal(): number {
    return this._wordsTotal;
  }
  get glyphsArray(): Glyph[] {
    return this.glyphs;
  }

  /**
   * Updates the text layout with new options
   * @param options - Text layout configuration
   */
  update(options: TextLayoutOptions): void {
    options = Object.assign(
      { measure: this.computeMetrics.bind(this) },
      options
    );
    this._options = options;
    this._options.tabSize = number(options.tabSize, 4);

    if (!options.font) {
      throw new Error("Must provide a valid bitmap font");
    }

    const glyphs = this.glyphs;
    const text = options.text || "";
    const font = options.font;
    this._setupSpaceGlyphs(font);

    const lines = wordwrapLines(text, options);
    const minWidth = options.width || 0;

    const wordsTotal = text.split(" ").filter((word) => word !== "\n").length;
    const lettersTotal = text
      .split("")
      .filter((char) => char !== "\n" && char !== " ").length;

    glyphs.length = 0;

    const maxLineWidth = lines.reduce(
      (prev, line) => Math.max(prev, line.width, minWidth),
      0
    );

    let x = 0;
    let y = 0;
    const optionLineHeight = options.lineHeight ?? 1;
    const lineHeight = font.common.lineHeight * Math.max(optionLineHeight, 1);
    const baseline = font.common.base;
    const descender = lineHeight - baseline;
    const letterSpacing = options.letterSpacing || 0;
    const height = lineHeight * lines.length - descender;
    const align = getAlignType(options.align);

    y -= height;

    this._width = maxLineWidth;
    this._height = height;
    this._descender = lineHeight - baseline;
    this._baseline = baseline;
    this._xHeight = getXHeight(font);
    this._capHeight = getCapHeight(font);
    this._lineHeight = lineHeight;
    this._ascender = lineHeight - descender - this._xHeight;

    let wordIndex = 0;
    let letterIndex = 0;

    lines.forEach((line, lineIndex) => {
      const start = line.start;
      const end = line.end;
      const lineWidth = line.width;
      const lineString = text.slice(start, end);

      const lineWordsTotal = lineString
        .split(" ")
        .filter((item) => item !== "").length;
      const lineLettersTotal = text
        .slice(start, end)
        .split(" ")
        .join("").length;
      let lineLetterIndex = 0;
      let lineWordIndex = 0;

      let lastGlyph: FontChar | undefined;

      for (let i = start; i < end; i++) {
        const id = text.charCodeAt(i);
        const glyph = this.getGlyph(font, id);

        if (glyph) {
          if (lastGlyph) {
            x += getKerning(font, lastGlyph.id, glyph.id);
          }

          let tx = x;
          if (align === ALIGN_CENTER) {
            tx += (maxLineWidth - lineWidth) / 2;
          } else if (align === ALIGN_RIGHT) {
            tx += maxLineWidth - lineWidth;
          }

          glyphs.push({
            position: [tx, y],
            data: glyph,
            index: i,
            linesTotal: lines.length,
            lineIndex,
            lineLettersTotal,
            lineLetterIndex,
            lineWordsTotal,
            lineWordIndex,
            wordsTotal,
            wordIndex,
            lettersTotal,
            letterIndex,
          });

          if (glyph.id === SPACE_ID && lastGlyph?.id !== SPACE_ID) {
            lineWordIndex++;
            wordIndex++;
          }

          if (glyph.id !== SPACE_ID) {
            lineLetterIndex++;
            letterIndex++;
          }

          x += glyph.xadvance + letterSpacing;
          lastGlyph = glyph;
        }
      }

      y += lineHeight;
      x = 0;
    });

    this._lettersTotal = lettersTotal;
    this._wordsTotal = wordsTotal;
    this._linesTotal = lines.length;
  }

  /**
   * Gets a glyph by its character ID
   * @param font - Font data
   * @param id - Character ID
   * @returns Glyph data or null
   */
  private getGlyph(font: Font, id: number): FontChar | null {
    const glyph = getGlyphById(font, id);
    if (glyph) return glyph;
    if (id === TAB_ID) return this._fallbackTabGlyph;
    if (id === SPACE_ID) return this._fallbackSpaceGlyph;
    return null;
  }

  /**
   * Computes metrics for text layout
   */
  private computeMetrics(
    text: string,
    start: number,
    end: number,
    width: number
  ) {
    const letterSpacing = this._options.letterSpacing || 0;
    const font = this._options.font;
    let curPen = 0;
    let curWidth = 0;
    let count = 0;
    let lastGlyph: FontChar | undefined;

    if (!font.chars || font.chars.length === 0) {
      return { start, end: start, width: 0 };
    }

    end = Math.min(text.length, end);

    for (let i = start; i < end; i++) {
      const id = text.charCodeAt(i);
      const glyph = this.getGlyph(font, id);

      if (glyph) {
        glyph.char = text[i];
        const kern = lastGlyph ? getKerning(font, lastGlyph.id, glyph.id) : 0;
        curPen += kern;

        const nextPen = curPen + glyph.xadvance + letterSpacing;
        const nextWidth = curPen + glyph.width;

        if (nextWidth >= width || nextPen >= width) break;

        curPen = nextPen;
        curWidth = nextWidth;
        lastGlyph = glyph;
      }
      count++;
    }

    if (lastGlyph) {
      curWidth += lastGlyph.xoffset;
    }

    return { start, end: start + count, width: curWidth };
  }

  /**
   * Sets up fallback glyphs for space and tab
   */
  private _setupSpaceGlyphs(font: Font): void {
    this._fallbackSpaceGlyph = null;
    this._fallbackTabGlyph = null;

    if (!font.chars || font.chars.length === 0) return;

    const space =
      getGlyphById(font, SPACE_ID) || getMGlyph(font) || font.chars[0];
    const tabWidth = this._options.tabSize || 0 * space.xadvance;
    this._fallbackSpaceGlyph = space;
    this._fallbackTabGlyph = {
      ...space,
      x: 0,
      y: 0,
      xadvance: tabWidth,
      id: TAB_ID,
      xoffset: 0,
      yoffset: 0,
      width: 0,
      height: 0,
    };
  }
}

/**
 * Creates a new text layout instance
 * @param options - Text layout configuration
 * @returns New TextLayout instance
 */
export function createLayout(options: TextLayoutOptions): TextLayout {
  return new TextLayout(options);
}

/**
 * Gets glyph by ID
 */
function getGlyphById(font: Font, id: number): FontChar | null {
  if (!font.chars || font.chars.length === 0) return null;
  const glyphIdx = findChar(font.chars, id);
  return glyphIdx >= 0 ? font.chars[glyphIdx] : null;
}

/**
 * Gets x-height from font
 */
function getXHeight(font: Font): number {
  for (const char of X_HEIGHTS) {
    const id = char.charCodeAt(0);
    const idx = findChar(font.chars, id);
    if (idx >= 0) return font.chars[idx].height;
  }
  return 0;
}

/**
 * Gets m-width glyph
 */
function getMGlyph(font: Font): FontChar | null {
  for (const char of M_WIDTHS) {
    const id = char.charCodeAt(0);
    const idx = findChar(font.chars, id);
    if (idx >= 0) return font.chars[idx];
  }
  return null;
}

/**
 * Gets cap height from font
 */
function getCapHeight(font: Font): number {
  for (const char of CAP_HEIGHTS) {
    const id = char.charCodeAt(0);
    const idx = findChar(font.chars, id);
    if (idx >= 0) return font.chars[idx].height;
  }
  return 0;
}

/**
 * Gets kerning value
 */
function getKerning(font: Font, left: number, right: number): number {
  if (!font.kernings || font.kernings.length === 0) return 0;
  for (const kern of font.kernings) {
    if (kern.first === left && kern.second === right) {
      return kern.amount;
    }
  }
  return 0;
}

/**
 * Gets alignment type
 */
function getAlignType(align?: string): number {
  if (align === "center") return ALIGN_CENTER;
  if (align === "right") return ALIGN_RIGHT;
  return ALIGN_LEFT;
}

/**
 * Finds character in array
 */
function findChar(array: FontChar[], value: number, start: number = 0): number {
  for (let i = start; i < array.length; i++) {
    if (array[i].id === value) return i;
  }
  return -1;
}

/**
 * Ensures number value
 */
function number(num: number | undefined, def: number): number {
  return typeof num === "number" ? num : typeof def === "number" ? def : 0;
}
