# VOX.COM EDITORIAL ANALYSIS: ACTIONABLE PATTERNS FOR EXPLAINER

Based on analysis of 5+ Vox articles across categories (explainers, news, features), here's a detailed breakdown of their structure, style, and implementation patterns.

---

## 1. ARTICLE STRUCTURE PATTERNS

### A. HEADLINE ARCHITECTURE

**Pattern: Question or Statement + Subhead Context**

```javascript
// Explainer example:
{
  headline: 'Can America build beautiful places again?',
  subhead: 'Ugliness has more to do with the housing crisis than you think.',
  dek: 'We need your support in 2026' // membership callout
}

// News example:
{
  headline: 'The Trump administration is admitting it lied about Alex Pretti',
  subhead: 'A baby-step back from the brink.',
  dek: null
}

// Feature (The Highlight) example:
{
  headline: 'There\'s an underrated (and cheaper) type of therapy',
  subhead: 'Its "disadvantages" can also be its strengths.',
  dek: null
}
```

**Headline Formulas:**
- **Provocative Questions**: 'Can America...?' 'Why don\'t we...?'
- **Definitive Statements**: 'Trump\'s EPA is setting the value of human health to $0'
- **Framing Device**: 'There\'s an underrated...' (teases curiosity)
- **Active Voice**: Always present tense, punchy

**Subhead Purpose:**
- Adds 1 layer of nuance/intrigue
- Often contradicts or complicates headline
- Never just repeats the headline

---

### B. INTRO PATTERN: 'SCENE → CONTEXT → THESIS'

**Explainer Formula (Housing):**
1. **Scene/Anecdote** (1-3 paragraphs): Start with concrete example or statistic
2. **Context Box** ('Inside this story'): Bullet-point preview of argument
3. **Problem Statement**: Build to the core question
4. **Thesis**: What this article will explore

**News Formula (Alex Pretti):**
1. **Vivid Scene**: Immersive present-tense narrative (video description)
2. **Escalation**: 'Despite... Then... Now...'
3. **Consequence**: 'This is what nearly everyone... saw Saturday'
4. **Pivot to Analysis**: 'Nevertheless, administration officials...'

**Feature Formula (Group Therapy):**
1. **Character Introduction**: 'In her late 20s, Christie Tate struggled...'
2. **Turning Point**: 'Then, she had a conversation that changed her life'
3. **Exploration**: 'Try group, a friend told her'
4. **Table of Contents**: Sectioned with jump links

---

### C. SECTION ARCHITECTURE

**Explainers Use H2 Sections with Question Headings:**
```markdown
## What do looks have to do with solving the housing crisis?
## Why don't we build pretty things anymore?
## Maybe beautiful housing could turn more of us into YIMBYs
```

**Features Use Descriptive H2 Sections:**
```markdown
## Why most people don't do group therapy
## How group therapy works
## Group in the age of loneliness
```

**News Uses No Subheads** (continuous narrative)

---

## 2. WRITING STYLE CONVENTIONS

### TONE CHARACTERISTICS

1. **Conversational Authority**
   - 'You know the ones: sprawling subdivisions, giant strip malls...'
   - 'All of this points to a tantalizing possibility...'
   - Uses 'we' to include reader in exploration

2. **Skeptical Clarity**
   - 'It might feel a bit frivolous to fixate on aesthetics...'
   - 'All these remarks had the same chilling subtext...'
   - Questions assumptions before answering them

3. **Evidence-Forward**
   - Hyperlinks mid-sentence to studies: 'A recent [working paper](link) contributes to...'
   - Numbers in context: '4 million more, to be more or less precise'
   - Expert quotes woven naturally

---

### SENTENCE STRUCTURE PATTERNS

**Opening Paragraphs:**
- Short, punchy: 'The root of America\'s housing affordability crisis isn\'t complicated in the abstract:'
- Medium build: 'In her late 20s, Christie Tate struggled with crushing loneliness, bulimia, and suicidal thoughts.'
- Long narrative: 'A federal agent shoves a woman to the ground. A young man walks over to help her up. Then the agent pepper-sprays them both.'

