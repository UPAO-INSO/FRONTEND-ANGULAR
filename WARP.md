# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
DclassicApp is a modern Angular 20 application using the latest Angular features including:
- **Angular 20.1.0** with the new application builder
- **Zoneless change detection** (`provideZonelessChangeDetection()`)
- **Standalone components** architecture (no NgModules)
- **Angular Signals** for reactive state management
- **TypeScript 5.8.2** with strict configuration

## Development Commands

### Core Development
- `ng serve` or `npm start` - Start development server (http://localhost:4200)
- `ng build` or `npm run build` - Build for production
- `ng build --watch --configuration development` or `npm run watch` - Build in watch mode for development

### Testing
- `ng test` or `npm test` - Run unit tests with Karma/Jasmine
- Tests are configured with Karma, Chrome launcher, and coverage reporting

### Code Generation
- `ng generate component <name>` - Create new component
- `ng generate service <name>` - Create new service  
- `ng generate --help` - See all available schematics

## Architecture & Code Structure

### Application Bootstrap
- Entry point: `src/main.ts` using `bootstrapApplication()`
- Configuration: `src/app/app.config.ts` with providers
- Root component: `src/app/app.ts` (not `app.component.ts`)

### Component Architecture
- **Standalone components**: All components use `imports` array instead of NgModules
- **Signals**: Use `signal()` for reactive state (see `title` signal in App component)
- **Component naming**: Uses `App` class name instead of `AppComponent`

### File Structure Patterns
- Component files: `*.ts`, `*.html`, `*.css` (separate files, not inline)
- Template files: Use `.html` extension 
- Style files: Use `.css` extension (not `.scss`)
- Component selector prefix: `app-`

### TypeScript Configuration
- **Strict mode enabled** with additional strict flags
- **Angular compiler strict options** enabled
- **Experimental decorators** enabled for Angular features

### Routing
- Uses Angular Router with `provideRouter(routes)`
- Routes defined in `src/app/app.routes.ts`
- Currently empty routes array (ready for expansion)

## Build Configuration
- **Production builds**: Optimized with budgets (500kB warning, 1MB error)
- **Development builds**: Source maps enabled, optimizations disabled
- **Assets**: Static files served from `public/` directory
- **Global styles**: `src/styles.css`

## Development Notes
- This is a fresh Angular CLI project generated with version 20.1.1
- Uses the modern Angular application builder (`@angular/build:application`)
- Configured with Prettier for HTML formatting with Angular parser
- Browser target: Modern browsers supporting ES2022
