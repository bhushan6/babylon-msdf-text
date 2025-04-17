const newline: RegExp = /\n/;
const newlineChar: string = "\n";
const whitespace: RegExp = /\s/;

interface Options {
  width?: number;
  start?: number;
  end?: number;
  mode?: "pre" | "nowrap" | undefined;
  measure?: (
    text: string,
    start: number,
    end: number,
    width: number
  ) => Measured;
}

interface Measured {
  start: number;
  end: number;
  width: number;
}

export function wordwrap(text: string, opt: Options = {}): string {
  const lines = wordwrapLines(text, opt);
  return lines.map((line) => text.substring(line.start, line.end)).join("\n");
}

export function wordwrapLines(
  text: string = "",
  opt: Options = {}
): Measured[] {
  const width: number =
    typeof opt.width === "number" ? opt.width : Number.MAX_VALUE;
  const start: number = Math.max(0, opt.start || 0);
  const end: number = typeof opt.end === "number" ? opt.end : text.length;
  const mode: string | undefined = opt.mode;

  const measure: (
    text: string,
    start: number,
    end: number,
    width: number
  ) => Measured = opt.measure || monospace;

  if (opt.width === 0 && opt.mode !== "nowrap") {
    return [];
  }

  if (mode === "pre") {
    return pre(measure, text, start, end, width);
  } else {
    return greedy(measure, text, start, end, width, mode);
  }
}

function idxOf(text: string, chr: string, start: number, end: number): number {
  const idx: number = text.indexOf(chr, start);
  if (idx === -1 || idx > end) {
    return end;
  }
  return idx;
}

function isWhitespace(chr: string): boolean {
  return whitespace.test(chr);
}

function pre(
  measure: (
    text: string,
    start: number,
    end: number,
    width: number
  ) => Measured,
  text: string,
  start: number,
  end: number,
  width: number
): Measured[] {
  const lines: Measured[] = [];
  let lineStart: number = start;

  for (let i = start; i < end && i < text.length; i++) {
    const chr: string = text.charAt(i);
    const isNewline: boolean = newline.test(chr);

    if (isNewline || i === end - 1) {
      const lineEnd: number = isNewline ? i : i + 1;
      const measured: Measured = measure(text, lineStart, lineEnd, width);
      lines.push(measured);

      lineStart = i + 1;
    }
  }
  return lines;
}

function greedy(
  measure: (
    text: string,
    start: number,
    end: number,
    width: number
  ) => Measured,
  text: string,
  start: number,
  end: number,
  width: number,
  mode: string | undefined
): Measured[] {
  const lines: Measured[] = [];
  let testWidth: number = width;

  if (mode === "nowrap") {
    testWidth = Number.MAX_VALUE;
  }

  while (start < end && start < text.length) {
    const newLine: number = idxOf(text, newlineChar, start, end);

    while (start < newLine) {
      if (!isWhitespace(text.charAt(start))) {
        break;
      }
      start++;
    }

    const measured: Measured = measure(text, start, newLine, testWidth);
    let lineEnd: number = start + (measured.end - measured.start);
    let nextStart: number = lineEnd + newlineChar.length;

    if (lineEnd < newLine) {
      while (lineEnd > start) {
        if (isWhitespace(text.charAt(lineEnd))) {
          break;
        }
        lineEnd--;
      }
      if (lineEnd === start) {
        if (nextStart > start + newlineChar.length) {
          nextStart--;
        }
        lineEnd = nextStart;
      } else {
        nextStart = lineEnd;
        while (lineEnd > start) {
          if (!isWhitespace(text.charAt(lineEnd - newlineChar.length))) {
            break;
          }
          lineEnd--;
        }
      }
    }
    if (lineEnd >= start) {
      const result: Measured = measure(text, start, lineEnd, testWidth);
      lines.push(result);
    }
    start = nextStart;
  }
  return lines;
}

function monospace(
  text: string,
  start: number,
  end: number,
  width: number
): Measured {
  const glyphs: number = Math.min(width, end - start);
  text;
  return {
    start,
    end: start + glyphs,
    width,
  };
}