**Mid-Article:**
- **Transition Sentences**: 'All of this points to...', 'Of course, it\'s one thing to call for...'
- **Lists with Rhythm**: 'Charming six-flats of Chicago, or the Spanish-tiled courtyard apartments of Los Angeles'
- **Rhetorical Questions**: 'But why?'

**Varied Rhythm:**
- Mix 1-sentence paragraphs with 5-sentence ones
- Never more than 3 short paragraphs in a row

---

### EXPLANATION TECHNIQUES

**1. Pre-Emptive Counter-Arguments:**
```
'You might still suspect that something more complicated is going on than pure aesthetics. The researchers tested for...'
```

**2. Concrete Before Abstract:**
```
'Members must sacrifice some of their privacy and open themselves up to uncomfortable feelings like shame. Therapists strive to be warm and compassionate, but your peers can (and sometimes will) dislike you.'
```

**3. Nested Explanations:**
```
'That\'s why such gatherings are also called "process" groups. Content — the mere words exchanged — is second to the process by which interactions in the room unfold.'
```

**4. Parenthetical Clarifications:**
```
'(and much of the rest of the world)'
'(say, revising how much mercury a power plant is allowed to emit)'
```

---

## 3. VISUAL ELEMENT INTEGRATION

### IMAGE PATTERNS

**Hero Image:**
- Full-bleed, large aspect ratio (2400px wide)
- Credit: 'Nicholas Stevenson/Folio Art for Vox'
- Custom illustrations for features, news photos for timely pieces

**In-Article Images:**
- Every 4-6 paragraphs
- Always captioned with context
- Getty Images with full attribution
- Renders/diagrams for explainers (e.g., courtyard block visualization)

**Image JSON Schema:**
```javascript
{
  type: 'image',
  url: 'https://platform.vox.com/...',
  alt: 'Descriptive alt text',
  caption: 'Single-family homes in a residential neighborhood in Aldie, Virginia.',
  credit: 'Nathan Howard/Bloomberg via Getty Images',
  width: 2400,
  crop: '0,0,100,100'
}
```

---

### CALLOUT BOX PATTERNS

**'Inside this story' Box (Explainer-specific):**
```javascript
{
  type: 'callout',
  style: 'summary',
  content: [
    'America has a shortage of millions of homes...',
    'A new working paper by housing researchers...',
    'All that might sound obvious. But the US...',
    'We can reform housing policy...'
  ]
}
```

**Pull Quotes:**
```javascript
{
  type: 'quote',
  text: 'A group is a lab. I can set the experiment with my [individual] client, but in group, you\'re going to practice it, and then we\'re going to analyze it.',
  attribution: 'psychologist Jackie Darby',
  style: 'pullquote'
}
```

**Membership Callout (CTA):**
```javascript
{
  type: 'callout',
  style: 'membership',
  headline: 'We need your support in 2026',
  text: 'When news breaks, you need to understand what actually matters...',
  cta: 'Join now',
  placement: 'after-intro' // or 'mid-article', 'end'
}
```

---

### LINK PATTERNS

**Inline Hyperlinks:**
- **Bold for emphasis within links**: Never bold plain text; use links to add weight
- **Mid-sentence links**: '[4 million more](link), to be more or less precise'
- **Contextual anchors**: 'a [growing](link1) [body](link2) of research' (multiple studies)

**Related Content Boxes:**
```javascript
{
  type: 'related',
  headline: 'Related',
  links: [
    {
      title: 'Why we use therapy-speak — and when to stop',
      url: '/even-better/23769973/...'
    }
  ]
}
```

---

## 4. CONTENT BLOCK SCHEMA (JSON)

### INFERRED VOX CONTENT STRUCTURE

```typescript
interface VoxArticle {
  headline: string;
  subhead: string;
  dek?: string; // Membership/newsletter pitch
  category: 'Explainers' | 'Politics' | 'The Highlight' | 'Future Perfect';
  authors: Author[];
  publishedAt: Date;
  hero: {
    type: 'image';
    url: string;
    caption?: string;
    credit: string;
  };
  content: ContentBlock[];
}

type ContentBlock =
  | { type: 'p'; text: string; }
  | { type: 'h2'; text: string; id: string; } // For TOC anchors
  | { type: 'h3'; text: string; }
  | { type: 'image'; url: string; caption?: string; credit: string; }
  | { type: 'quote'; text: string; attribution?: string; style: 'pullquote' | 'blockquote'; }
  | { type: 'callout'; style: 'summary' | 'membership' | 'newsletter'; content: string[]; }
  | { type: 'list'; ordered: boolean; items: string[]; }
  | { type: 'related'; links: RelatedLink[]; }
  | { type: 'embed'; embedType: 'video' | 'tweet' | 'chart'; url: string; };
```

