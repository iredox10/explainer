export const seoService = {
    analyzeStory(story) {
        const issues = [];
        const warnings = [];
        const passes = [];
        let score = 100;

        const headline = story.headline || '';
        const subhead = story.subhead || '';
        const content = story.content || [];
        const seoData = story.seo || {};

        if (!headline) {
            issues.push({ field: 'headline', message: 'Missing headline', weight: 20 });
            score -= 20;
        } else {
            if (headline.length < 30) {
                warnings.push({ field: 'headline', message: `Headline is short (${headline.length} chars). Aim for 50-60 characters.`, weight: 5 });
                score -= 5;
            } else if (headline.length > 70) {
                warnings.push({ field: 'headline', message: `Headline is long (${headline.length} chars). Consider shortening to 50-60 characters.`, weight: 5 });
                score -= 5;
            } else {
                passes.push({ field: 'headline', message: `Headline length is optimal (${headline.length} chars)` });
            }
        }

        if (!subhead) {
            warnings.push({ field: 'subhead', message: 'Missing subhead. Add a compelling description.', weight: 10 });
            score -= 10;
        } else if (subhead.length < 50) {
            warnings.push({ field: 'subhead', message: `Subhead is short. Aim for 150-160 characters.`, weight: 5 });
            score -= 5;
        } else {
            passes.push({ field: 'subhead', message: 'Subhead is present' });
        }

        if (!story.heroImage) {
            issues.push({ field: 'heroImage', message: 'Missing hero image. Stories with images get more engagement.', weight: 15 });
            score -= 15;
        } else {
            passes.push({ field: 'heroImage', message: 'Hero image is set' });
        }

        if (!story.category) {
            issues.push({ field: 'category', message: 'Missing category. Helps with content organization.', weight: 10 });
            score -= 10;
        } else {
            passes.push({ field: 'category', message: 'Category is set' });
        }

        if (!story.author) {
            issues.push({ field: 'author', message: 'Missing author. Attribution is important for credibility.', weight: 10 });
            score -= 10;
        } else {
            passes.push({ field: 'author', message: 'Author is set' });
        }

        const ogTitle = seoData.ogTitle || headline;
        if (!seoData.ogTitle && headline) {
            warnings.push({ field: 'ogTitle', message: 'Using headline as OG title. Consider a custom social title.', weight: 3 });
        } else if (seoData.ogTitle) {
            passes.push({ field: 'ogTitle', message: 'Custom OG title is set' });
        }

        const ogDescription = seoData.ogDescription || subhead;
        if (!seoData.ogDescription && subhead) {
            warnings.push({ field: 'ogDescription', message: 'Using subhead as OG description. Consider customizing for social.', weight: 3 });
        } else if (seoData.ogDescription) {
            passes.push({ field: 'ogDescription', message: 'Custom OG description is set' });
        }

        if (!seoData.ogImage && story.heroImage) {
            warnings.push({ field: 'ogImage', message: 'Using hero image as OG image. Consider a custom social image.', weight: 2 });
        } else if (seoData.ogImage) {
            passes.push({ field: 'ogImage', message: 'Custom OG image is set' });
        }

        const contentText = extractTextFromContent(content);
        const wordCount = contentText.split(/\s+/).filter(w => w.length > 0).length;
        
        if (wordCount < 300) {
            warnings.push({ field: 'content', message: `Content is short (${wordCount} words). Aim for 600+ words for better SEO.`, weight: 10 });
            score -= 10;
        } else if (wordCount < 600) {
            warnings.push({ field: 'content', message: `Content length is okay (${wordCount} words). More depth would help.`, weight: 5 });
            score -= 5;
        } else {
            passes.push({ field: 'content', message: `Good content depth (${wordCount} words)` });
        }

        if (story.tags && story.tags.length > 0) {
            passes.push({ field: 'tags', message: `${story.tags.length} tags added` });
        } else {
            warnings.push({ field: 'tags', message: 'No tags added. Tags help with content discovery.', weight: 5 });
            score -= 5;
        }

        if (seoData.keywords && seoData.keywords.length > 0) {
            passes.push({ field: 'keywords', message: 'SEO keywords are set' });
        } else {
            warnings.push({ field: 'keywords', message: 'No SEO keywords set.', weight: 5 });
            score -= 5;
        }

        const hasInternalLinks = checkInternalLinks(content);
        if (hasInternalLinks) {
            passes.push({ field: 'internalLinks', message: 'Internal links found in content' });
        } else {
            warnings.push({ field: 'internalLinks', message: 'No internal links found. Link to related content.', weight: 5 });
            score -= 5;
        }

        const headings = content.filter(b => b.type === 'heading');
        if (headings.length === 0) {
            warnings.push({ field: 'headings', message: 'No subheadings found. Break up content with H2/H3 tags.', weight: 5 });
            score -= 5;
        } else {
            passes.push({ field: 'headings', message: `${headings.length} subheadings in content` });
        }

        const images = content.filter(b => b.type === 'image');
        const imagesWithoutAlt = images.filter(img => !img.altText);
        if (images.length > 0 && imagesWithoutAlt.length > 0) {
            issues.push({ field: 'imageAlt', message: `${imagesWithoutAlt.length} images missing alt text.`, weight: 5 });
            score -= 5;
        } else if (images.length > 0) {
            passes.push({ field: 'imageAlt', message: 'All images have alt text' });
        }

        score = Math.max(0, Math.min(100, score));

        const grade = getSeoGrade(score);

        return {
            score,
            grade,
            issues,
            warnings,
            passes,
            wordCount,
            headlineLength: headline.length,
            subheadLength: subhead.length,
            contentBlocks: content.length
        };
    },

    calculateReadTime(content) {
        const text = extractTextFromContent(content);
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const minutes = Math.ceil(words / 225);
        return Math.max(1, minutes);
    },

    extractKeywords(content) {
        const text = extractTextFromContent(content).toLowerCase();
        const words = text.match(/\b[a-z]{4,}\b/g) || [];
        
        const stopWords = new Set([
            'this', 'that', 'these', 'those', 'with', 'from', 'have', 'been',
            'were', 'said', 'each', 'which', 'their', 'will', 'would', 'there',
            'could', 'when', 'who', 'after', 'before', 'also', 'into', 'than',
            'them', 'very', 'just', 'over', 'such', 'your', 'about', 'only',
            'some', 'made', 'most', 'being', 'through', 'during', 'between',
            'should', 'because', 'while', 'both', 'another', 'where', 'what',
            'nigeria', 'african', 'their'
        ]);

        const frequency = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    },

    generateSlug(headline) {
        return headline
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 100);
    },

    getGradeColor(grade) {
        const colors = {
            'A': '#22c55e',
            'B': '#84cc16',
            'C': '#eab308',
            'D': '#f97316',
            'F': '#ef4444'
        };
        return colors[grade] || '#6b7280';
    }
};

