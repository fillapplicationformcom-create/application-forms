# Changelog

All notable changes to the Application Form Management System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

—

## [Unreleased]

### Planned
- Additional application workflow controls
- Expanded administrator dashboard
- Improved application search and filtering
- Additional validation rules
- Improved document-management workflows
- Extended audit logging
- Performance improvements
- Additional security hardening
- Improved accessibility and responsive behavior
- Expanded configuration through JSON data files

—

## [1.0.0] - 2020-01-01

### Added

#### Core Application System
- Initial Application Form Management System
- Public application submission interface
- Structured applicant data collection
- Unique application ID generation
- Application status management
- PostgreSQL database integration
- Transaction-based application submission

#### File Management
- Secure multipart file uploads
- Applicant photo uploads
- Document uploads
- Resume uploads
- File size restrictions
- MIME-type validation
- Randomized stored filenames
- Application-to-file database relationships
- File cleanup after failed submissions

#### Administrator System
- Administrator authentication
- JWT-based administrator sessions
- Protected administrator API endpoints
- Application listing
- Individual application retrieval
- Application status updates
- Uploaded-file listing
- Protected file access
- Application PDF generation

#### Authorization Workflow
- Authorization request creation
- Time-limited authorization requests
- Public authorization status lookup
- Authorization approval
- Authorization denial
- Administrator authorization controls
- Expiration handling
- Authorization audit events

#### Security
- CORS configuration
- Security response headers
- Rate limiting
- Protected administrator routes
- Timing-safe administrator-token comparison
- JWT session expiration
- File-path validation
- Filename sanitization
- Upload restrictions
- Audit logging

#### AI Integration
- Administrative AI analysis endpoint
- Configurable AI provider URL
- Configurable AI model
- Server-side AI API authentication
- AI request audit logging
- Graceful handling of unavailable AI configuration

#### Frontend
- Public application form
- Administrator interface
- Responsive layout
- Form validation
- Permission workflow interface
- Application management interface
- Reusable frontend configuration
- JSON-based frontend data configuration

#### Project Structure
- Node.js backend
- Express server
- PostgreSQL database layer
- Public frontend assets
- JSON configuration/data files
- Upload storage directories
- Environment configuration
- Security documentation
- Contribution documentation
- Code of conduct
- MIT licensing

—

## [0.9.0] - 2019-10-01

### Added
- Initial backend architecture
- Basic application submission workflow
- Initial PostgreSQL schema
- Initial file-upload support
- Basic administrator workflow
- Initial frontend form

### Changed
- Improved separation between public and administrative functionality
- Introduced structured project directories

### Security
- Added initial input validation
- Added restricted upload handling
- Added initial administrator authentication

—

## [0.8.0] - 2019-06-01

### Added
- Initial application form prototype
- Basic applicant information fields
- Initial file attachment support
- Initial administrative review concept

—

## [0.1.0] - 2019-01-01

### Added
- Initial project structure
- Initial application-form concept
- Basic frontend prototype

—

## Versioning Policy

This project uses Semantic Versioning:

```text
MAJOR.MINOR.PATCH
