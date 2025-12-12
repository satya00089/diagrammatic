/**
 * Prerender Script for SEO
 * Generates static HTML files for key routes to improve SEO
 * Run after build: node prerender.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");

// Routes to prerender with their content
const routes = {
  "/": {
    title:
      "Diagrammatic — Interactive System Design Playground | Learn Architecture Design",
    description:
      "Master system design with Diagrammatic - an interactive playground featuring 1k+ components including AWS, Azure & GCP cloud components, AI assessment, UML & ER diagrams, and 90+ practice problems. Free system architecture tool for students, professionals, and educators.",
    keywords:
      "system design, architecture diagram, system design interview, software architecture, distributed systems, AWS architecture, Azure architecture, GCP architecture, cloud design, ER diagram, UML diagram",
    content: `
      <h1>Diagrammatic - Interactive System Design Playground</h1>
      <p>Master system design with our interactive playground. Learn to design scalable, production-ready architectures with cloud provider support.</p>
      <h2>Key Features</h2>
      <ul>
        <li>1k+ System Design Components</li>
        <li>AWS, Azure & GCP Cloud Components</li>
        <li>AI-Powered Assessment & Recommendations</li>
        <li>90+ Practice Problems</li>
        <li>Real-time Collaboration</li>
        <li>UML & ER Diagrams</li>
        <li>Export as PNG, JPEG, SVG, JSON, XML</li>
        <li>Smart Component Search</li>
      </ul>
    `,
  },
  "/#/playground/free": {
    title: "Free Design Studio | Diagrammatic",
    description:
      "Create unlimited system architecture diagrams for free. 1k+ components including AWS, Azure, GCP cloud components, load balancers, databases, caches, queues, and more. Export as PNG, JPEG, SVG, JSON, or XML. No signup required.",
    keywords:
      "free system design tool, architecture diagram maker, cloud architecture, microservices design, AWS diagram, Azure diagram, GCP diagram, ER diagram, UML diagram",
    content: `
      <h1>Free Design Studio</h1>
      <p>Create unlimited architecture diagrams with 1k+ professional components including AWS, Azure & GCP cloud services. Export in multiple formats. No signup required.</p>
    `,
  },
  "/#/problems": {
    title: "Practice Problems | Diagrammatic",
    description:
      "Practice system design with 90+ real-world challenges. Get AI-powered feedback and recommendations on your architecture designs. Perfect for FAANG interview preparation.",
    keywords:
      "system design interview, system design practice, distributed systems problems, scalable architecture, FAANG interview, tech interview prep",
    content: `
      <h1>System Design Practice Problems</h1>
      <p>Practice with 90+ real-world system design challenges. Get instant AI-powered assessment and smart recommendations on your solutions.</p>
    `,
  },
};

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Read the base index.html
const baseHtml = fs.readFileSync(indexPath, "utf-8");

console.log("🚀 Starting prerendering...\n");

// Generate HTML for each route
Object.entries(routes).forEach(([route, data]) => {
  let html = baseHtml;

  // Update title
  html = html.replace(/<title>.*?<\/title>/, `<title>${data.title}</title>`);

  // Update meta description
  html = html.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${data.description}">`,
  );

  // Update meta keywords
  html = html.replace(
    /<meta name="keywords" content=".*?">/,
    `<meta name="keywords" content="${data.keywords}">`,
  );

  // Update OG title
  html = html.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${data.title}">`,
  );

  // Update OG description
  html = html.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${data.description}">`,
  );

  // Inject prerendered content into the SEO content div
  html = html.replace(
    /<div id="seo-content".*?<article>/s,
    `<div id="seo-content" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;"><article>${data.content}`,
  );

  // Determine output path
  let outputPath;
  if (route === "/") {
    outputPath = indexPath;
  } else {
    // For hash routes, we can't create separate files, but we update the main index
    // For a real solution, you'd need to set up proper routing or use a different approach
    const routeName = route.replace("/#/", "").replace("/", "-") || "index";
    outputPath = path.join(distDir, `${routeName}.html`);
  }

  // Write the file
  fs.writeFileSync(outputPath, html, "utf-8");
  console.log(`✅ Generated: ${route} -> ${path.basename(outputPath)}`);
});
