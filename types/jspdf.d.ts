declare module 'jspdf' {
  export interface JsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: string | number[];
  }

  export class jsPDF {
    constructor(options?: JsPDFOptions);
    setFontSize(size: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, size: number): string[];
    addPage(): void;
    save(filename: string): void;
  }
}
