Yes. Replace the previous application-forms/SECURITY.md with this more comprehensive version. It is still documentation only; it does not claim controls that the current server.js does not actually implement.

SECURITY POLICY
APPLICATION FORM MANAGEMENT SYSTEM
===================================
Document: SECURITY.md
Project: Application Form Management System
Policy Version: 2.0
Security Baseline: Production-Oriented
Last Updated: 2020
Repository: application-forms
1. PURPOSE
==========
This document defines the security principles, operational requirements,
secure-development practices, vulnerability-reporting procedures and
deployment safeguards applicable to the Application Form Management System.
The system is designed to process application records and potentially
sensitive supporting documents. Security therefore applies to the complete
application lifecycle, including:
- Data collection
- Data transmission
- Authentication
- Authorization
- File uploads
- File storage
- Administrative access
- Database access
- Authorization workflows
- Audit logging
- PDF generation
- Optional AI integrations
- Configuration
- Deployment
- Backup and recovery
- Monitoring
- Incident response
- Secure disposal
2. SECURITY OBJECTIVES
======================
The primary security objectives are:
CONFIDENTIALITY
---------------
Application information, uploaded documents, credentials, tokens and
administrative information must only be accessible to authorized parties.
INTEGRITY
---------
Application records, status information, uploaded files and audit information
must be protected against unauthorized modification.
AVAILABILITY
------------
The application should remain available to legitimate users while protecting
the service from abuse, excessive requests and avoidable operational failures.
ACCOUNTABILITY
--------------
Security-sensitive operations should be attributable through appropriate
authentication and audit records.
DATA MINIMIZATION
-----------------
Only information necessary for the application's intended purpose should be
collected, processed and retained.
DEFENSE IN DEPTH
----------------
Security must not depend on a single control. Authentication, authorization,
validation, rate limiting, database controls, filesystem controls and
deployment security should work together.
3. SECURITY SCOPE
=================
This policy applies to:
- server.js
- public/index.html
- public/admin.html
- public/assets/js/*
- public/assets/css/*
- data/*
- uploads/*
- PostgreSQL
- Administrative APIs
- Public application APIs
- Authorization endpoints
- PDF generation
- AI integration endpoints
- Environment configuration
- Production deployment infrastructure
- Source-control repositories
- Operational backups
- Logs and audit records
4. SECURITY CLASSIFICATION
==========================
The following information should be treated as sensitive unless the
deployment explicitly determines otherwise.
HIGH SENSITIVITY
----------------
- Applicant personal information
- Uploaded identity documents
- Uploaded resumes
- Uploaded supporting documents
- Database credentials
- Administrator credentials
- Administrator session tokens
- AI API credentials
- Session secrets
- Production configuration secrets
MEDIUM SENSITIVITY
------------------
- Application IDs
- Application status information
- Audit metadata
- Authorization-request identifiers
- Internal API information
- Operational logs
LOWER SENSITIVITY
-----------------
- Public frontend assets
- Public documentation
- General project metadata
Sensitivity classification should be reviewed by the organization operating
the deployment.
5. THREAT MODEL
===============
The deployment should consider threats including:
- Credential theft
- Brute-force authentication attempts
- Session theft
- Unauthorized administrative access
- Broken authorization
- IDOR-style resource access
- Path traversal
- Malicious file uploads
- File-type spoofing
- Oversized uploads
- Automated application submission
- API abuse
- Cross-origin abuse
- Injection attacks
- Database compromise
- Secret leakage
- Dependency vulnerabilities
- Log tampering
- Backup exposure
- Server misconfiguration
- Supply-chain compromise
- Accidental disclosure
- Denial-of-service conditions
- Insider misuse
- Compromised administrator accounts
6. TRUST BOUNDARIES
===================
The system contains several trust boundaries.
PUBLIC CLIENT
-------------
The browser is an untrusted environment.
Never trust:
- Browser validation
- Client-side permissions
- Client-provided application IDs
- Client-provided filenames
- Client-provided MIME types
- Client-provided status values
- Client-provided authorization claims
- Client-side configuration
- Client-side authentication state
SERVER
------
The server is responsible for validating requests and enforcing access
controls.
DATABASE
--------
Database access must be restricted to the server-side application and
authorized operational personnel.
FILESYSTEM
----------
Uploaded documents must be treated as untrusted data.
EXTERNAL AI PROVIDER
--------------------
If AI integration is enabled, the external provider is an additional
processing boundary. Sensitive information must only be transmitted when
legally and operationally appropriate.
7. AUTHENTICATION
=================
Administrative authentication must be enforced server-side.
The current architecture uses:
- Administrator token verification
- Signed administrator sessions
- Session expiration
- Timing-safe comparison for the initial administrator token
- Protected administrative endpoints
Administrative credentials must:
- Be sufficiently long
- Be randomly generated
- Never be hard-coded
- Never be placed in frontend JavaScript
- Never be placed in HTML
- Never be committed to Git
- Be rotated when compromise is suspected
8. SESSION SECURITY
===================
Administrator sessions must be:
- Cryptographically signed
- Time-limited
- Verified on every protected request
- Rejected when expired
- Rejected when invalid
- Rejected when the required administrator role is absent
SESSION_SECRET must be generated using a cryptographically secure random
source.
A production secret should not be reused across environments.
Separate secrets should be used for:
- Development
- Testing
- Staging
- Production
9. AUTHORIZATION
================
Authentication determines who is making a request.
Authorization determines what that authenticated party is permitted to do.
Every protected endpoint must enforce authorization independently.
Do not assume that because a user is authenticated they are automatically
authorized to access every application or file.
Resource access should verify:
- Valid authentication
- Appropriate role
- Valid resource identifier
- Valid resource ownership or administrative authorization
- Current authorization state
- Resource existence
10. APPLICATION ACCESS
======================
Application records may contain sensitive personal information.
Administrative endpoints must not expose application information to
unauthenticated clients.
Application lookup must not rely solely on predictable identifiers.
The server should verify the requested application against the authenticated
administrative session before returning information.
11. FILE SECURITY
=================
All uploaded files must be considered untrusted.
The application should maintain strict controls over:
- File size
- MIME type
- Extension
- Storage location
- File naming
- File access
- File retention
Uploaded files must not retain their original filenames as server-side
storage filenames.
Server-side generated filenames should be unpredictable.
Original filenames may be retained as metadata for administrative display.
12. FILE TYPE VALIDATION
========================
MIME type validation is useful but must not be treated as a complete security
boundary.
For higher-security deployments, uploaded content should additionally be
validated by inspecting the actual file signature or magic bytes.
Where appropriate, production deployments should use malware or antivirus
scanning before making uploaded files available to administrators.
13. FILE STORAGE
================
Uploaded files are stored under:
uploads/
├── photos/
├── documents/
└── resumes/
These directories must not be exposed through unrestricted static file
serving.
Files should only be returned through an authenticated and authorized
server-side endpoint.
Filesystem permissions should prevent unauthorized operating-system users
from modifying application uploads.
14. PATH TRAVERSAL PROTECTION
============================
User-controlled filenames and paths must never be concatenated directly into
filesystem paths without validation.
The application should:
- Generate server-side filenames
- Resolve paths before access
- Restrict resolved paths to approved storage directories
- Reject paths escaping the intended directory
- Never execute uploaded files
The current backend includes an explicit directory-containment check before
protected file access.
15. REQUEST VALIDATION
======================
All server-side input must be treated as untrusted.
Validation should cover:
- Request body
- Query parameters
- Route parameters
- Headers
- Uploaded files
- JSON data
- Status values
- Authorization request types
Client-side validation improves usability but must never replace server-side
validation.
16. JSON SECURITY
=================
JSON submitted by clients must be parsed defensively.
The server must not assume that:
- JSON fields exist
- JSON fields have the expected type
- JSON objects contain only approved properties
- JSON values are safe for display
When displaying stored values, the frontend must use safe DOM APIs or
appropriate output encoding rather than inserting untrusted content as raw
HTML.
17. DATABASE SECURITY
=====================
PostgreSQL must be treated as a protected internal service.
Production database deployments should use:
- Dedicated application credentials
- Strong passwords
- Restricted network access
- TLS where appropriate
- Least-privilege database roles
- Regular backups
- Backup encryption where appropriate
- Monitoring
- Security updates
SQL statements should use parameterized queries.
Application code must never construct SQL statements by directly concatenating
untrusted request values.
18. DATABASE AVAILABILITY
=========================
Database failures must not cause sensitive information to be exposed.
The application should return controlled error responses rather than database
connection strings, SQL statements, stack traces or internal configuration.
19. CORS
========
CORS must be restricted in production.
ALLOWED_ORIGINS should contain only trusted application origins.
Example:
ALLOWED_ORIGINS=https://example.com
Avoid permissive production configurations that allow arbitrary websites to
make browser requests to protected APIs.
20. CSRF CONSIDERATIONS
=======================
If authentication is changed to cookie-based sessions in the future, the
application must implement appropriate CSRF protection.
Recommended controls include:
- SameSite cookies
- CSRF tokens where appropriate
- Origin validation
- Secure cookies
- HttpOnly cookies
The security model must be reviewed whenever the authentication mechanism is
changed.
21. RATE LIMITING
=================
Rate limiting should remain enabled for sensitive public endpoints.
The current application applies rate limiting to areas including:
- Administrator login
- Application submission
- Public authorization requests
Production limits should be reviewed against expected legitimate traffic.
Rate limiting should not be considered a substitute for authentication or
authorization.
22. SECURITY HEADERS
====================
The application currently provides several security-related headers,
including:
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
Production deployments should additionally evaluate:
- Content-Security-Policy
- Strict-Transport-Security
- Cross-Origin-Opener-Policy
- Cross-Origin-Resource-Policy
Security headers must be tested against the actual frontend before deployment.
23. HTTPS
=========
Production deployments must use HTTPS.
Plain HTTP should not be used for:
- Administrator authentication
- Application submission
- File upload
- Protected API requests
- Authorization workflows
TLS certificates should be monitored and renewed before expiration.
24. SECRETS MANAGEMENT
=====================
The following must be treated as secrets where applicable:
- ADMIN_TOKEN
- SESSION_SECRET
- DATABASE_URL credentials
- AI_API_KEY
- TLS private keys
- Backup credentials
- Infrastructure credentials
Secrets must not appear in:
- Source code
- README files
- Screenshots
- Public issue reports
- Public logs
- Browser developer tools
- Frontend configuration
- Git history
If a secret is exposed, assume it is compromised and rotate it.
25. ENVIRONMENT SEPARATION
==========================
Development, testing and production environments should be separated.
Do not use production:
- Database credentials
- API keys
- Applicant records
- Uploads
- Administrator credentials
in development environments.
26. LOGGING
===========
Logs should support operational investigation without becoming a source of
sensitive-data leakage.
Do not log:
- Passwords
- Authentication tokens
- API keys
- Session secrets
- Full identity documents
- Full applicant records unless specifically required and appropriately
  protected
Audit records should contain enough information to establish what happened
without unnecessarily duplicating sensitive information.
27. AUDIT LOG INTEGRITY
=======================
Audit logs are security-sensitive records.
Production deployments should restrict:
- Write access
- Read access
- Administrative modification
- Deletion
Where stronger assurance is required, audit logs should be exported to a
separate protected logging system.
28. AUTHORIZATION REQUEST SECURITY
=================================
Authorization requests are time-limited.
The system should verify:
- Request existence
- Current request status
- Expiration time
- Associated application
- Intended authorization type
Expired requests must not provide access.
An approved authorization should not be treated as permanent authorization.
29. PDF GENERATION
==================
Generated application PDFs may contain sensitive information.
PDF files should:
- Be generated server-side
- Require appropriate authorization
- Not be stored in public directories unless intentionally designed for public
  access
- Avoid unnecessary sensitive metadata
- Be protected during transmission
Generated PDFs should be treated with the same confidentiality requirements
as the original application record.
30. AI SECURITY
===============
The AI integration is optional.
If enabled:
- API keys must remain server-side.
- AI requests must require administrator authorization.
- Sensitive information should be minimized before transmission.
- External-provider data handling must be reviewed.
- AI output must not automatically be treated as authoritative.
- AI-generated conclusions should be reviewed by an appropriately authorized
  human where decisions have material consequences.
- Provider retention and training policies should be reviewed before sending
  sensitive information.
31. AI PROMPT SECURITY
=====================
Administrative AI endpoints should treat submitted AI input as untrusted.
The system should guard against:
- Prompt injection
- Instruction override
- Data exfiltration attempts
- Malicious embedded content
- Requests for secrets
- Attempts to bypass administrative controls
AI output should never be allowed to directly execute server-side commands,
modify database records or change authorization state without an explicit,
properly authorized application workflow.
32. DEPENDENCY SECURITY
=======================
Third-party dependencies represent part of the application's attack surface.
Maintain:
- package-lock.json where appropriate
- Regular dependency updates
- Vulnerability reviews
- Removal of unnecessary packages
Recommended checks include:
npm audit
Dependency updates should be tested before production deployment.
33. NODE.JS SECURITY
====================
The application should run on a supported Node.js release.
Production environments should:
- Apply security patches
- Restrict filesystem permissions
- Run the application with a dedicated operating-system account where
  practical
- Avoid unnecessary privileges
- Restrict network exposure
- Monitor process health
34. ERROR HANDLING
==================
Production error responses should reveal only information necessary for the
client to understand the result.
Do not expose:
- Stack traces
- Internal filesystem paths
- Database connection details
- Environment variables
- SQL statements
- Secret values
- Internal infrastructure details
35. ADMINISTRATOR HARDENING
===========================
Administrators should:
- Use unique credentials
- Avoid sharing administrator accounts
- Use secure devices
- Keep browsers updated
- Avoid accessing administrative interfaces over public unsecured networks
- Sign out after administrative work
- Report suspected account compromise immediately
36. BACKUP SECURITY
===================
Backups may contain the same sensitive information as the production
database.
Backups should therefore be:
- Encrypted
- Access-controlled
- Monitored
- Tested for restoration
- Protected from unauthorized deletion
- Retained according to organizational requirements
Backup credentials must not be stored in source control.
37. DATA RETENTION
==================
The organization operating the application must define retention periods for:
- Application records
- Uploaded documents
- Audit logs
- Authorization records
- Backups
- Generated PDFs
Data should not be retained indefinitely without a documented reason.
38. SECURE DELETION
===================
When data reaches the end of its approved retention period, deletion should
be performed according to the organization's applicable legal, technical and
operational requirements.
Backup copies must also be considered when establishing deletion procedures.
39. INCIDENT RESPONSE
=====================
A suspected security incident should be handled through a documented process.
Recommended sequence:
1. Detect the incident.
2. Confirm the event.
3. Contain affected systems.
4. Preserve relevant evidence.
5. Rotate compromised credentials.
6. Investigate the scope.
7. Restore secure operation.
8. Review affected data.
9. Notify appropriate parties where required.
10. Document lessons learned.
11. Implement corrective controls.
40. CREDENTIAL COMPROMISE
=========================
If an administrator token, session secret, database password or API key is
exposed:
1. Immediately revoke or rotate the credential.
2. Review relevant access logs.
3. Determine the exposure window.
4. Investigate unauthorized activity.
5. Replace the credential with a newly generated value.
6. Remove the exposed credential from active configuration.
7. Review repository history if the secret was committed.
8. Document the incident.
41. SOURCE CONTROL SECURITY
===========================
The following should normally never be committed:
.env
uploads/
logs/
node_modules/
private/generated/
data/generated/
The repository should also be reviewed for accidental secrets before public
publication.
A secret removed from the latest commit may remain present in Git history.
Credential rotation is therefore required if a secret has been committed.
42. SECURE DEVELOPMENT
======================
Development changes should consider:
- Authentication
- Authorization
- Input validation
- Output encoding
- File handling
- Database queries
- Error handling
- Logging
- Dependency changes
- Configuration changes
Security-sensitive changes should be reviewed before production deployment.
43. TESTING
===========
Security testing should use synthetic or test data whenever possible.
Recommended tests include:
- Authentication bypass testing
- Authorization testing
- Session expiration testing
- Rate-limit testing
- File upload testing
- Malicious filename testing
- Path traversal testing
- MIME-type spoofing testing
- Oversized file testing
- Invalid JSON testing
- SQL injection testing
- XSS testing
- CORS testing
- API enumeration testing
- Authorization expiration testing
- Error disclosure testing
44. PRODUCTION CHECKLIST
========================
Before production deployment:
[ ] NODE_ENV is set to production.
[ ] HTTPS is enabled.
[ ] PostgreSQL is production-ready.
[ ] Database credentials are stored securely.
[ ] ADMIN_TOKEN is strong and unique.
[ ] SESSION_SECRET is strong and unique.
[ ] AI_API_KEY is not exposed to the browser.
[ ] ALLOWED_ORIGINS contains only trusted origins.
[ ] Upload directories are not publicly exposed.
[ ] Rate limiting is enabled.
[ ] Security headers are enabled.
[ ] Administrator authentication has been tested.
[ ] Application submission has been tested.
[ ] File uploads have been tested.
[ ] Protected file access has been tested.
[ ] Authorization expiration has been tested.
[ ] PDF generation has been tested.
[ ] Audit logging has been tested.
[ ] Database backups are configured.
[ ] Backup restoration has been tested.
[ ] Secrets are not present in Git.
[ ] Dependencies have been reviewed.
[ ] Production error responses do not expose internals.
[ ] Monitoring and logging are configured.
45. VULNERABILITY REPORTING
===========================
Security vulnerabilities should be reported privately rather than publicly.
A report should include:
- Vulnerability title
- Affected component
- Affected endpoint or file
- Reproduction steps
- Expected behavior
- Actual behavior
- Security impact
- Relevant logs or screenshots with sensitive information removed
- Suggested mitigation if available
46. RESPONSIBLE DISCLOSURE
==========================
Security researchers should avoid:
- Accessing real applicant records
- Downloading private documents
- Modifying production records
- Deleting production information
- Disrupting availability
- Performing denial-of-service attacks
- Social engineering staff
- Testing stolen credentials
- Publicly exposing personal information
- Publishing secrets
Use authorized test environments whenever available.
47. SECURITY CONTACT
====================
Security reports should be submitted through the private security contact
designated by the project maintainer.
A dedicated security contact address may be added to this document when the
project establishes one.
Do not publish sensitive vulnerability details in public issue trackers.
48. SECURITY POLICY MAINTENANCE
===============================
This document should be reviewed whenever significant changes are made to:
- Authentication
- Authorization
- Database architecture
- File storage
- API architecture
- AI integration
- Deployment infrastructure
- Dependency stack
- Data-retention practices
Security documentation should remain consistent with the actual application
implementation.
49. IMPORTANT IMPLEMENTATION PRINCIPLE
======================================
Documentation does not create a security control.
A control described in this document should only be considered implemented
when it is enforced by the application, infrastructure or operational
process.
For example:
- Documenting HTTPS does not enable HTTPS.
- Documenting malware scanning does not provide malware scanning.
- Documenting MFA does not provide MFA.
- Documenting encryption does not encrypt data.
- Documenting backups does not create backups.
Production operators are responsible for verifying each security control.
50. SECURITY BASELINE
=====================
The minimum recommended production baseline is:
- HTTPS
- Strong administrator authentication
- Strong session secret
- Restricted CORS
- Server-side authorization
- Parameterized database queries
- Controlled file uploads
- Protected upload storage
- Rate limiting
- Security headers
- Audit logging
- Dependency updates
- Secret management
- Database backups
- Access monitoring
- Incident-response procedures
51. DOCUMENT INFORMATION
========================
Project:
Application Form Management System
File:
SECURITY.md
Policy Version:
2.0
Security Baseline:
Production-Oriented
Last Updated:
2020
Status:
Maintained
END OF SECURITY POLICY
======================
