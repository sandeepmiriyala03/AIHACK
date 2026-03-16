// pdf-poppler.d.ts
declare module "pdf-poppler" {
  export class Converter {
    constructor(pdfPath: string);
    convert(options: {
      format: string;
      out_dir: string;
      out_prefix: string;
      page_range?: string;
    }): Promise<void>;
  }
}