function extractTextFromContent(content) {
    if (!content || !Array.isArray(content)) return '';
    
    return content.map(block => {
        switch (block.type) {
            case 'p':
                return block.text || '';
            case 'heading':
                return block.text || '';
            case 'quote':
                return `${block.text || ''} ${block.attribution || ''}`;
            case 'callout':
                return `${block.title || ''} ${block.text || ''}`;
            default:
                return '';
        }
    }).join(' ');
}

function checkInternalLinks(content) {
    if (!content || !Array.isArray(content)) return false;
    
    return content.some(block => {
        if (block.type === 'p' && block.text) {
            return block.text.includes('/article/') || 
                   block.text.includes('explainer.africa');
        }
        return false;
    });
}

function getSeoGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

export function useSeoChecklist(story) {
    if (!story) return null;
    
    const analysis = seoService.analyzeStory(story);
    
    const checklist = [
        {
            id: 'headline',
            label: 'Headline',
            passed: !!story.headline,
            message: story.headline ? 
                `${story.headline.length} characters` : 
                'Add a compelling headline'
        },
        {
            id: 'subhead',
            label: 'Subhead',
            passed: !!story.subhead,
            message: story.subhead ? 
                `${story.subhead.length} characters` : 
                'Add a description'
        },
        {
            id: 'heroImage',
            label: 'Hero Image',
            passed: !!story.heroImage,
            message: story.heroImage ? 'Set' : 'Add a featured image'
        },
        {
            id: 'category',
            label: 'Category',
            passed: !!story.category,
            message: story.category || 'Select a category'
        },
        {
            id: 'author',
            label: 'Author',
            passed: !!story.author,
            message: story.author || 'Assign an author'
        },
        {
            id: 'content',
            label: 'Content Depth',
            passed: analysis.wordCount >= 300,
            message: `${analysis.wordCount} words`
        },
        {
            id: 'ogTitle',
            label: 'OG Title',
            passed: !!story.seo?.ogTitle,
            message: story.seo?.ogTitle ? 'Custom' : 'Using headline'
        },
        {
            id: 'ogDescription',
            label: 'OG Description',
            passed: !!story.seo?.ogDescription,
            message: story.seo?.ogDescription ? 'Custom' : 'Using subhead'
        },
        {
            id: 'keywords',
            label: 'Keywords',
            passed: !!(story.seo?.keywords?.length),
            message: story.seo?.keywords?.length ? 
                `${story.seo.keywords.length} keywords` : 
                'Add SEO keywords'
        }
    ];
    
    return {
        ...analysis,
        checklist
    };
}
