# KrisBan 🚀

> A streamlined Project Management System bridging the gap between Kanban task tracking and academic/research resource management.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)

## 📖 Overview

**KrisBan** is a custom-built project management solution designed to handle specific workflow frustrations found in generic tools. Unlike standard Kanban boards, this application integrates file management (Google Drive) and research review (PDF Annotation) directly into the task workflow, while automating the tedious process of weekly progress reporting.

## ✨ Key Features

### 🛠 Project Management
- **Kanban Board:** A dynamic Trello-like interface with "To Do," "Doing," and "Done" columns.
- **Task Management:** Assign deadlines, tag users, and track status updates in real-time.

### 📄 Resource Integration
- **Google Drive Sync:** Seamless redirection and linking to project resources stored in Drive.
- **PDF Viewer & Annotation:** View research papers and technical documents directly within the app. (Planned: In-app annotation tools).

### 🤖 Automation
- **Automated Progress Reports:** Users submit a quick input + screenshot, and the system compiles a formatted progress report for the Project Manager.
- **Admin Dashboard:** Exclusive backend view for PMs to generate reports and oversee project health.

### 🔐 Security & Roles
- **Role-Based Access Control (RBAC):** Distinct `Admin` (PM) and `User` (Member) dashboards.
- **Secure Authentication:** First-time login enforcement requiring immediate password changes for new accounts.

## 💻 Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose) / PostgreSQL
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB/PostgreSQL instance

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/project-name.git](https://github.com/yourusername/project-name.git)
   cd project-name
