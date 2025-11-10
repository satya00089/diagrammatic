# Diagrammatic

_Design. Practice. Master System Architecture._

Diagrammatic is an **interactive System Design Playground** built with **React Flow** and **Tailwind CSS**.
Practice system design interviews, learn distributed systems architecture, and create beautiful diagrams with a comprehensive library of 55 production-grade components — ideal for **interview preparation, learning, and technical documentation**.

---

## ✨ Features

- 🧩 **55 System Design Components** - Database, Load Balancer, Cache, CDN, Message Queue, API Gateway, and more
- 🔍 **Smart Component Search** - Fuzzy search powered by Fuse.js to quickly find components
- 🎯 **Practice Problems** - Real system design interview questions with assessment and hints
- 🎨 **Interactive Drag & Drop Canvas** - Build architecture diagrams with ease
- 🌙 **Dark / Light Theme** - Eye-friendly theme switching
- 🖼️ **Export Diagrams** - Save your designs as PNG, JPEG, or SVG images
- � **Export/Import** - Export as JSON or XML/DrawIO format for sharing and backup
- �📊 **Inspector Panel** - Configure component properties in real-time
- 🔐 **Authentication** - Optional Google Sign-In or email/password authentication
- ☁️ **Cloud Storage** - Save and load diagrams to the cloud (requires backend setup)
- 🔗 **Share Designs** - Share your designs via compressed URLs
- ⚡ **Modern Tech Stack** - React 19 + TypeScript + Tailwind CSS 4 + Framer Motion

---

## 📦 Tech Stack

### Core

- [React 19](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vite.dev/) - Build tool and dev server

### UI & Styling

- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library

### Diagramming

