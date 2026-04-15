# GEMINI.md

## Project Overview
**TechCup Frontend** is a web-based platform built with **React** and **Vite**, designed to centralize and automate the management of soccer tournaments at the Escuela Colombiana de Ingeniería. The platform streamlines registrations, payment verification, and results tracking for students, graduates, professors, and administrative staff.

### Main Technologies
- **React 19**: Core UI library.
- **Vite 8**: Frontend build tool and development server.
- **React Router 7**: For client-side routing and navigation.
- **Axios 1.14**: For handling API requests to the backend.
- **Context API**: For global state management (Authentication and Registration flow).

---

## Architecture and Structure

- **`src/api/`**: Contains service modules for interacting with the backend (e.g., `auth.js`, `teams.js`, `tournament.js`).
- **`src/components/`**: Houses reusable UI components (`ui/`), layouts (`layout/`), and shared functional components like `ProtectedRoute`.
- **`src/context/`**: Global state providers.
    - `AuthContext.jsx`: Manages user authentication, tokens, and roles.
    - `RegistrationContext.jsx`: Manages the multi-step registration process.
- **`src/pages/`**: Page-level components organized by feature or role (e.g., `Login/`, `Dashboard/`, `Captain/`, `Referee/`).
- **`src/hooks/`**: Custom hooks like `useAuth` and `useRegistration` for easy access to contexts.
- **`src/utils/`**: Helper functions, validators (e.g., `validators.js`), and JWT handling.
- **`docs/`**: Project documentation, including the visual identity manual and images.

---

## Building and Running

Ensure you have **Node.js** installed before proceeding.

### Key Commands
- **Install Dependencies**: 
  ```bash
  npm install
  ```
- **Run Development Server**: 
  ```bash
  npm run dev
  ```
- **Build for Production**: 
  ```bash
  npm run build
  ```
- **Preview Production Build**: 
  ```bash
  npm run preview
  ```
- **Linting**: 
  ```bash
  npm run lint
  ```

---

## Development Conventions

### Authentication & Authorization
- **Token Management**: The application uses a JWT-based authentication system. The token is stored in `localStorage` under the key `techcup_token`.
- **Role-Based Access Control (RBAC)**: Routes are protected using the `ProtectedRoute` component, which checks for authentication and valid roles (`PLAYER`, `CAPTAIN`, `REFEREE`, `ADMINISTRATIVE`, `ADMINISTRATOR`).
- **Axios Interceptors**: A centralized `axiosInstance` (`src/api/axiosInstance.js`) automatically attaches the `Authorization` header to requests and handles 401/403 errors globally.

### Registration Flow
- The registration is a multi-step process (Step 1 to Success) managed via `RegistrationContext`. 
- Different user types (e.g., Students, Family Members, Referees) may have different registration requirements (e.g., Google OAuth is mandatory for Referees and Family Members).

### Styling
- **CSS Modules**: Preferred for component-level styling to avoid naming collisions (`*.module.css`).
- **Global Styles**: Defined in `index.css` and `App.css`.
- **Animations**: Reusable animations are located in `src/styles/animations.css`.

### API Integration
- API base URL is configured via the `VITE_API_BASE_URL` environment variable in the `.env` file.
- All API calls should be organized within the `src/api/` directory using the unified `axiosInstance`.
