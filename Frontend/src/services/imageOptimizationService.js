// client/src/services/imageOptimizationService.js
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const IMAGE_QUALITY = 0.7;

// Compresses and resizes an image before uploading
export const optimizeImage = (file) => {
    return new Promise((resolve, reject) => {
        // Skip optimization for non-image files
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        // Create new file from blob
                        const optimizedFile = new File(
                            [blob],
                            file.name,
                            {
                                type: file.type,
                                lastModified: Date.now()
                            }
                        );
                        resolve(optimizedFile);
                    },
                    file.type,
                    IMAGE_QUALITY
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
    });
};

const imageOptimizationService = {
    optimizeImage
};

export default imageOptimizationService;