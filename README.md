# ⚽ FIFA 2026 ArenaOps Command Center

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**A premium, AI-powered operational command console for FIFA World Cup 2026 stadium management.**

*Built for [Google Virtual Prompt Wars](https://ai.google.dev/competitions/prompt-wars) 🏆*

---

[Features](#-key-features) • [Demo](#-live-demo) • [Setup](#-setup--execution) • [Architecture](#%EF%B8%8F-architecture) • [Prompt Engineering](#-prompt-engineering-strategy) • [License](#-license)

</div>

---

## 📋 About

**ArenaOps Command Center** is a real-time operational intelligence dashboard designed for stadium managers, safety coordinators, volunteers, and venue staff during the **FIFA World Cup 2026** (modeled around **MetLife Stadium, New York/New Jersey**).

The solution leverages Google's **Gemini AI** (`gemini-2.5-flash`) to transform chaotic, real-time incident reports into structured, actionable operational directives — including volunteer dispatch orders, multilingual PA announcements, and dynamic crowd-flow adjustments — all rendered through a premium cyberpunk-styled command interface.

> **💡 Google Virtual Prompt Wars Submission**
> This project demonstrates advanced prompt engineering techniques including role-play system instructions, structured JSON output schemas, operational metric offsets, and hybrid edge-computing fallback architectures.

---

## 🌟 Key Features

### 🤖 Dual-Engine AI Co-Pilot
| Mode | Description |
|------|-------------|
| **☁️ Gemini Cloud Mode** | Connects to `gemini-2.5-flash` via REST API with structured `responseSchema` enforcement. Translates raw incident reports (e.g., *"Medical emergency in stand 112"*) into detailed operational action plans with severity assessment, volunteer assignments, and multilingual PA scripts. |
| **💻 Local Heuristic Mode** | A robust offline rules-based engine that maps incident keywords to pre-structured response templates. Ensures 100% functionality without internet connectivity. |

### 🗺️ Interactive SVG Arena Map
- **Clickable Sectors & Gates** — Each zone linked to a live metrics inspector panel
- **🔥 Heatmap View** — Visualizes crowd-density bottlenecks near gates, concessions, and concourses
- **🚨 Evacuation View** — Animated green pathways with directional arrows showing real-time egress routing
- **📍 Pulsing Incident Pins** — Dynamically positioned emergency indicators with glow animations at incident coordinates

### 📊 Live Facility Metrics Dashboard
- **Occupancy Counter** — Real-time capacity tracking (e.g., 78,420 / 82,500)
- **Ingress Sparkline** — Fans entering per minute rendered as a dynamic sparkline chart
- **Queue Delay Meters** — Color-coded alerts (red/amber) for gate blockages or reader outages
- **Volunteer Disposition Chart** — Real-time bar chart showing volunteer distribution across stands, gates, and crowd zones

### 🔊 Multilingual Dispatch Broadcast
- Auto-generates PA announcements in **English 🇬🇧**, **Spanish 🇪🇸**, and **French 🇫🇷**
- Simulated stadium-wide broadcast with flashing notification banner animation
- AI-generated translations contextually adapted for emergency, weather, and crowd scenarios

### ⚙️ Customizable AI Settings
- Toggle between Local Heuristic and Live Gemini API modes
- Paste your own Gemini API Key directly in-browser
- Full **Prompt Editor** to customize the AI system instructions in real-time

---

## 🚀 Setup & Execution

**Zero dependencies. Zero build steps. Just open and go.**

Since the project is built with **vanilla HTML, CSS, and JavaScript**, there's nothing to install or compile.

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/fifa-arenaops-command.git
cd fifa-arenaops-command

# 2. Open in browser
# Simply double-click index.html — or use a local server:
npx serve .
```

### Enable Live Gemini AI

1. Click the **⚙️ AI Setup** button in the top-right corner of the dashboard
2. Toggle **Live Gemini API (Cloud)** to ON
3. Paste your [Google AI Studio API Key](https://aistudio.google.com/apikey)
4. (Optional) Customize the system prompt in the Prompt Editor
5. Start submitting incident reports — the AI will respond with structured operational directives

> **Note:** The dashboard works fully offline with the Local Heuristic engine. The Gemini API key is optional and stored only in your browser's `localStorage`.

---

## 🏗️ Architecture

```
fifa-arenaops-command/
├── index.html        # Main dashboard layout, interactive SVG stadium map
├── index.css         # Premium design system (glassmorphism, animations, responsive)
├── app.js            # Core controller (state, DOM events, charts, map interaction)
├── ai-engine.js      # Dual AI engine (local heuristics + Gemini API integration)
└── README.md         # Documentation
```

### Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Structure** | HTML5 | Semantic markup with SVG stadium map |
| **Styling** | Vanilla CSS3 | Glassmorphism, CSS Grid, custom properties, keyframe animations |
| **Logic** | ES6 JavaScript | State management, SVG manipulation, fetch API, DOM events |
| **AI** | Google Gemini API | `gemini-2.5-flash` via REST (`v1beta`) with `responseSchema` |
| **Typography** | Google Fonts | Outfit + Space Grotesk |
| **Charts** | Canvas API | Custom sparklines and bar charts (zero dependencies) |

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Incident Input  │────▶│   AI Engine       │────▶│  Dashboard Update   │
│  (User types     │     │  ┌─────────────┐  │     │  • Action Plan      │
│   report text)   │     │  │ Local Mode  │  │     │  • PA Broadcast     │
│                  │     │  │ (Heuristic) │  │     │  • Map Pins         │
│                  │     │  ├─────────────┤  │     │  • Metric Gauges    │
│                  │     │  │ Cloud Mode  │  │     │  • Alert Log        │
│                  │     │  │ (Gemini API)│  │     │                     │
│                  │     │  └─────────────┘  │     │                     │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

---

## 🧠 Prompt Engineering Strategy

> **Google Virtual Prompt Wars — Advanced Techniques Demonstrated**

### 1. Role-Play System Instructions
The AI is instructed to behave as a **seasoned FIFA stadium safety dispatcher**, enforcing strict operational vocabulary, safety-first prioritization, and structured communication protocols.

### 2. Structured Output via `responseSchema`
The Gemini API call uses `generationConfig.responseSchema` to force the model to respond **strictly** in a defined JSON structure:
```json
{
  "severity": "HIGH | MEDIUM | LOW",
  "actionPlan": "Step-by-step operational directive...",
  "volunteersNeeded": 5,
  "volunteerRoles": ["Crowd Marshal", "Medical Escort"],
  "affectedZone": "North Stand - Gate N3",
  "paAnnouncement_EN": "Attention fans...",
  "paAnnouncement_ES": "Atención aficionados...",
  "paAnnouncement_FR": "Attention supporters...",
  "safetyChange": -3,
  "queueTimeChange": 2
}
```
This eliminates markdown wrapping issues and ensures deterministic front-end JSON parsing.

### 3. Operational Metric Offsets
The prompt instructs the model to return **numerical metric changes** (`safetyChange`, `queueTimeChange`) based on incident severity. These values are parsed by the JavaScript runtime to dynamically adjust live dashboard gauges.

### 4. Hybrid Edge-Computing Fallback
The **Local Heuristic Engine** demonstrates how prompt-engineering patterns can be replicated as keyword-mapping rulesets for offline/edge deployments — a critical consideration for stadium environments where network connectivity may be unreliable.

---

## 📂 File Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | ~505 | Dashboard skeleton, SVG stadium map with clickable zones, settings modal, semantic layout |
| `index.css` | ~780 | Complete design system — CSS variables, glassmorphism cards, grid layout, keyframe animations, responsive breakpoints, custom scrollbars |
| `app.js` | ~850 | Core application controller — state management, DOM event binding, chart rendering (Canvas API sparklines/bars), SVG map interaction, simulated live data feeds |
| `ai-engine.js` | ~480 | Dual AI engine — local heuristic keyword analyzer + Gemini REST API integration with structured JSON schema enforcement |

---

## 🏷️ Topics

`google-prompt-wars` · `gemini-api` · `gemini-2.5-flash` · `fifa-world-cup-2026` · `stadium-operations` · `crowd-management` · `real-time-dashboard` · `multilingual-ai` · `incident-management` · `svg-interactive-map` · `glassmorphism` · `vanilla-javascript` · `operational-intelligence` · `accessibility`

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for the Google Virtual Prompt Wars**

*Enhancing the FIFA World Cup 2026 experience through Generative AI*

⚽ 🏟️ 🤖

</div>
