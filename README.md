APPLICATION FORM MANAGEMENT SYSTEM

A secure, modular web-based application form management system built with Node.js, Express and PostgreSQL.


OVERVIEW

The Application Form Management System provides a structured platform for collecting, storing, reviewing and managing application data and supporting documents.

The project is designed with separate public and administrative interfaces, controlled file uploads, administrator authentication, authorization workflows, audit logging and configurable frontend data.


FEATURES

- Public application form
- Administrative dashboard
- Administrator authentication
- Application submission and management
- Application status management
- Document and photo uploads
- Resume uploads
- PostgreSQL database integration
- PDF application record generation
- Audit logging
- Time-limited authorization requests
- Configurable form options
- Configurable UI settings
- API health monitoring
- Rate limiting
- CORS configuration
- Security headers
- Environment-based configuration
- AI integration point for authorized administrative analysis


TECHNOLOGY STACK

- Node.js
- Express.js
- PostgreSQL
- Multer
- JSON Web Tokens
- PDFKit
- Express Rate Limit
- CORS
- HTML5
- CSS3
- JavaScript


PROJECT STRUCTURE

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
├── uploads/
│   ├── photos/
│   ├── documents/
│   └── resumes/
│
└── ...


REQUIREMENTS

Before running the application, install:

- Node.js 20 or newer
- PostgreSQL
- npm

A PostgreSQL database is required for application storage and administrative functions.


INSTALLATION

Clone the repository:

git clone https://github.com/fillapplicationformcom-create/application-forms.git

Enter the project directory:

cd application-forms

Install dependencies:

npm install

Create the environment configuration:

cp .env.example .env

Edit .env and provide the required configuration values.


ENVIRONMENT CONFIGURATION

The application uses environment variables for sensitive configuration.

Typical variables include:

PORT=10000
NODE_ENV=development

DATABASE_URL=your_postgresql_connection_string

ADMIN_TOKEN=your_admin_token
SESSION_SECRET=your_long_random_session_secret

ALLOWED_ORIGINS=http://localhost:10000

AI_API_KEY=
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini

Never commit a real .env file, database password, administrator token, session secret or API key to a public repository.


RUNNING THE APPLICATION

Start the server:

npm start

For development, if a development script is configured:

npm run dev

The server listens on the configured PORT.

For local development, the default port is:

10000


DATABASE

On startup, the server initializes the required PostgreSQL tables if they do not already exist.

The main tables are:

- applications
- application_files
- access_requests
- audit_logs

The application also creates useful database indexes for application, file, access-request and audit-log queries.


PUBLIC APPLICATION FLOW

The public application interface allows a user to:

1. Open the application form.
2. Enter the required information.
3. Upload supported documents.
4. Submit the application.
5. Receive an application ID.
6. Receive the submission status from the server.

Application data is stored in PostgreSQL.

Uploaded files are stored outside the public frontend directory.


SUPPORTED UPLOADS

The server supports commonly used:

- JPEG images
- PNG images
- WebP images
- PDF documents
- Microsoft Word documents
- DOCX documents

The default maximum individual file size is:

10 MB

The server also limits the number of uploaded files per request.


ADMINISTRATOR FUNCTIONS

Authorized administrators can:

- Sign in
- View submitted applications
- Open individual application records
- View uploaded-file metadata
- Access authorized files
- Update application status
- Generate application PDFs
- Create authorization requests
- Review authorization status
- Approve or deny authorization requests
- Review audit logs
- Use the configured AI analysis endpoint


APPLICATION STATUSES

The system supports the following application statuses:

Submitted
Under Review
Documents Required
Verified
Approved
Rejected
Withdrawn


AUTHORIZATION WORKFLOW

The system contains a time-limited authorization workflow for protected application access.

An authorization request may be:

pending
approved
denied
expired

Approved authorization requests are time-limited.

Authorization activity is recorded in the audit log.


API HEALTH CHECK

The health endpoint is:

GET /api/health

It reports basic service information, environment status, database connectivity and whether AI configuration is present.


SECURITY

Security-related configuration and operational guidance are documented separately in:

SECURITY.md

Important security principles include:

- Do not expose database credentials.
- Do not commit .env.
- Use strong administrator secrets.
- Use a strong session secret.
- Restrict CORS origins in production.
- Keep uploaded files outside the public directory.
- Keep dependencies updated.
- Use HTTPS in production.
- Review audit logs regularly.
- Limit administrator access.
- Do not expose internal API credentials to frontend JavaScript.


FILE STORAGE

Uploaded files are stored under:

uploads/
├── photos/
├── documents/
└── resumes/

These directories are intended for server-side storage and should not be exposed directly as public static directories.


CONFIGURATION DATA

Frontend configuration data is stored under:

data/

Current configuration files include:

document-types.json
field-options.json
ui-config.json

These files allow reusable document definitions, selectable field values and frontend presentation settings to be maintained separately from application logic.


FRONTEND ASSETS

Frontend JavaScript modules are located at:

public/assets/js/

The current modules include:

form.js
permissions.js
storage.js
admin.js
auth.js
dashboard.js
applications.js
ui.js
validation.js
config.js

The main stylesheet is:

public/assets/css/style.css


PRODUCTION DEPLOYMENT

Before deploying to production:

1. Set NODE_ENV=production.
2. Configure a production PostgreSQL database.
3. Set a strong ADMIN_TOKEN.
4. Set a strong SESSION_SECRET.
5. Configure ALLOWED_ORIGINS.
6. Configure HTTPS.
7. Protect the uploads directory.
8. Review server and database logs.
9. Verify backup procedures.
10. Test administrator authentication.
11. Test application submission.
12. Test file uploads.
13. Test PDF generation.
14. Test authorization expiry.
15. Verify that secrets are not present in the repository.


REPOSITORY SAFETY

The following should normally remain outside version control:

.env
uploads/
data/generated/
private/generated/
logs/
node_modules/

The exact exclusions are defined in:

.gitignore


DEVELOPMENT

Contributions should follow the project's contribution guidelines in:

CONTRIBUTING.md

Please review the project's:

CODE_OF_CONDUCT.md

before contributing.


CHANGELOG

Project changes are documented in:

CHANGELOG.md


LICENSE

This project is distributed under the MIT License.

See:

LICENSE

for the complete license text.


DISCLAIMER

This software is provided as a general-purpose application-management framework.

Organizations deploying it are responsible for configuring appropriate security, privacy, data-retention, access-control and regulatory requirements for their specific use case.


PROJECT STATUS

The project is structured as a modular application-management system.

Future development may include:

- Additional administrative controls
- Improved reporting
- Enhanced document management
- Additional validation rules
- Expanded configuration support
- Improved accessibility
- Additional deployment documentation
- Automated testing
- Additional audit and monitoring capabilities


APPLICATION FORM MANAGEMENT SYSTEM

Built with Node.js, Express and PostgreSQL.