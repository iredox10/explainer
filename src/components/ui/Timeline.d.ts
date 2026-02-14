import type { FC } from 'react';

declare const Timeline: FC<{
    label?: string;
    highlight?: string;
    steps?: Array<{ year: string; label: string }>;
    variant?: 'track' | 'stacked' | 'cards';
    animated?: boolean;
    showContextLabel?: boolean;
    hud?: boolean;
}>;

export default Timeline;