---

## 5. EXPLAINER-SPECIFIC PATTERNS

### 'EXPLAINER' VS 'NEWS' VS 'FEATURE'

| Aspect | Explainer | News | Feature (The Highlight) |
|--------|-----------|------|--------------------------|
| **Opening** | Stats/broad problem | Vivid scene | Character anecdote |
| **Sections** | H2 questions | Continuous narrative | H2 thematic sections |
| **Length** | 1,500-2,500 words | 800-1,200 words | 2,000-3,500 words |
| **Links** | Heavy (10-20) | Moderate (5-10) | Moderate (8-15) |
| **Images** | 3-5 (diagrams/charts) | 2-4 (news photos) | 2-3 (illustrations) |
| **Tone** | Educational | Urgent | Reflective |
| **Ending** | Policy solutions | Consequence/status | Philosophical takeaway |

---

### EXPLAINER CLOSING PATTERNS

**Always End With:**
1. **Policy Implications**: 'How might city governments...'
2. **Hope Note**: 'Pederson is no fan... but "I am SO optimistic!"'
3. **Meta-Reflection**: 'Our housing crisis is a nightmare... but also, perhaps, a rare invitation to rebuild'

**Never End With:**
- 'In conclusion...'
- Simple restatement of thesis
- Cliffhangers without resolution

---

## 6. IMPLEMENTATION FOR EXPLAINER CODEBASE

### RECOMMENDED CONTENT BLOCKS

```javascript
// src/content.config.ts additions
const contentBlocks = z.discriminatedUnion('type', [
  // Existing blocks...
  
  z.object({
    type: z.literal('insideThisStory'),
    bullets: z.array(z.string())
  }),
  
  z.object({
    type: z.literal('pullquote'),
    text: z.string(),
    attribution: z.string().optional(),
    style: z.enum(['large', 'inline'])
  }),
  
  z.object({
    type: z.literal('related'),
    headline: z.string().default('Related'),
    links: z.array(z.object({
      title: z.string(),
      url: z.string()
    }))
  }),
  
  z.object({
    type: z.literal('membershipCallout'),
    placement: z.enum(['intro', 'mid', 'end']),
    variant: z.enum(['default', 'urgent', 'soft'])
  })
]);
```

---

### ASTRO COMPONENT STRUCTURE

```astro
---
// StoryContent.astro
const { blocks } = Astro.props;
---

{blocks.map(block => {
  switch(block.type) {
    case 'insideThisStory':
      return <InsideThisStory bullets={block.bullets} />;
    case 'pullquote':
      return <Pullquote {...block} />;
    case 'related':
      return <RelatedLinks {...block} />;
    case 'p':
      return <p set:html={block.text} />; // Allows inline links
    // ... etc
  }
})}
```

---

### STYLING CONVENTIONS

**Typography:**
- **Headlines**: Serif display font (Georgia, Lora)
- **Body**: Sans-serif (system font stack)
- **Line Height**: 1.6-1.8 for body text
- **Max Width**: 680px for readability

**Spacing:**
- **Paragraph Gap**: 1.5rem
- **Section Gap**: 3rem
- **Image Margin**: 2rem top/bottom

