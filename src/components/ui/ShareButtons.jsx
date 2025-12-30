import React, { useState, useEffect } from 'react';
import { Twitter, Facebook, Linkedin, Mail, Link as LinkIcon, Check, Share2 } from 'lucide-react';

export default function ShareButtons({ title, url = null }) {
    const [copied, setCopied] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(url || '');

    useEffect(() => {
        if (!url && typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, [url]);

    const shareData = {
        title: title,
        text: `Check out this story: ${title}`,
        url: currentUrl,
    };

    const handleWebShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(shareData.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title);

    const socialPlatforms = [
        {
            name: 'Twitter',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: 'hover:bg-black',
        },
        {
            name: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:bg-[#1877F2]',
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
            color: 'hover:bg-[#0A66C2]',
        },
        {
            name: 'Mail',
            icon: Mail,
            href: `mailto:?subject=${encodedTitle}&body=Check out this story: ${encodedUrl}`,
            color: 'hover:bg-[#008751]',
        },
    ];

    return (
        <div className="flex flex-col gap-3">
            {socialPlatforms.map((platform) => (
                <a
                    key={platform.name}
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-white ${platform.color} border-gray-200 hover:border-transparent transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer`}
                    title={`Share on ${platform.name}`}
                >
                    <platform.icon className="w-4 h-4" />
                </a>
            ))}

            <button
                onClick={handleCopyLink}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all duration-200 shadow-sm hover:shadow-md"
                title="Copy Link"
            >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
            </button>

            <button
                onClick={handleWebShare}
                className="lg:hidden w-10 h-10 rounded-full bg-black text-[#FAFF00] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title="Share"
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>
    );
}
