# Application Form Management System

A secure, full-stack application management platform built with **HTML, CSS, JavaScript, Node.js, Express, PostgreSQL, file storage, PDF generation, administrator authentication, WRT/authorized-access controls, and optional AI integration**.

---

## 1. Project Overview

This project provides a complete application submission and administration system.

Applicants can:

- Complete the master application form
- Submit personal and application information
- Upload photographs
- Upload documents
- Upload resumes/CVs
- Receive a submission confirmation
- Receive an application/reference ID

Administrators can:

- Log in through the administrator portal
- View submitted applications
- View application details
- Download uploaded files
- Generate application PDFs
- Review application records
- Manage authorized access requests
- Request camera, microphone, or screen-sharing permissions where explicitly authorized by the user
- Use authenticated API endpoints
- Review application status and related information

---

# 2. Repository Structure

```text
application-form/
│
├── public/
│   ├── index.html
│   ├── admin-login.html
│   ├── admin.html
│   ├── success.html
│   │
│   └── assets/
│       ├── css/
│       │   └── style.css
│       │
│       └── js/
│           ├── form.js
│           └── permissions.js
│
├── data/
│   └── applications.json
│
├── uploads/
│   ├── photos/
│   ├── documents/
│   └── resumes/
│
├── server.js
├── package.json
├── .gitignore
└── README.md