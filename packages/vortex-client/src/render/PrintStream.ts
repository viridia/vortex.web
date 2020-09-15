const MAX_COLS = 80;

export class PrintStream {
  private out: string[] = [];
  private currentLine: string[] = [];
  private currentLineLength = 0;
  private maxLineLength = MAX_COLS;
  private currentLineIndent = 1;
  private nextLineIndent = 1;

  public setMaxLineLength(maxLineLength: number) {
    this.maxLineLength = maxLineLength;
  }

  public toString() {
    return this.out.join('\n');
  }

  public toArray() {
    return this.out;
  }

  public breakLine() {
    if (this.currentLine.length > 0) {
      this.out.push('  '.repeat(this.currentLineIndent) + this.currentLine.join('').trim());
      this.currentLine.length = 0;
      this.currentLineLength = 0;
    }
    this.currentLineIndent = this.nextLineIndent;
  }

  public canFit(length: number): boolean {
    return this.currentLineIndent * 2 + this.currentLineLength + length < this.maxLineLength;
  }

  public append(text: string) {
    this.currentLineLength += text.length;
    this.currentLine.push(text);
  }

  public getCurrentLineIndent(): number {
    return this.currentLineIndent;
  }

  public getNextLineIndent(): number {
    return this.nextLineIndent;
  }

  /** Set the indent level for the next line after the current line. */
  public setNextLineIndent(indentLevel: number) {
    this.nextLineIndent = indentLevel;
  }
}
