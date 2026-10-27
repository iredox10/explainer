import { apiFetch, mediaUrl, unwrapDocuments, withQuery } from './api';

export const mediaService = {
    async uploadMedia(file, metadata = {}) {
        const form = new FormData();
        form.append('file', file);
        if (metadata.filename) form.append('filename', metadata.filename);
        if (metadata.caption) form.append('caption', metadata.caption);
        if (metadata.altText) form.append('altText', metadata.altText);
        if (metadata.tags) form.append('tags', JSON.stringify(metadata.tags));
        if (metadata.usage) form.append('usage', JSON.stringify(metadata.usage));

        const payload = await apiFetch('/api/admin/media', { method: 'POST', body: form });
        return {
            url: mediaUrl(payload.url),
            fileId: payload.fileId,
            record: payload.record ?? payload
        };
    },

    async getMediaLibrary(options = {}) {
        try {
            const payload = await apiFetch(withQuery('/api/admin/media', {
                tag: options.tag,
                type: options.type,
                search: options.search,
                limit: options.limit || 100
            }));
            return unwrapDocuments(payload).map(item => ({ ...item, url: mediaUrl(item.url) }));
        } catch (error) {
            console.error('Error fetching media library:', error);
            return [];
        }
    },

    async getMediaById(id) {
        try {
            const item = await apiFetch(`/api/admin/media/${encodeURIComponent(id)}`);
            return { ...item, url: mediaUrl(item.url) };
        } catch (error) {
            console.error('Error fetching media:', error);
            return null;
        }
    },

    async updateMediaMetadata(id, metadata) {
        const payload = await apiFetch(`/api/admin/media/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: {
                tags: metadata.tags,
                usage: metadata.usage,
                caption: metadata.caption,
                altText: metadata.altText
            }
        });
        return { ...payload, url: mediaUrl(payload.url) };
    },

    async deleteMedia(id) {
        try {
            await apiFetch(`/api/admin/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
            const payload = await apiFetch('/api/admin/media/tags');
            const tags = Array.isArray(payload) ? payload : payload?.tags ?? [];
            return tags.map(({ tag, uses, count }) => ({ tag, count: count ?? uses ?? 0 }));
        } catch (error) {
            console.error('Error fetching popular tags:', error);
            return [];
        }
    },

    async trackUsage(mediaId, storyId) {
        try {
            const media = await this.getMediaById(mediaId);
            if (!media) return;
            const usage = media.usage || [];
            if (usage.includes(storyId)) return;
            await this.updateMediaMetadata(mediaId, { usage: [...usage, storyId] });
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
