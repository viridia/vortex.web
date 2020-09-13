const MAX_COLS = 80;

export class PrintStream {
  private out: string[] = [];
  private line: string[] = [];
  private lineLength = 0;
  private maxLineLength = MAX_COLS;
  private indentLevel = 1;
  private nextIndentLevel = 1;

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
    if (this.line.length > 0) {
      this.out.push('  '.repeat(this.indentLevel) + this.line.join('').trim());
      this.line.length = 0;
      this.lineLength = 0;
    }
    this.indentLevel = this.nextIndentLevel;
  }

  public canFit(length: number): boolean {
    return this.indentLevel * 2 + this.lineLength + length < this.maxLineLength;
  }

  public append(text: string) {
    this.lineLength += text.length;
    this.line.push(text);
  }

  public getIndentLevel(): number {
    return this.nextIndentLevel;
  }

  public setIndentLevel(indentLevel: number) {
    this.nextIndentLevel = indentLevel;
  }
}