**Colors:**
- **Links**: Vox Yellow (#FAFF00) hover state
- **Background**: White (#FFFFFF)
- **Text**: Near-black (#1A1A1A)
- **Callout Boxes**: Light gray (#F5F5F5) background

---

## 7. KEY TAKEAWAYS FOR EXPLAINER

### WHAT TO STEAL FROM VOX:

✅ **'Inside this story' summary boxes** → Add `insideThisStory` block type
✅ **Section headings as questions** → Update CMS to encourage this
✅ **Inline hyperlink density** → Markdown processor should support mid-sentence links
✅ **Pullquotes with attribution** → Create styled `<Pullquote>` component
✅ **Related content boxes** → Auto-generate based on tags
✅ **Membership/newsletter CTAs** → Strategic placement (not just footer)

✅ **Pre-emptive counter-arguments** → Train writers to address objections
✅ **Concrete → Abstract flow** → Start with examples, build to theory
✅ **Varied paragraph rhythm** → Mix short/long deliberately
✅ **Parenthetical clarifications** → Make complex ideas accessible

---

### WHAT NOT TO COPY:

❌ **Paywall interruptions** → Explainer is free/open
❌ **Over-politicization** → Keep neutral unless story demands it
❌ **Excessive self-promotion** → Limit cross-linking
❌ **Podcast/video embeds** → Focus on written word first

---

## 8. SAMPLE EXPLAINER STRUCTURE (MAPPED TO YOUR SCHEMA)

```json
{
  "headline": "Why Scrollytelling Is Taking Over Journalism",
  "subhead": "Interactive stories aren't just prettier—they're more persuasive.",
  "category": "Explainers",
  "layout": "scrolly",
  "content": [
    {
      "type": "p",
      "text": "In 2012, the New York Times published <a href='...'>Snow Fall</a>, a multimedia story that changed journalism forever. Today, nearly every major news outlet has a scrollytelling team. But why?"
    },
    {
      "type": "insideThisStory",
      "bullets": [
        "Scrollytelling combines narrative and data visualization to create immersive experiences.",
        "Research shows readers retain 40% more information from interactive stories.",
        "But these stories are expensive to produce—and not every topic needs them."
      ]
    },
    {
      "type": "p",
      "text": "The answer has as much to do with psychology as technology..."
    },
    {
      "type": "h2",
      "text": "What makes scrollytelling so effective?",
      "id": "what-makes-it-effective"
    },
    {
      "type": "p",
      "text": "Unlike static articles, scrollytelling leverages <a href='...'>progressive disclosure</a>..."
    },
    {
      "type": "pullquote",
      "text": "We're not just telling stories anymore. We're designing experiences.",
      "attribution": "Alberto Cairo, data visualization expert",
      "style": "large"
    },
    {
      "type": "image",
      "url": "/assets/scrollytelling-example.jpg",
      "caption": "A still from the New York Times' 'Snow Fall,' which pioneered the format in 2012.",
      "credit": "The New York Times"
    },
    {
      "type": "h2",
      "text": "When should you NOT use scrollytelling?",
      "id": "when-not-to-use"
    },
    {
      "type": "p",
      "text": "For all its appeal, scrollytelling isn't always the answer. Breaking news, for instance..."
    },
    {
      "type": "related",
      "headline": "Related",
      "links": [
        { "title": "The Best Scrollytelling Tools in 2026", "url": "/tools" },
        { "title": "How We Built Our Scrollytelling Engine", "url": "/behind-the-scenes" }
      ]
    },
    {
      "type": "p",
      "text": "The future of journalism isn't about choosing between text and multimedia. It's about knowing when each format serves the story best."
    }
  ]
}
```

---

## FINAL RECOMMENDATIONS

**For the Explainer Codebase:**

1. **Add Content Block Types:**
   - `insideThisStory` (bullet-point preview)
   - `pullquote` (styled quote with attribution)
   - `related` (curated links to related stories)
   - `membershipCallout` (CTA for newsletter/support)

2. **Update Editor UX:**
   - Suggest section headings as questions
   - Preview 'Inside this story' bullets at top
   - Inline link editor (not just URL field)

3. **Styling Priorities:**
   - Max-width 680px for text blocks
   - Generous white space (3rem between sections)
   - Yellow accent color for links/CTAs
   - Custom `<Pullquote>` with large serif font

4. **Writer Guidelines:**
   - Start with concrete examples, not abstractions
   - Address counter-arguments explicitly
   - Use 'you' and 'we' to engage readers
   - End with policy implications or hope note

This analysis provides a complete blueprint for replicating Vox's editorial excellence in your Explainer platform. Focus on the content block types, writing patterns, and visual hierarchy—these are what make Vox's explainers so effective.
