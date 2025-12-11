/**
 * Prerender Script for SEO
 * Generates static HTML files for key routes to improve SEO
 * Run after build: node prerender.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
      "Master system design with Diagrammatic - an interactive playground featuring 45+ components, AI assessment, and real-world practice problems. Free system architecture tool for students, professionals, and educators.",
    keywords:
      "system design, architecture diagram, system design interview, software architecture, distributed systems",
    content: `
      <h1>Diagrammatic - Interactive System Design Playground</h1>
      <p>Master system design with our interactive playground. Learn to design scalable, production-ready architectures.</p>
      <h2>Key Features</h2>
      <ul>
        <li>45+ System Design Components</li>
        <li>AI-Powered Assessment</li>
        <li>Practice Problems</li>
        <li>Real-time Collaboration</li>
      </ul>
    `,
  },
  "/#/playground/free": {
    title: "Free Design Studio | Diagrammatic",
    description:
      "Create unlimited system architecture diagrams for free. 45+ components including load balancers, databases, caches, queues, and more. No signup required.",
    keywords:
      "free system design tool, architecture diagram maker, cloud architecture, microservices design",
    content: `
      <h1>Free Design Studio</h1>
      <p>Create unlimited architecture diagrams with 45+ professional components. No signup required.</p>
    `,
  },
  "/#/problems": {
    title: "Practice Problems | Diagrammatic",
    description:
      "Practice system design with real-world challenges. Get AI-powered feedback on your architecture designs. Perfect for interview preparation.",
    keywords:
      "system design interview, system design practice, distributed systems problems, scalable architecture",
    content: `
      <h1>System Design Practice Problems</h1>
      <p>Practice with real-world system design challenges. Get instant AI feedback on your solutions.</p>
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

console.log("\n🎉 Prerendering complete!\n");
console.log("📝 Tips for better SEO:");
console.log("  1. Submit sitemap.xml to Google Search Console");
console.log("  2. Add backlinks from Reddit, Hacker News, Product Hunt");
console.log("  3. Consider moving to Next.js for true SSR/SSG");
console.log("  4. Add a blog with regular content updates\n");
