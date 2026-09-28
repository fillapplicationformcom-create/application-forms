# Application Form Management System

A secure, modular web-based application form management system designed for
collecting, validating, storing, reviewing, and managing application data
through a structured administrative workflow.

—

## Overview

The Application Form Management System provides a centralized workflow for:

- Applicant data collection
- Form validation
- Document uploads
- Application tracking
- Administrative review
- Application status management
- Authorization workflows
- Secure file access
- Administrative authentication
- Audit logging
- Configurable frontend behavior

The project is designed with a clear separation between the public frontend,
server-side application logic, configuration data, uploaded files, and
administrative functionality.

—

## Features

### Applicant System

- Responsive application form
- Structured applicant information
- Client-side validation
- Server-side validation
- Application reference generation
- Submission confirmation
- Document attachment support

### Document Management

Supported upload categories include:

```text
uploads/
├── photos/
├── documents/
└── resumes/
application-forms/
│
├── server.js
├── package.json
├── .gitignore
├── .env.example
├── LICENSE
├── README.md
├── SECURITY.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
│
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── robots.txt
│   ├── security.txt
│   ├── sitemap.xml
│   │
│   └── assets/
│       ├── css/
│       │   └── style.css
│       │
│       └── js/
│           ├── form.js
│           ├── permissions.js
│           ├── storage.js
│           ├── admin.js
│           ├── auth.js
│           ├── dashboard.js
│           ├── applications.js
│           ├── ui.js
│           ├── validation.js
│           └── config.js
│
├── data/
│   ├── document-types.json
│   ├── field-options.json
│   └── ui-config.json
│
└── uploads/
    ├── photos/
    ├── documents/
    └── resumes/
    
 