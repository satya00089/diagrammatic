import type { DriveStep } from "driver.js";

export interface TourDefinition {
  id: string;
  steps: DriveStep[];
}

export const TOURS: Record<string, TourDefinition> = {
  home: {
    id: "home",
    steps: [
      {
        element: '[data-tour="hero-cta"]',
        popover: {
          title: "Welcome to Diagrammatic 👋",
          description:
            "The interactive canvas for system design. Build, practice, and collaborate — all in your browser.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-tour="nav-problems"]',
        popover: {
          title: "Browse Practice Problems",
          description:
            "200+ curated system design problems across Infrastructure, Application, and AI & ML domains.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-studio"]',
        popover: {
          title: "Design Studio",
          description:
            "Start with a blank canvas and 1000+ cloud components. No account required to explore.",
          side: "bottom",
          align: "start",
        },
      },
    ],
  },

  dashboard: {
    id: "dashboard",
    steps: [
      {
        element: '[data-tour="domain-filter"]',
        popover: {
          title: "Filter by Domain",
          description:
            "Switch between Infrastructure, Application, and AI & ML system design categories.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="difficulty-filter"]',
        popover: {
          title: "Filter by Difficulty",
          description:
            "Narrow down to Easy, Medium, Hard, or Very Hard problems to match your skill level.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="search-box"]',
        popover: {
          title: "Search Problems",
          description:
            "Search by title, tag, or technology — e.g. 'Redis', 'rate limiting', 'recommendation engine'.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="problem-card"]',
        popover: {
          title: "Open a Problem",
          description:
            "Click any card to open the interactive canvas. Your progress auto-saves as you work.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="create-problem-btn"]',
        popover: {
          title: "Create Your Own",
          description:
            "Have a custom scenario in mind? Define your own requirements, constraints, and hints.",
          side: "left",
          align: "start",
        },
      },
    ],
  },

  design_studio: {
    id: "design_studio",
    steps: [
      {
        element: '[data-tour="component-palette"]',
        popover: {
          title: "Component Palette",
          description:
            "1000+ components live here — architectural primitives and cloud provider services. Drag any item onto the canvas to add it to your design.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="palette-search"]',
        popover: {
          title: "Search Providers & Components",
          description:
            "Type 'aws', 'azure', or 'gcp' to load cloud provider components. Or search by name — e.g. 'load balancer', 'S3', 'Redis'.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="canvas-area"]',
        popover: {
          title: "Interactive Canvas",
          description:
            "Drop components here, drag to reposition, and draw connections by pulling from any node handle. Scroll to zoom, hold space to pan.",
          side: "over",
          align: "center",
        },
      },
      {
        element: '[data-tour="save-btn"]',
        popover: {
          title: "Save Your Design",
          description:
            "Give your design a name and save it. It will also auto-save as you make changes.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="export-btn"]',
        popover: {
          title: "Export",
          description:
            "Download your diagram as PNG, JPEG, SVG, or JSON for sharing and documentation.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="assess-btn"]',
        popover: {
          title: "AI Assessment",
          description:
            "Get instant AI-powered feedback on your architecture — scores, missing components, and improvements.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: '[data-tour="inspector-toggle"]',
        popover: {
          title: "Inspector Panel",
          description:
            "Click to expand the Inspector Panel. Select any node or edge on the canvas to edit its properties, labels, and appearance here.",
          side: "left",
          align: "start",
        },
      },
      {
        element: '[data-tour="chatbot-btn"]',
        popover: {
          title: "AI Design Assistant",
          description:
            "Ask the AI to suggest components, explain design decisions, or critique your architecture.",
          side: "top",
          align: "end",
        },
      },
    ],
  },

  problem_playground: {
    id: "problem_playground",
    steps: [
      {
        element: '[data-tour="inspector-toggle"]',
        popover: {
          title: "Problem Brief",
          description:
            "Click to expand the panel and read the problem's requirements, constraints, and hints in the Details tab.",
          side: "left",
          align: "start",
        },
      },
      {
        element: '[data-tour="canvas-area"]',
        popover: {
          title: "Design Here",
          description:
            "Drag components from the palette on the left and connect them to build your solution.",
          side: "over",
          align: "center",
        },
      },
      {
        element: '[data-tour="timer"]',
        popover: {
          title: "Timer",
          description:
            "Track how long you spend on each problem — great for interview practice.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="assess-btn"]',
        popover: {
          title: "Submit for Assessment",
          description:
            "When you're happy with your design, click here to get an AI score and detailed feedback.",
          side: "bottom",
          align: "end",
        },
      },
    ],
  },

  my_designs: {
    id: "my_designs",
    steps: [
      {
        element: '[data-tour="filter-tabs"]',
        popover: {
          title: "Filter Your Designs",
          description:
            "Switch between All, Owned (designs you created), and Shared (designs others shared with you).",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="design-card"]',
        popover: {
          title: "Your Saved Designs",
          description:
            "Open, rename, or delete your designs. Shared designs show a collaboration badge.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="new-design-btn"]',
        popover: {
          title: "Start a New Design",
          description:
            "Jump straight into the Design Studio with a blank canvas.",
          side: "left",
          align: "start",
        },
      },
    ],
  },
};
