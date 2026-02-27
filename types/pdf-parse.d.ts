declare module 'pdf-parse' {
  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: any
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;
  export = pdfParse;
}
