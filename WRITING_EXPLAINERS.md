# Writing Guide: The Explainer Format

Welcome to the Explainer editor. This platform is designed for **Visual Journalism**—combining deep reporting with cinematic motion. Follow this guide to create stunning, interactive articles.

---

## 1. Choosing Your Layout
In the sidebar under **"Meta Data"**, you can select between two layouts:
- **Standard**: Best for long-form text, interviews, and op-eds.
- **Scrollytelling**: Best for data-heavy stories, geographic deep-dives, and complex timelines.

## 2. Setting the Stage: The Hero Section
Visuals matter. The first thing a reader sees is the "Hero Loop."
- **Headline**: Keep it punchy and active (e.g., *"How Lagos Redefined the Megacity"*).
- **Subhead**: Provide the essential context in one or two sentences.
- **Video URL**: Provide a direct link to an MP4 loop (e.g., from Pexels or a hosted CDN). This plays in the background behind your headline.

## 3. The Introduction: Narrative Blocks
Before the interactive elements start, you should set the scene using standard blocks in the **"Story Logic"** section:
- **P (Paragraph)**: Your standard reporting voice.
- **Heading**: Use these to break the story into logical chapters.
- **Quote**: Highlight expert voices.
- **Callout**: Use this for "Need to Know" facts or technical definitions.

## 4. Mastering Scrollytelling Steps
If you selected the **Scrollytelling** layout, you can add "Steps." Each step anchors a piece of text to a sticky visual in the background.

### 🌐 The Map Component (Fly-To)
Our maps use real geographic coordinates to create cinematic transitions.
- **Center (Lon, Lat)**: Use standard longitude and latitude (e.g., `3.37, 6.52` for Lagos).
- **Zoom**: 
  - `1-3`: Continental/Global view.
  - `5-8`: Country/Region view.
  - `10-15`: City/Neighborhood view.
- **Highlight**: Type the exact name of the country (e.g., `Nigeria`) to highlight it in Vox Yellow.

### 📊 The Data Visualization Component
- **Chart Data**: Provide a comma-separated list of numbers (e.g., `10, 45, 32, 90, 120`). The system will automatically animate the line graph.
- **Accent Color**: Use a HEX code (e.g., `#FAFF00`) to change the line color.

## 5. Best Practices for Scrollytelling
1. **Short Text**: Keep your scrolly cards under 50 words. The reader should be looking at the visual while they read.
2. **The "Fly-To" Rhythm**: Start with a global view (`Zoom 1`), then fly to a specific city (`Zoom 12`). It creates a sense of "zooming into the detail."
3. **Data Contrast**: Use the charts to show a "pulse." A spike in a chart paired with a dramatic sentence creates high engagement.

## 6. Previewing & Publishing
- Use the **"Live Preview"** button frequently. The map transitions are physics-based, so you'll want to feel the "drift" of the pan and zoom as you scroll.
- Once ready, change the status to **"Published"** and save.

---
*Explainer Platform Editorial Guide — Built for Visual Storytellers.*
