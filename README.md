# Electro Expert - Monorepo

A modern electronics e-commerce platform built with a monorepo architecture using Next.js, Firebase, and TypeScript.

## 🏗️ Architecture

This monorepo contains the following packages:

- **`web/`** - Next.js frontend application with TypeScript and Tailwind CSS
- **`shared/`** - Shared TypeScript types, enums, and utilities used across all packages
- **`functions/`** - Firebase Functions backend (to be initialized)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Firebase CLI (for backend functions)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd electro-expert-new
```

2. Install dependencies:

```bash
pnpm install
```

3. Build shared types:

```bash
pnpm build:shared
```

### Development

Start all workspaces in development mode:

```bash
pnpm dev
```

Or run individual workspaces:

```bash
# Web application
pnpm web:dev

# Build shared package in watch mode
pnpm shared:dev
```

## 📦 Package Scripts

### Root Level Scripts

- `pnpm dev` - Start all workspaces in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build artifacts
- `pnpm type:check` - Run TypeScript type checking

### Shared Package Scripts

- `pnpm build:shared` - Build shared types package
- `pnpm build:shared:web` - Build and copy shared types to web package
- `pnpm build:shared:functions` - Build and copy shared types to functions package

### Web Application Scripts

- `pnpm web:dev` - Start Next.js development server
- `pnpm web:build` - Build web application for production
- `pnpm web:start` - Start production server
- `pnpm web:lint` - Lint web application
- `pnpm web:type:check` - Type check web application

## 🏃‍♂️ Development Workflow

1. **Shared Types**: When you modify types in the `shared` package, run:

   ```bash
   pnpm build:shared
   ```

2. **Web Development**: The web application imports shared types from `@electro-expert/shared`:

   ```typescript
   import { User, ProductCategory } from '@s/hared-generated'
   ```

3. **Type Safety**: All packages use TypeScript with strict configuration for better type safety.

## 🔧 Configuration Files

- **`.prettierrc`** - Code formatting configuration
- **`eslint.config.js`** - ESLint configuration using flat config
- **`pnpm-workspace.yaml`** - PNPM workspace configuration
- **`scripts/build-shared-types.js`** - Script to build and distribute shared types

## 🌍 Environment Setup

The project uses the following environment structure:

- **Development**: Local development with hot reloading
- **Production**: Optimized builds for deployment

## 📱 Firebase Integration

Firebase is configured and ready for:

- **Authentication** - User authentication and authorization
- **Firestore Database** - NoSQL database with security rules
- **Cloud Functions** - Serverless backend functions using `onCall` pattern
- **App Hosting** - Next.js app hosting with `apphosting.yaml`
- **Storage** - File storage with security rules

### Firebase Functions

The functions are set up using the `functions.https.onCall` pattern with proper authentication and authorization:

- **Product Functions**: `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`
- **User Functions**: `getUserProfile`, `createUserProfile`, `updateUserProfile`, `setAdminRole`
- **Order Functions**: `getUserOrders`, `getOrder`, `createOrder`, `updateOrderStatus`

### Shared Types Integration

Shared types are copied to functions at build time via the build script. The functions use `IOperationResult<T>` interface for consistent response handling.

### Firebase Configuration Files

- `firebase.json` - Main Firebase configuration
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes
- `storage.rules` - Storage security rules
- `web/apphosting.yaml` - Next.js app hosting configuration

## 🎨 Tech Stack

### Frontend (Web)

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Framer Motion** - Animations
- **React Icons** - Icon library

### Backend (Firebase)

- **Firebase Functions** - Serverless functions
- **Firestore** - NoSQL database
- **Firebase Auth** - Authentication
- **Firebase Storage** - File storage

### Shared

- **TypeScript** - Shared types and enums
- **Common utilities** - Reusable functions

## 📁 Project Structure

```
electro-expert/
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API services
│   ├── public/             # Static assets
│   └── package.json
├── shared/                 # Shared types and utilities
│   ├── src/
│   │   ├── types/          # TypeScript type definitions
│   │   └── enums/          # Shared enums
│   └── package.json
├── functions/              # Firebase functions (to be initialized)
├── scripts/                # Build scripts
├── package.json            # Root package configuration
├── pnpm-workspace.yaml     # Workspace configuration
└── README.md
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `pnpm lint && pnpm type:check`
4. Build all packages: `pnpm build`
5. Create a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Common Issues

1. **Shared types not found**: Run `pnpm build:shared` to rebuild and distribute shared types
2. **PNPM workspace issues**: Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install`
3. **TypeScript errors**: Run `pnpm type:check` to see detailed type errors

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Check the [Firebase documentation](https://firebase.google.com/docs)
- Check the [pnpm workspace documentation](https://pnpm.io/workspaces)
