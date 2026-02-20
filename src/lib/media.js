import { databases, storage, DB_ID, COLLECTIONS, MEDIA_BUCKET_ID } from './appwrite';
import { Query, ID } from 'appwrite';

export const mediaService = {
    async uploadMedia(file, metadata = {}) {
        try {
            const uploadedFile = await storage.createFile(MEDIA_BUCKET_ID, ID.unique(), file);
            const fileUrl = `${import.meta.env.PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${MEDIA_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${import.meta.env.PUBLIC_APPWRITE_PROJECT_ID}`;
            
            const mediaRecord = await databases.createDocument(
                DB_ID,
                COLLECTIONS.MEDIA,
                ID.unique(),
                {
                    fileId: uploadedFile.$id,
                    filename: file.name,
                    originalName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    url: fileUrl,
                    ...metadata,
                    uploadedAt: new Date().toISOString()
                }
            );
            
            return {
                url: fileUrl,
                fileId: uploadedFile.$id,
                record: mediaRecord
            };
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    },

    async getMediaLibrary(options = {}) {
        try {
            const queries = [Query.orderDesc('uploadedAt')];
            
            if (options.tag) {
                queries.push(Query.contains('tags', options.tag));
            }
            if (options.type) {
                queries.push(Query.equal('mimeType', options.type));
            }
            if (options.search) {
                queries.push(Query.search('filename', options.search));
            }
            if (options.limit) {
                queries.push(Query.limit(options.limit));
            } else {
                queries.push(Query.limit(100));
            }
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.MEDIA,
                queries
            );
            
            return response.documents;
        } catch (error) {
            console.error('Error fetching media library:', error);
            return [];
        }
    },

    async getMediaById(id) {
        try {
            return await databases.getDocument(DB_ID, COLLECTIONS.MEDIA, id);
        } catch (error) {
            console.error('Error fetching media:', error);
            return null;
        }
    },

    async updateMediaMetadata(id, metadata) {
        try {
            return await databases.updateDocument(DB_ID, COLLECTIONS.MEDIA, id, metadata);
        } catch (error) {
            console.error('Error updating media metadata:', error);
            throw error;
        }
    },

    async deleteMedia(id, fileId) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.MEDIA, id);
            await storage.deleteFile(MEDIA_BUCKET_ID, fileId);
            return true;
        } catch (error) {
            console.error('Error deleting media:', error);
            return false;
        }
    },

    async addTag(mediaId, tag) {
        try {
            const media = await this.getMediaById(mediaId);
            const tags = media.tags || [];
            if (!tags.includes(tag)) {
                tags.push(tag);
                await this.updateMediaMetadata(mediaId, { tags });
            }
            return tags;
        } catch (error) {
            console.error('Error adding tag:', error);
            throw error;
        }
    },

    async removeTag(mediaId, tag) {
        try {
            const media = await this.getMediaById(mediaId);
            const tags = (media.tags || []).filter(t => t !== tag);
            await this.updateMediaMetadata(mediaId, { tags });
            return tags;
        } catch (error) {
            console.error('Error removing tag:', error);
            throw error;
        }
    },

    async getPopularTags() {
        try {
            const media = await this.getMediaLibrary({ limit: 500 });
            const tagCounts = {};
            media.forEach(m => {
                (m.tags || []).forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
            return Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error fetching popular tags:', error);
            return [];
        }
    },

    async trackUsage(mediaId, storyId) {
        try {
            const media = await this.getMediaById(mediaId);
            const usage = media.usage || [];
            if (!usage.includes(storyId)) {
                usage.push(storyId);
                await this.updateMediaMetadata(mediaId, { usage });
            }
        } catch (error) {
            console.error('Error tracking media usage:', error);
        }
    }
};

export function useImageOptimizer() {
    const optimizeImage = async (file, options = {}) => {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.85,
            format = 'webp'
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const mimeType = format === 'webp' ? 'image/webp' : 
                                 format === 'jpeg' ? 'image/jpeg' : 
                                 'image/png';

                canvas.toBlob(
                    (blob) => {
                        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
                            type: mimeType
                        });
                        resolve({
                            file: optimizedFile,
                            originalSize: file.size,
                            optimizedSize: optimizedFile.size,
                            dimensions: { width, height }
                        });
                    },
                    mimeType,
                    quality
                );
            };

            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const generateThumbnail = async (file, size = 200) => {
        return optimizeImage(file, {
            maxWidth: size,
            maxHeight: size,
            quality: 0.75,
            format: 'webp'
        });
    };

    const generateResponsiveSet = async (file) => {
        const sizes = [
            { name: 'thumbnail', width: 200 },
            { name: 'small', width: 400 },
            { name: 'medium', width: 800 },
            { name: 'large', width: 1200 },
            { name: 'xlarge', width: 1920 }
        ];

        const results = {};
        for (const size of sizes) {
            results[size.name] = await optimizeImage(file, {
                maxWidth: size.width,
                quality: 0.85,
                format: 'webp'
            });
        }
        return results;
    };

    return { optimizeImage, generateThumbnail, generateResponsiveSet };
}
