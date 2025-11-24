# Line Dance Scheduler - Modern Modular Architecture

## 🎯 Overview

This is a refactored, modern modular version of the Line Dance Scheduler application. The app has been restructured from a monolithic single-file application to a clean, maintainable modular architecture using Vite, React, and modern JavaScript practices.

## 📁 Project Structure

```
Scheduler/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── MonthNavigator.jsx
│   │   ├── DanceSelector.jsx
│   │   ├── InstructorPortal.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/            # Business logic & API
│   │   └── storage.service.js
│   ├── utils/              # Helper functions
│   │   └── helpers.js
│   ├── config/             # Configuration
│   │   └── firebase.js
│   ├── styles/             # Global styles
│   │   └── index.css
│   ├── constants.js        # Constants & enums
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── index-new.html         # Modern HTML entry point
├── index.html            # Legacy monolithic version
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore enabled

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Update `src/config/firebase.js` with your Firebase credentials

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```

## 🏗️ Architecture

### Modular Design Principles

1. **Separation of Concerns**: Each component has a single responsibility
2. **Service Layer**: All Firebase operations centralized in `StorageService`
3. **Utility Functions**: Common helpers extracted to utils
4. **Configuration Management**: Environment-specific configs isolated
5. **Modern Build Tools**: Vite for fast development and optimized production builds

### Key Improvements

- ✅ **ES Modules**: Native JavaScript modules instead of inline scripts
- ✅ **Component Isolation**: Each component in its own file
- ✅ **Type Safety**: Better structure for future TypeScript migration
- ✅ **Build Optimization**: Tree-shaking, code splitting, minification
- ✅ **Hot Module Replacement**: Fast development with instant updates
- ✅ **Maintainability**: Easy to navigate and modify code

## 📦 Dependencies

### Production
- `react` & `react-dom`: UI framework
- `firebase`: Backend database
- `date-fns`: Date manipulation
- `lucide-react`: Icon library

### Development
- `vite`: Build tool and dev server
- `@vitejs/plugin-react`: React support for Vite
- `tailwindcss`: Utility-first CSS framework
- `postcss` & `autoprefixer`: CSS processing

## 🎨 Styling

The app uses:
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Dark Neon Theme**: Unique dark mode with gradient accents
- **Responsive Design**: Mobile-first approach

## 🔥 Firebase Structure

### Collections

- `instructors`: Instructor profiles
- `dances`: Dance database with difficulty levels
- `availability`: Instructor availability by month
- `schedules`: Monthly lesson schedules

## 🛠️ Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint (if configured)

### Adding New Features

1. Create component in `src/components/`
2. Add service methods in `src/services/`
3. Import and use in `App.jsx` or parent components
4. Add styles to `src/styles/` if needed

## 🔄 Migration Status

### ✅ Completed
- [x] Directory structure setup
- [x] Firebase configuration extraction
- [x] Storage service layer
- [x] Utility functions
- [x] Constants and types
- [x] Layout component
- [x] Login screen
- [x] Month navigator
- [x] Dance selector
- [x] Instructor portal
- [x] Build configuration (Vite, Tailwind, PostCSS)

### 🚧 In Progress
- [ ] AdminDashboard full refactoring (complex component)
- [ ] Google Sheets integration components
- [ ] Auto-generation algorithm extraction
- [ ] Drag-and-drop schedule management

### 📋 Future Enhancements
- [ ] TypeScript migration
- [ ] Unit tests (Jest/Vitest)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Storybook for component documentation
- [ ] Performance monitoring
- [ ] Error boundary components
- [ ] Loading state management (React Query)

## 📝 Notes

The legacy `index.html` is preserved for reference and for the full AdminDashboard functionality until the refactoring is complete. Both versions share the same Firebase backend, so data is synchronized.

## 🤝 Contributing

When adding new features:
1. Follow the modular structure
2. Keep components focused and small
3. Use the service layer for Firebase operations
4. Add utility functions for reusable logic
5. Maintain consistent naming conventions

## 📄 License

© 2025 Neon Boots Line Dance Scheduler
