# Diagrammatic - Design System Editor

A lightweight Draw.io-style editor focused on practicing design system concepts. Build interactive diagrams while learning about design tokens, component composition, and responsive design patterns.

## Features

- **Drag & Drop Interface**: Intuitive palette with draggable components
- **Design Token Editor**: Live editing of CSS custom properties
- **Component Inspector**: Real-time token visualization and editing
- **Export Functionality**: Save your diagrams as JSON or images
- **Learning Exercises**: Structured tutorials for design system concepts

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) to view the app.

### Using the Editor

To use the new palette editor instead of the default playground:

1. Open `src/App.tsx`
2. Replace the default export:
   ```typescript
   // Change from:
   export { default } from './components/Playground';
   
   // To:
   export { default } from './pages/EditorWithPalette';
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run storybook` - Start Storybook

## Acceptance Testing

To verify the editor is working correctly:

1. **Start the app**: `npm run dev`
2. **Switch to editor**: Modify `App.tsx` to export `EditorWithPalette`
3. **Test drag & drop**:
   - See palette on the left with Button, Card, Input components
   - Drag a component onto the canvas
   - Verify new node appears at drop location
4. **Test inspector**:
   - Click on a node to select it
   - See component type and tokens in right panel
   - Edit token values in text inputs
   - Verify visual changes reflect immediately
5. **Test export**:
   - Click "Export JSON" button
   - Verify JSON with nodes and edges is copied to clipboard
6. **Check documentation**:
   - Open `docs/LEARNING_EXERCISES.md`
   - Verify 4 exercises are present with step-by-step instructions

## Architecture

### Components

- `src/components/Palette.tsx` - Draggable component palette
- `src/pages/EditorWithPalette.tsx` - Main editor with drag/drop and inspector
- `src/components/Playground.tsx` - Original ReactFlow playground

### Design System

The project uses CSS custom properties for theming:
- Light/dark theme support
- Consistent spacing and color tokens
- Component-scoped token overrides

## Learning Path

1. Complete the exercises in `docs/LEARNING_EXERCISES.md`
2. Experiment with token cascading and inheritance
3. Build custom components with your own token patterns
4. Practice responsive design with breakpoint tokens

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and how to submit changes.

## Quick Usage Note

After installation (`npm install`), start the development server with `npm run dev`.

To switch from the default playground to the new editor with palette:

1. Open `src/App.tsx`
2. Change the export line:
   ```typescript
   // From:
   export { default } from './components/Playground';
   
   // To:
   export { default } from './pages/EditorWithPalette';
   ```
3. Save and refresh the browser

The editor will now show with:
- Component palette on the left (Button, Card, Input)
- Canvas in the center for drag & drop
- Inspector panel on the right for editing tokens
- Export JSON button to save your diagram

## License

MIT - see LICENSE file for details.
