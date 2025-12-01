// utils/pdfFonts.ts
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

/*  
   Load and register your Telugu font (any .ttf from /public/fonts/)
   This works for: Ramaneeya, Tenali, Veturi, Sirivennela, Timmana, Chathura etc.
*/

export async function registerTeluguFont(fontFile: string = "TenaliRamakrishna-Regular.ttf") {
  // Default vfs for basic fonts
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  // Load your custom Telugu font
  const res = await fetch(`/fonts/${fontFile}`);
  const buffer = await res.arrayBuffer();

  // Convert font → base64
  const base64String = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  // Store inside virtual file system
  pdfMake.vfs[fontFile] = base64String;

  // Register your Telugu font
  pdfMake.fonts = {
    teluguFont: {
      normal: fontFile,        // Regular
      bold: fontFile,          // If you want separate bold, change here
      italics: fontFile,       // If your font has italics
      bolditalics: fontFile
    }
  };

  return pdfMake;
}
