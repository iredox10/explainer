export default {
    name: 'explainer',
    title: 'Explainer Story',
    type: 'document',
    fields: [
        {
            name: 'headline',
            title: 'Headline',
            type: 'string',
        },
        {
            name: 'subhead',
            title: 'Subhead',
            type: 'string',
        },
        {
            name: 'heroVideo',
            title: 'Hero Video',
            type: 'file',
            options: {
                accept: 'video/*',
            },
        },
        {
            name: 'scrollySections',
            title: 'Scrollytelling Sections',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'type',
                            title: 'Type',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Map', value: 'map' },
                                    { title: 'Chart', value: 'chart' },
                                ],
                            },
                        },
                        {
                            name: 'text',
                            title: 'Card Text',
                            type: 'text',
                        },
                        {
                            name: 'label',
                            title: 'Label (for UI)',
                            type: 'string',
                        },
                        // Map Fields
                        {
                            name: 'viewBox',
                            title: 'ViewBox (Map Only)',
                            type: 'string',
                            description: 'e.g., "0 0 600 600"',
                            hidden: ({ parent }) => parent?.type !== 'map',
                        },
                        {
                            name: 'highlight',
                            title: 'Highlight Region (Map Only)',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Global', value: 'global' },
                                    { title: 'Nigeria', value: 'nigeria' },
                                ],
                            },
                            hidden: ({ parent }) => parent?.type !== 'map',
                        },
                        // Chart Fields
                        {
                            name: 'chartData',
                            title: 'Chart Data (Chart Only)',
                            type: 'array',
                            of: [{ type: 'number' }],
                            hidden: ({ parent }) => parent?.type !== 'chart',
                        },
                        {
                            name: 'accentColor',
                            title: 'Accent Color (Chart Only)',
                            type: 'string',
                            hidden: ({ parent }) => parent?.type !== 'chart',
                        },
                    ],
                    preview: {
                        select: {
                            title: 'text',
                            subtitle: 'type',
                        },
                    },
                },
            ],
        },
    ],
};
