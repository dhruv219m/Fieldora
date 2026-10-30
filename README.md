# KrishiSetu

KrishiSetu is an agriculture-focused web app designed to help farmers make better decisions around crop planning, expected profitability, irrigation needs, and market awareness. The project is implemented as a modern React + Vite interface named Fieldora, focused on the Indian farming context.

## Overview

The app gives farmers a simple digital dashboard to:

- Set up their farm profile (location, land size, soil type, irrigation source, and season)
- Explore crop recommendations based on suitability and seasonal conditions
- Estimate cost and potential profit for different crops
- Review market price trends for major crops
- Access a practical planning workflow designed for small and mid-sized farms

This project combines a user-friendly experience with illustrative agronomic planning logic to support decision-making for farming operations.

## What the app includes

- Farm overview dashboard
- Crop planner with suitability scoring
- Cost and revenue estimator
- Market price panel for wheat, soybean, cotton, and maize
- Hindi/English interface options
- Responsive dashboard layout for mobile and desktop

## Tech stack

- React 18
- Vite
- JavaScript (ES modules)
- Recharts for visualizations
- Lucide React for icons

## Project structure

```text
KrishiSetu/
├── Fieldora/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── cropScoring.js
│       ├── main.jsx
│       └── styles.css
├── .gitignore
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Install dependencies

From the repository root:

```bash
cd Fieldora
npm install
```

### Run the app locally

```bash
npm run dev
```

This will start the Vite development server. Open the local URL displayed in the terminal to view the application.

### Build for production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Notes on data and recommendations

The crop scoring logic in this project uses illustrative planning assumptions rather than verified agronomic advice. As noted in the source code, the values are intended for demo/prototype use and should not be treated as certified agricultural guidance.

## License

This project does not currently include a license file. If you plan to share or distribute it publicly, add an appropriate license before release.

## Future ideas

Potential improvements for this project include:

- Real weather and mandi price API integration
- Farmer authentication and data persistence
- Multi-language localization beyond English/Hindi
- Offline support and farm data export
- More detailed agronomic intelligence for regional crops and seasons
