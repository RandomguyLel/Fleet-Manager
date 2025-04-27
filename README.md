# 🚚 Fleet Manager

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 📋 Overview

Fleet Manager is a comprehensive transportation management solution designed to help businesses efficiently track, manage, and maintain their vehicle fleets. With an intuitive dashboard, real-time analytics, and automated notification system, Fleet Manager provides everything needed for modern fleet operations.

## ✨ Features

- **🚗 Vehicle Management**: Track all your vehicles, their status, maintenance history, and documentation
- **📊 Analytics Dashboard**: Real-time insights into fleet performance and utilization
- **🔔 Notification System**: Automated alerts for upcoming service, document expiration, and other critical events
- **👤 User Management**: Role-based access control with admin, manager, and user privileges
- **📱 Responsive Design**: Access from any device with a modern, Tailwind CSS-powered interface
- **🔒 Secure Authentication**: JWT-based authentication system with session management

## 🔧 Technology Stack

### Backend
- **Node.js & Express**: RESTful API architecture
- **PostgreSQL**: Robust relational database storage
- **JWT Authentication**: Secure user authentication and session management
- **bcrypt**: Secure password hashing

### Frontend
- **React 19**: Latest React framework for UI components
- **Vite**: Next-generation frontend build tool
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing
- **Lit Elements**: Web components for reusable UI elements

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v14+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fleet-manager.git
   cd fleet-manager
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fleet_manager
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Start the application**
   ```bash
   # Start the backend server
   npm start
   
   # In a separate terminal, start the frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📱 Application Structure

```
fleet-manager/
├── backend/              # Express.js server
│   ├── routes/           # API routes
│   ├── db.js             # Database connection
│   └── schema.sql        # Database schema
├── frontend/             # React application
│   ├── src/              # Source files
│   │   ├── components/   # Reusable UI components
│   │   └── assets/       # Static assets
│   └── public/           # Public assets
└── files/                # Documentation and design files
```


## 📚 API Documentation

The Fleet Manager API provides the following endpoints:

- `/api/auth` - Authentication routes
- `/api/vehicles` - Vehicle management
- `/api/notifications` - Notification system
- `/api/users` - User management
- `/api/analytics` - Fleet analytics

## 🔄 Integrations WIP

Fleet Manager can integrate with:
- [NYI] Vehicle GPS location API's

- [X] E-CSDD vehicle registry *account required

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👏 Acknowledgements

- React Icons - https://react-icons.github.io/react-icons/
- Tailwind CSS - https://tailwindcss.com/

---

Made with ❤️ by the Fleet Manager Team | Last updated: April 27, 2025