- [React Flow (@xyflow/react)](https://reactflow.dev/) - Node-based diagram editor
- Custom node components with drag & drop
- Custom edge rendering

### Features

- [Fuse.js](https://www.fusejs.io/) - Fuzzy search for components
- [html-to-image](https://github.com/bubkoo/html-to-image) - Diagram export to PNG
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [React Router](https://reactrouter.com/) - Client-side routing

---

## 🧩 Component Library

Diagrammatic includes **55 production-grade system design components** organized into 9 categories:

### Compute & Storage (8)

Database, Cache, CDN, API Gateway, Load Balancer, Message Queue, Object Storage, Search Engine

### Container & Orchestration (4)

Container Orchestrator, Service Mesh, Serverless Function, Reverse Proxy

### Data Processing (2)

Stream Processor, Data Warehouse

### Observability (3)

Monitoring, Logging, Distributed Tracing

### Reliability (2)

Rate Limiter, Circuit Breaker

### Networking & Infrastructure (5)

DNS, File Storage, VPN Gateway, Firewall, Content Delivery

### Security (1)

Secrets Manager

### External Services (3)

Email Service, SMS Service, Payment Gateway

### Clients (2)

Web Client, Mobile Client

### ER Diagram Components (5)

Entity, Weak Entity, View, Trigger, Note

Each component comes with **comprehensive configurable properties** for realistic system design practice.

---

## 🗄️ ER Diagram Support

Create professional **Entity-Relationship diagrams** with advanced features:

### 📋 ER Components
- **Entity & Weak Entity** - Interactive tables with inline attribute editing
- **View, Trigger, Note** - Supporting ER elements with rich descriptions
- **Relationship Edges** - 18+ cardinality types with crow's foot notation

### 🔗 Relationship Cardinality Types

Choose from **18 relationship types** organized in 5 categories:

**Basic Cardinality:**
- 1:1, 1:N, N:1, N:M

**Mandatory Participation** (both must exist):
- 1:1 Mandatory, 1:N Mandatory, M:N Mandatory

**Optional Participation** (may or may not exist):
- 0:1, 0:N, 0:M to 0:N

**Mixed Participation:**
- 1 to 0..N, 0..1, 0..N, 1..N

**Recursive Relationships** (self-referencing):
- Self 1:1, Self 1:N, Self M:N

📖 **[View Complete ER Relationship Guide →](docs/ER_RELATIONSHIP_GUIDE.md)**

### ✨ ER Features
- **Interactive Tables** - Double-click to edit attributes, mark primary keys, set nullable
- **Visual Markers** - Crow's foot notation with mandatory/optional indicators
- **Smart Edge Detection** - Automatically uses ER edges when connecting ER nodes
- **Cardinality Selector** - Change relationship types on-the-fly
- **HTML Descriptions** - Rich text support in notes and triggers (sanitized with DOMPurify)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### 1️⃣ Clone the repository

```bash
git clone https://github.com/satya00089/diagrammatic.git
cd diagrammatic
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start development server

```bash
npm run dev
```

Visit 👉 [http://localhost:5173](http://localhost:5173)

### 4️⃣ (Optional) Setup Authentication

To enable user authentication and cloud diagram storage:

1. **Get Google OAuth Client ID** (optional for Google Sign-In):
   - Follow the guide in [docs/GOOGLE_SIGNIN.md](docs/GOOGLE_SIGNIN.md)
   - Add to `.env`: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

2. **Setup Backend API**:
   - See [docs/FASTAPI_BACKEND.md](docs/FASTAPI_BACKEND.md) for complete backend setup
   - Add to `.env`: `VITE_API_URL=http://localhost:8000`

3. **Environment Variables**:
   ```bash
   # Create .env file in project root
   VITE_API_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

> **Note**: The app works perfectly without authentication. Auth is only needed for saving/loading diagrams to the cloud.

### 5️⃣ Build for production

```bash
npm run build
```

---

## 🖼️ Usage

### Three Modes of Operation

#### 1. Practice Mode

1. Navigate to **Browse Problems** from the home page
2. Choose a problem from the list (e.g., "Design YouTube", "Design Instagram")
3. View problem details: difficulty, requirements, constraints, and hints
4. Drag components from the **Component Palette** onto the canvas
5. Connect components to show data flow and relationships
6. Configure component properties in the **Inspector Panel**
7. Add custom properties if standard ones aren't enough
8. Click **Assess** to get AI-powered feedback on your design
9. Use **Hints** if you need guidance

#### 2. Free Design Mode

1. Click **Get Started Free** or **Design Studio** from the home page
2. Start with a blank canvas - no constraints, no requirements
3. Drag and drop components to design your system
4. Perfect for planning your next project or experimenting with ideas
5. Export your diagram when done

#### 3. Custom Problem Mode

1. Click **Custom Problems** from the home page
2. Fill in your problem details:
   - Title and description
   - Difficulty level
   - Requirements and constraints
   - Helpful hints (optional)
   - Tags for categorization
3. Click **Create & Start Designing**
4. Design the solution on the interactive canvas
5. Great for educators, interviewers, or team exercises

### Component Palette

- **Search**: Use the search bar to quickly find components (fuzzy search enabled)
- **Browse by Category**: Expand/collapse groups like Compute, Storage, Observability
- **Drag & Drop**: Click and drag any component onto the canvas
- **Tooltips**: Hover over components to see descriptions

### Canvas Controls

- **Pan**: Click and drag the background
- **Zoom**: Use mouse wheel or trackpad pinch
- **Select**: Click on nodes or edges to select them
- **Delete**: Press `Delete` or `Backspace` to remove selected items
- **Multi-select**: Hold `Shift` and click multiple items
- **Export Image**: Click "Download" button to save as PNG, JPEG, or SVG
- **Export/Import**: 
  - Click "Export" to download as JSON or XML/DrawIO format
  - Click "Import" to load diagrams from JSON or XML files
  - See [Export/Import Guide](docs/EXPORT_IMPORT.md) for details

### Theme Switching

- Toggle between **Light** and **Dark** themes using the theme switcher in the toolbar
- Theme preference is saved automatically

---

## � Project Structure

```
diagrammatic/
├── src/
│   ├── components/          # React components
│   │   ├── ComponentPalette.tsx    # Component library sidebar
│   │   ├── DiagramCanvas.tsx       # React Flow canvas
│   │   ├── InspectorPanel.tsx      # Property editor
│   │   ├── Node.tsx                # Custom node component
│   │   ├── CustomEdge.tsx          # Custom edge renderer
│   │   ├── Toolbar.tsx             # Top toolbar
│   │   └── shared/                 # Shared UI components
│   ├── config/
│   │   └── components.ts    # Component library definitions (55 components)
│   ├── data/
│   │   └── problems.ts      # System design practice problems
│   ├── pages/
│   │   ├── Dashboard.tsx           # Landing page
│   │   └── SystemDesignPlayground.tsx  # Main editor
│   ├── hooks/
│   │   └── useTheme.ts      # Theme management hook
│   ├── types/               # TypeScript definitions
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── docs/                    # Documentation
```

---

## 🎓 Learning Resources

Check out the [Learning Exercises](docs/LEARNING_EXERCISES.md) for:

- System design fundamentals
- Practice problems with solutions
- Component usage patterns
- Architecture best practices

---

## 🔮 Roadmap

### Short-term

- [ ] More practice problems (Twitter, WhatsApp, Uber, Netflix)
- [x] AI-powered design assessment and feedback (integrated — requires API configuration)
- [x] Undo/Redo functionality
- [x] Keyboard shortcuts for power users
- [x] Save/load diagrams with authentication (requires backend setup - see docs/FASTAPI_BACKEND.md)
- [x] Export/Import diagrams as JSON and XML/DrawIO formats

### Long-term

- [x] User authentication and cloud storage (implemented with Google Sign-In support - see docs/GOOGLE_SIGNIN.md)
- [x] Share Designs with public URLs (implemented with URL compression)
- [x] Export to SVG and JSON (PNG, JPEG, SVG, JSON, XML export implemented)
- [ ] Real-time collaboration
- [ ] Custom component creation
- [ ] Interactive tutorials and guided learning paths
- [ ] Integration with popular design tools (Figma, Lucidchart, draw.io)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Areas to Contribute

- 🧩 Add more system design components
- 📝 Create new practice problems
- 🎨 Improve UI/UX design
- 📚 Write documentation and tutorials
- 🐛 Fix bugs and issues
- ✨ Suggest new features

---

## 📜 License

MIT © 2025 [Satya Subudhi](https://github.com/satya00089)

---

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the excellent diagramming library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Fuse.js](https://www.fusejs.io/) for fuzzy search capabilities
- System design interview community for inspiration

---

## 🔗 Links

- **Live Demo**: [https://satya00089.github.io/diagrammatic](https://satya00089.github.io/diagrammatic)
- **GitHub**: [https://github.com/satya00089/diagrammatic](https://github.com/satya00089/diagrammatic)
- **Issues**: [Report a bug or request a feature](https://github.com/satya00089/diagrammatic/issues)

---

**Made with ❤️ for aspiring system designers and software engineers**

```

---

## 🔮 Roadmap

* [ ] Sidebar with draggable shapes (rectangles, circles, text)
* [ ] Save/load diagrams (localStorage / database)
* [ ] Export to **SVG** and **JSON**
* [ ] Multi-user collaboration
* [ ] Component snippets for design systems

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first
to discuss what you’d like to change.

---

## 📜 License

MIT © 2025 \[satya subudhi]
```
