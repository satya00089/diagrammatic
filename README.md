# Diagrammatic

_Design. Practice. Master System Architecture._

Diagrammatic is an **interactive System Design Playground** built with **React Flow** and **Tailwind CSS**.
Practice system design interviews, learn distributed systems architecture, and create beautiful diagrams with a comprehensive library of 46+ production-grade components — ideal for **interview preparation, learning, and technical documentation**.

---

## ✨ Features

- �️ **46+ System Design Components** - Database, Load Balancer, Cache, CDN, Message Queue, API Gateway, and more
- 🔍 **Smart Component Search** - Fuzzy search powered by Fuse.js to quickly find components
- 🎯 **Practice Problems** - Real system design interview questions with assessment and hints
- 🎨 **Interactive Drag & Drop Canvas** - Build architecture diagrams with ease
- 🌙 **Dark / Light Theme** - Eye-friendly theme switching
- 🖼️ **Export Diagrams** - Save your designs as PNG images
- 📊 **Inspector Panel** - Configure component properties in real-time
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

Diagrammatic includes **46 production-grade system design components** organized into 9 categories:

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

Each component comes with **comprehensive configurable properties** for realistic system design practice.

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

### 4️⃣ Build for production

```bash
npm run build
```

---

## 🖼️ Usage

### Practice Mode

1. Navigate to **System Design Playground**
2. Choose a problem from the dropdown (e.g., "Design YouTube", "Design Instagram")
3. View problem details: difficulty, time estimate, and category
4. Drag components from the **Component Palette** onto the canvas
5. Connect components by dragging from one node's edge to another
6. Configure component properties in the **Inspector Panel**
7. Click **Assess** to get feedback on your design
8. Use **Hints** if you need guidance

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
- **Export**: Click "Save as Image" to download your diagram as PNG

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
│   │   └── components.ts    # Component library definitions (46 components)
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
- [ ] AI-powered design assessment and feedback
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts for power users
- [ ] Save/load diagrams to localStorage

### Long-term

- [ ] User authentication and cloud storage
- [ ] Share diagrams with public URLs
- [ ] Export to SVG and JSON
- [ ] Real-time collaboration
- [ ] Custom component creation
- [ ] Interactive tutorials and guided learning paths
- [ ] Integration with popular design tools (Figma, Lucidchart)

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
