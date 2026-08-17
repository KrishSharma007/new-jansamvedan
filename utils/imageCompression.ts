/**
 * Compresses an image file by resizing it to a maximum dimension (width or height)
 * and converting it to a JPEG data URL with the specified quality.
 * 
 * @param file The original image file from the input element
 * @param maxSize The maximum dimension (width or height) in pixels
 * @param quality The JPEG compression quality (0.0 to 1.0)
 * @returns A promise that resolves to the compressed base64 data URL
 */
export async function compressImage(
  file: File,
  maxSize: number = 512,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } else {
          // Fallback to original if canvas context cannot be created
          resolve(e.target?.result as string);
        }
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}
