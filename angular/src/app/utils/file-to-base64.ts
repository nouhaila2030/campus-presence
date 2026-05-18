const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier doit être une image.'));
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      reject(new Error('La photo ne doit pas dépasser 2 Mo.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Impossible de lire la photo.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire la photo.'));
    reader.readAsDataURL(file);
  });
}
