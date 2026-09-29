"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const PDFDocument = require("pdfkit");

/* =========================================================
   APP CONFIG
========================================================= */

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const NODE_ENV = process.env.NODE_ENV || "development";

const DATABASE_URL = process.env.DATABASE_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_API_URL =
  process.env.AI_API_URL ||
  "https://api.openai.com/v1/chat/completions";

const AI_MODEL =
  process.env.AI_MODEL || "gpt-4o-mini";

const ROOT_DIR = __dirname;

const INDEX_FILE = path.join(ROOT_DIR, "index.html");

const DATA_DIR = path.join(ROOT_DIR, "data");

const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const PHOTOS_DIR = path.join(UPLOADS_DIR, "photos");
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, "documents");
const RESUMES_DIR = path.join(UPLOADS_DIR, "resumes");

/* =========================================================
   DIRECTORIES
========================================================= */

[
  DATA_DIR,
  UPLOADS_DIR,
  PHOTOS_DIR,
  DOCUMENTS_DIR,
  RESUMES_DIR
].forEach((dir) => {
  fs.mkdirSync(dir, {
    recursive: true
  });
});

/* =========================================================
   DATABASE
========================================================= */

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,

      ssl:
        NODE_ENV === "production"
          ? {
              rejectUnauthorized: false
            }
          : false,

      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

/* =========================================================
   EXPRESS
========================================================= */

app.disable("x-powered-by");

if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = new Set([
  "https://application-forms-1-yt65.onrender.com"
]);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Allow same-origin requests and tools such as curl/Postman.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      /*
       * Also allow localhost during development.
       */
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },

    credentials: true
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

/* =========================================================
   SECURITY HEADERS
========================================================= */

app.use((req, res, next) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "SAMEORIGIN"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
});

/* =========================================================
   RATE LIMITERS
========================================================= */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Too many login attempts. Please try again later."
  }
});

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Too many application submissions. Please try again later."
  }
});

const accessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Too many authorization requests. Please try again later."
  }
});

/* =========================================================
   MULTER
========================================================= */

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    if (
      file.fieldname === "photo" ||
      file.fieldname === "photoFile"
    ) {
      return callback(null, PHOTOS_DIR);
    }

    if (
      file.fieldname === "resume" ||
      file.fieldname === "resumeFile"
    ) {
      return callback(null, RESUMES_DIR);
    }

    return callback(null, DOCUMENTS_DIR);
  },

  filename(req, file, callback) {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const randomName = crypto
      .randomBytes(18)
      .toString("hex");

    callback(
      null,
      `${Date.now()}-${randomName}${extension}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  },

  fileFilter(req, file, callback) {
    if (allowedMimeTypes.has(file.mimetype)) {
      return callback(null, true);
    }

    return callback(
      new Error("Unsupported file type.")
    );
  }
});

const applicationUpload = upload.fields([
  {
    name: "photo",
    maxCount: 1
  },

  {
    name: "photoFile",
    maxCount: 1
  },

  {
    name: "resume",
    maxCount: 1
  },

  {
    name: "resumeFile",
    maxCount: 1
  },

  {
    name: "documents",
    maxCount: 15
  },

  {
    name: "files",
    maxCount: 15
  }
]);

/* =========================================================
   HELPERS
========================================================= */

function generateApplicationId() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `APP-${timestamp}-${random}`;
}

function safeJsonParse(value) {
  if (
    value &&
    typeof value === "object"
  ) {
    return value;
  }

  if (
    typeof value !== "string"
  ) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
}

function getUploadedFiles(files) {
  if (!files) {
    return [];
  }

  return Object.values(files)
    .flat()
    .map((file) => {
      let category = "document";

      if (
        file.fieldname === "photo" ||
        file.fieldname === "photoFile"
      ) {
        category = "photo";
      }

      if (
        file.fieldname === "resume" ||
        file.fieldname === "resumeFile"
      ) {
        category = "resume";
      }

      return {
        file,
        category
      };
    });
}

function cleanupUploadedFiles(files) {
  if (!files) {
    return;
  }

  for (
    const file of Object.values(files).flat()
  ) {
    try {
      if (
        file &&
        file.path &&
        fs.existsSync(file.path)
      ) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(
        "File cleanup error:",
        error.message
      );
    }
  }
}

function sanitizeFilename(filename) {
  return String(filename || "file")
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
}

function isInsideDirectory(
  filePath,
  directory
) {
  const resolvedFile = path.resolve(filePath);
  const resolvedDirectory = path.resolve(directory);

  const relative = path.relative(
    resolvedDirectory,
    resolvedFile
  );

  return (
    relative !== "" &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}

/* =========================================================
   AUTH
========================================================= */

function createAdminSession() {
  if (!SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      role: "admin"
    },
    SESSION_SECRET,
    {
      expiresIn: "8h"
    }
  );
}

function requireAdmin(req, res, next) {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      error:
        "Administrator authentication required."
    });
  }

  const token =
    authorization.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      error:
        "Administrator authentication required."
    });
  }

  try {
    if (!SESSION_SECRET) {
      throw new Error(
        "SESSION_SECRET missing."
      );
    }

    const decoded = jwt.verify(
      token,
      SESSION_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        error:
          "Administrator access required."
      });
    }

    req.admin = decoded;

    next();
  } catch {
    return res.status(401).json({
      error:
        "Administrator session is invalid or expired."
    });
  }
}

/* =========================================================
   AUDIT LOG
========================================================= */

async function writeAuditLog(
  action,
  applicationId = null,
  metadata = {}
) {
  if (!pool) {
    return;
  }

  try {
    await pool.query(
      `
      INSERT INTO audit_logs
      (
        id,
        action,
        application_id,
        metadata
      )
      VALUES
      ($1, $2, $3, $4)
      `,
      [
        crypto.randomUUID(),
        action,
        applicationId,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (error) {
    console.error(
      "Audit log error:",
      error.message
    );
  }
}

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {
  if (!pool) {
    console.warn(
      "DATABASE_URL is not configured."
    );

    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY,
      application_id VARCHAR(60) UNIQUE NOT NULL,
      applicant_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS application_files (
      id UUID PRIMARY KEY,

      application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      relative_path TEXT NOT NULL,
      mime_type VARCHAR(150),
      category VARCHAR(50),
      file_size BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS access_requests (
      id UUID PRIMARY KEY,

      application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

      type VARCHAR(50) NOT NULL DEFAULT 'wrt',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      application_id UUID,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_applications_created_at
    ON applications(created_at DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_application_files_application
    ON application_files(application_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_access_requests_application
    ON access_requests(application_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_audit_logs_created_at
    ON audit_logs(created_at DESC);
  `);

  console.log(
    "PostgreSQL database initialized."
  );
}

/* =========================================================
   API HEALTH
========================================================= */

app.get(
  "/api/health",
  async (req, res) => {
    let database = "unavailable";

    if (pool) {
      try {
        await pool.query("SELECT 1");
        database = "connected";
      } catch (error) {
        console.error(
          "Database health error:",
          error.message
        );

        database = "error";
      }
    }

    return res.json({
      success: true,
      status: "ok",
      service: "application-form",
      database,
      environment: NODE_ENV,
      ai: Boolean(AI_API_KEY),
      timestamp: new Date().toISOString()
    });
  }
);

/* =========================================================
   API ROOT
========================================================= */

app.get(
  "/api",
  (req, res) => {
    res.json({
      success: true,
      service: "application-form",
      message: "Application Form API is running.",
      endpoints: {
        health: "/api/health",
        login: "/api/admin/login",
        applications: "/api/applications"
      }
    });
  }
);

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
  "/api/admin/login",
  loginLimiter,
  async (req, res) => {
    try {
      if (!ADMIN_TOKEN) {
        return res.status(500).json({
          error:
            "ADMIN_TOKEN is not configured on the server."
        });
      }

      if (!SESSION_SECRET) {
        return res.status(500).json({
          error:
            "SESSION_SECRET is not configured on the server."
        });
      }

      const suppliedToken =
        typeof req.body?.token === "string"
          ? req.body.token.trim()
          : "";

      if (!suppliedToken) {
        return res.status(400).json({
          error:
            "Administrator token is required."
        });
      }

      const supplied = Buffer.from(
        suppliedToken,
        "utf8"
      );

      const expected = Buffer.from(
        ADMIN_TOKEN,
        "utf8"
      );

      const valid =
        supplied.length === expected.length &&
        crypto.timingSafeEqual(
          supplied,
          expected
        );

      if (!valid) {
        await writeAuditLog(
          "admin_login_failed"
        );

        return res.status(401).json({
          error:
            "Invalid administrator token."
        });
      }

      const sessionToken =
        createAdminSession();

      await writeAuditLog(
        "admin_login_success"
      );

      return res.json({
        success: true,
        token: sessionToken,
        expiresIn: "8h"
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to authenticate administrator."
      });
    }
  }
);

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
  "/api/admin/logout",
  requireAdmin,
  async (req, res) => {
    await writeAuditLog(
      "admin_logout"
    );

    return res.json({
      success: true
    });
  }
);

/* =========================================================
   SUBMIT APPLICATION
========================================================= */

app.post(
  "/api/applications",
  applicationLimiter,
  applicationUpload,
  async (req, res) => {
    if (!pool) {
      cleanupUploadedFiles(req.files);

      return res.status(503).json({
        error:
          "Database is not configured."
      });
    }

    const client = await pool.connect();

    try {
      const applicantData =
        safeJsonParse(
          req.body?.data ||
          req.body?.applicationData ||
          "{}"
        );

      const ordinaryFields = {
        ...req.body
      };

      delete ordinaryFields.data;
      delete ordinaryFields.applicationData;

      const combinedData = {
        ...ordinaryFields,
        ...(applicantData &&
        typeof applicantData === "object"
          ? applicantData
          : {})
      };

      const applicationUUID =
        crypto.randomUUID();

      const applicationId =
        generateApplicationId();

      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO applications
        (
          id,
          application_id,
          applicant_data,
          status
        )
        VALUES
        ($1, $2, $3, 'Submitted')
        `,
        [
          applicationUUID,
          applicationId,
          JSON.stringify(combinedData)
        ]
      );

      const uploaded =
        getUploadedFiles(req.files);

      const savedFiles = [];

      for (const item of uploaded) {
        const file = item.file;

        const relativePath =
          path.relative(
            ROOT_DIR,
            file.path
          );

        const fileUUID =
          crypto.randomUUID();

        await client.query(
          `
          INSERT INTO application_files
          (
            id,
            application_id,
            original_name,
            stored_name,
            relative_path,
            mime_type,
            category,
            file_size
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          `,
          [
            fileUUID,
            applicationUUID,
            file.originalname,
            file.filename,
            relativePath,
            file.mimetype,
            item.category,
            file.size
          ]
        );

        savedFiles.push({
          id: fileUUID,
          name: file.originalname,
          category: item.category,
          mimeType: file.mimetype,
          size: file.size
        });
      }

      await client.query("COMMIT");

      await writeAuditLog(
        "application_submitted",
        applicationUUID,
        {
          applicationId
        }
      );

      return res.status(201).json({
        success: true,
        applicationId,
        id: applicationUUID,
        status: "Submitted",
        files: savedFiles,
        message:
          "Application submitted successfully."
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}

      cleanupUploadedFiles(req.files);

      console.error(
        "Application submission error:",
        error
      );

      return res.status(500).json({
        error:
          "Application submission failed."
      });
    } finally {
      client.release();
    }
  }
);

/*
 * Compatibility endpoint.
 * If your existing frontend uses /api/applications/submit,
 * it will now work too.
 */
app.post(
  "/api/applications/submit",
  applicationLimiter,
  applicationUpload,
  async (req, res) => {
    if (!pool) {
      cleanupUploadedFiles(req.files);

      return res.status(503).json({
        error:
          "Database is not configured."
      });
    }

    const client = await pool.connect();

    try {
      const applicantData =
        safeJsonParse(
          req.body?.data ||
          req.body?.applicationData ||
          "{}"
        );

      const ordinaryFields = {
        ...req.body
      };

      delete ordinaryFields.data;
      delete ordinaryFields.applicationData;

      const combinedData = {
        ...ordinaryFields,
        ...(applicantData &&
        typeof applicantData === "object"
          ? applicantData
          : {})
      };

      const applicationUUID =
        crypto.randomUUID();

      const applicationId =
        generateApplicationId();

      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO applications
        (
          id,
          application_id,
          applicant_data,
          status
        )
        VALUES
        ($1, $2, $3, 'Submitted')
        `,
        [
          applicationUUID,
          applicationId,
          JSON.stringify(combinedData)
        ]
      );

      const uploaded =
        getUploadedFiles(req.files);

      const savedFiles = [];

      for (const item of uploaded) {
        const file = item.file;

        const relativePath =
          path.relative(
            ROOT_DIR,
            file.path
          );

        const fileUUID =
          crypto.randomUUID();

        await client.query(
          `
          INSERT INTO application_files
          (
            id,
            application_id,
            original_name,
            stored_name,
            relative_path,
            mime_type,
            category,
            file_size
          )
          VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8)
          `,
          [
            fileUUID,
            applicationUUID,
            file.originalname,
            file.filename,
            relativePath,
            file.mimetype,
            item.category,
            file.size
          ]
        );

        savedFiles.push({
          id: fileUUID,
          name: file.originalname,
          category: item.category,
          mimeType: file.mimetype,
          size: file.size
        });
      }

      await client.query("COMMIT");

      await writeAuditLog(
        "application_submitted",
        applicationUUID,
        {
          applicationId
        }
      );

      return res.status(201).json({
        success: true,
        applicationId,
        id: applicationUUID,
        status: "Submitted",
        files: savedFiles,
        message:
          "Application submitted successfully."
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}

      cleanupUploadedFiles(req.files);

      console.error(
        "Application submission error:",
        error
      );

      return res.status(500).json({
        error:
          "Application submission failed."
      });
    } finally {
      client.release();
    }
  }
);

/* =========================================================
   ADMIN APPLICATION LIST
========================================================= */

app.get(
  "/api/admin/applications",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(`
          SELECT
            id,
            application_id,
            applicant_data,
            status,
            created_at,
            updated_at
          FROM applications
          ORDER BY created_at DESC
        `);

      return res.json({
        success: true,
        applications: result.rows
      });
    } catch (error) {
      console.error(
        "Application list error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve applications."
      });
    }
  }
);

/* =========================================================
   ADMIN GET APPLICATION
========================================================= */

app.get(
  "/api/admin/applications/:id",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            application_id,
            applicant_data,
            status,
            created_at,
            updated_at
          FROM applications
          WHERE
            id::text = $1
            OR application_id = $1
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Application not found."
        });
      }

      const application =
        result.rows[0];

      const files =
        await pool.query(
          `
          SELECT
            id,
            original_name,
            mime_type,
            category,
            file_size,
            created_at
          FROM application_files
          WHERE application_id = $1
          ORDER BY created_at ASC
          `,
          [application.id]
        );

      await writeAuditLog(
        "application_viewed",
        application.id,
        {
          applicationId:
            application.application_id
        }
      );

      return res.json({
        success: true,
        application,
        files: files.rows
      });
    } catch (error) {
      console.error(
        "Application retrieval error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve application."
      });
    }
  }
);

/* =========================================================
   UPDATE STATUS
========================================================= */

app.patch(
  "/api/admin/applications/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const allowedStatuses = [
        "Submitted",
        "Under Review",
        "Documents Required",
        "Verified",
        "Approved",
        "Rejected",
        "Withdrawn"
      ];

      const status = String(
        req.body?.status || ""
      ).trim();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error:
            "Invalid application status."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE applications
          SET
            status = $1,
            updated_at = NOW()
          WHERE
            id::text = $2
            OR application_id = $2
          RETURNING
            id,
            application_id,
            status,
            updated_at
          `,
          [
            status,
            req.params.id
          ]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Application not found."
        });
      }

      const application =
        result.rows[0];

      await writeAuditLog(
        "application_status_changed",
        application.id,
        {
          status
        }
      );

      return res.json({
        success: true,
        application
      });
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to update application status."
      });
    }
  }
);

/* =========================================================
   APPLICATION FILES
========================================================= */

app.get(
  "/api/admin/applications/:id/files",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            f.id,
            f.original_name,
            f.mime_type,
            f.category,
            f.file_size,
            f.created_at
          FROM application_files f
          INNER JOIN applications a
            ON a.id = f.application_id
          WHERE
            a.id::text = $1
            OR a.application_id = $1
          ORDER BY f.created_at ASC
          `,
          [req.params.id]
        );

      return res.json({
        success: true,
        files: result.rows
      });
    } catch (error) {
      console.error(
        "File list error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve files."
      });
    }
  }
);

/* =========================================================
   VIEW FILE
========================================================= */

app.get(
  "/api/admin/files/:fileId",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            original_name,
            stored_name,
            relative_path,
            mime_type,
            category
          FROM application_files
          WHERE id = $1
          `,
          [req.params.fileId]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "File not found."
        });
      }

      const file = result.rows[0];

      const absolutePath =
        path.resolve(
          ROOT_DIR,
          file.relative_path
        );

      if (
        !isInsideDirectory(
          absolutePath,
          UPLOADS_DIR
        )
      ) {
        return res.status(403).json({
          error:
            "Invalid file path."
        });
      }

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({
          error:
            "Stored file no longer exists."
        });
      }

      res.setHeader(
        "Content-Type",
        file.mime_type ||
          "application/octet-stream"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${sanitizeFilename(
          file.original_name
        )}"`
      );

      await writeAuditLog(
        "file_accessed",
        null,
        {
          fileId: file.id
        }
      );

      return res.sendFile(
        absolutePath
      );
    } catch (error) {
      console.error(
        "File access error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to open file."
      });
    }
  }
);

/* =========================================================
   PDF
========================================================= */

app.get(
  "/api/admin/applications/:id/pdf",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            application_id,
            applicant_data,
            status,
            created_at,
            updated_at
          FROM applications
          WHERE
            id::text = $1
            OR application_id = $1
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Application not found."
        });
      }

      const application =
        result.rows[0];

      const files =
        await pool.query(
          `
          SELECT
            original_name,
            category
          FROM application_files
          WHERE application_id = $1
          ORDER BY created_at ASC
          `,
          [application.id]
        );

      const doc = new PDFDocument({
        margin: 50,
        size: "A4"
      });

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${sanitizeFilename(
          application.application_id
        )}.pdf"`
      );

      doc.pipe(res);

      doc
        .fontSize(20)
        .text(
          "APPLICATION RECORD",
          {
            align: "center"
          }
        );

      doc.moveDown();

      doc
        .fontSize(11)
        .text(
          `Application ID: ${application.application_id}`
        );

      doc.text(
        `Status: ${application.status}`
      );

      doc.text(
        `Submitted: ${new Date(
          application.created_at
        ).toLocaleString("en-IN")}`
      );

      doc.moveDown();

      doc
        .fontSize(14)
        .text(
          "Applicant Information"
        );

      doc.moveDown(0.5);

      doc.fontSize(10);

      const applicantData =
        application.applicant_data || {};

      for (
        const [key, value] of Object.entries(
          applicantData
        )
      ) {
        let printable = "";

        if (
          value !== null &&
          value !== undefined
        ) {
          printable =
            typeof value === "object"
              ? JSON.stringify(value)
              : String(value);
        }

        doc.text(
          `${key}: ${printable}`
        );
      }

      doc.moveDown();

      doc
        .fontSize(14)
        .text("Uploaded Files");

      doc.moveDown(0.5);

      doc.fontSize(10);

      if (!files.rows.length) {
        doc.text(
          "No uploaded files."
        );
      } else {
        for (
          const file of files.rows
        ) {
          doc.text(
            `${file.category}: ${file.original_name}`
          );
        }
      }

      doc.moveDown();

      doc
        .fontSize(8)
        .text(
          "Generated by the Application Form Management System.",
          {
            align: "center"
          }
        );

      doc.end();

      await writeAuditLog(
        "application_pdf_generated",
        application.id,
        {
          applicationId:
            application.application_id
        }
      );
    } catch (error) {
      console.error(
        "PDF generation error:",
        error
      );

      if (!res.headersSent) {
        return res.status(500).json({
          error:
            "Unable to generate application PDF."
        });
      }
    }
  }
);

/* =========================================================
   ACCESS REQUEST
========================================================= */

app.post(
  "/api/admin/applications/:id/access-request",
  requireAdmin,
  accessLimiter,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const type = String(
        req.body?.type || "wrt"
      ).trim();

      const application =
        await pool.query(
          `
          SELECT id, application_id
          FROM applications
          WHERE
            id::text = $1
            OR application_id = $1
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!application.rows.length) {
        return res.status(404).json({
          error:
            "Application not found."
        });
      }

      const row =
        application.rows[0];

      await pool.query(
        `
        UPDATE access_requests
        SET status = 'expired'
        WHERE
          application_id = $1
          AND status = 'pending'
          AND expires_at IS NOT NULL
          AND expires_at < NOW()
        `,
        [row.id]
      );

      const requestId =
        crypto.randomUUID();

      const result =
        await pool.query(
          `
          INSERT INTO access_requests
          (
            id,
            application_id,
            type,
            status,
            expires_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            'pending',
            NOW() + INTERVAL '30 minutes'
          )
          RETURNING
            id,
            application_id,
            type,
            status,
            requested_at,
            expires_at
          `,
          [
            requestId,
            row.id,
            type
          ]
        );

      await writeAuditLog(
        "wrt_access_requested",
        row.id,
        {
          type
        }
      );

      return res.status(201).json({
        success: true,
        request:
          result.rows[0],
        message:
          "Authorization request created."
      });
    } catch (error) {
      console.error(
        "Access request error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to create authorization request."
      });
    }
  }
);

/* =========================================================
   PUBLIC ACCESS STATUS
========================================================= */

app.get(
  "/api/access/:requestId",
  accessLimiter,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            ar.id,
            ar.type,
            ar.status,
            ar.requested_at,
            ar.expires_at,
            a.application_id
          FROM access_requests ar
          INNER JOIN applications a
            ON a.id = ar.application_id
          WHERE ar.id = $1
          LIMIT 1
          `,
          [req.params.requestId]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Authorization request not found."
        });
      }

      const request =
        result.rows[0];

      if (
        request.expires_at &&
        new Date(request.expires_at) <
          new Date() &&
        request.status === "pending"
      ) {
        await pool.query(
          `
          UPDATE access_requests
          SET status = 'expired'
          WHERE id = $1
          `,
          [request.id]
        );

        request.status = "expired";
      }

      return res.json({
        success: true,

        request: {
          id: request.id,
          type: request.type,
          status: request.status,
          applicationId:
            request.application_id,
          requestedAt:
            request.requested_at,
          expiresAt:
            request.expires_at
        }
      });
    } catch (error) {
      console.error(
        "Access lookup error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve authorization request."
      });
    }
  }
);

/* =========================================================
   PUBLIC APPROVE
========================================================= */

app.post(
  "/api/access/:requestId/approve",
  accessLimiter,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET
            status = 'approved',
            approved_at = NOW(),
            expires_at =
              LEAST(
                COALESCE(
                  expires_at,
                  NOW() + INTERVAL '30 minutes'
                ),
                NOW() + INTERVAL '30 minutes'
              )
          WHERE
            id = $1
            AND status = 'pending'
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
          RETURNING
            id,
            application_id,
            type,
            status,
            approved_at,
            expires_at
          `,
          [req.params.requestId]
        );

      if (!result.rows.length) {
        return res.status(400).json({
          error:
            "Request is invalid, expired, or already processed."
        });
      }

      const request =
        result.rows[0];

      await writeAuditLog(
        "wrt_user_approved",
        request.application_id,
        {
          requestId: request.id
        }
      );

      return res.json({
        success: true,
        authorized: true,
        request
      });
    } catch (error) {
      console.error(
        "Approval error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to approve authorization."
      });
    }
  }
);

/* =========================================================
   PUBLIC DENY
========================================================= */

app.post(
  "/api/access/:requestId/deny",
  accessLimiter,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET status = 'denied'
          WHERE
            id = $1
            AND status = 'pending'
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
          RETURNING
            id,
            application_id,
            type,
            status
          `,
          [req.params.requestId]
        );

      if (!result.rows.length) {
        return res.status(400).json({
          error:
            "Request is invalid, expired, or already processed."
        });
      }

      const request =
        result.rows[0];

      await writeAuditLog(
        "wrt_user_denied",
        request.application_id,
        {
          requestId: request.id
        }
      );

      return res.json({
        success: true,
        authorized: false,
        request
      });
    } catch (error) {
      console.error(
        "Denial error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to deny authorization."
      });
    }
  }
);

/* =========================================================
   ADMIN ACCESS STATUS
========================================================= */

app.get(
  "/api/admin/applications/:id/access-status",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const application =
        await pool.query(
          `
          SELECT id
          FROM applications
          WHERE
            id::text = $1
            OR application_id = $1
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!application.rows.length) {
        return res.status(404).json({
          error:
            "Application not found."
        });
      }

      const applicationId =
        application.rows[0].id;

      const result =
        await pool.query(
          `
          SELECT
            id,
            type,
            status,
            requested_at,
            approved_at,
            expires_at
          FROM access_requests
          WHERE application_id = $1
          ORDER BY requested_at DESC
          `,
          [applicationId]
        );

      const requests = result.rows;

      const active =
        requests.find((request) => {
          if (
            request.status !== "approved"
          ) {
            return false;
          }

          if (!request.expires_at) {
            return true;
          }

          return (
            new Date(request.expires_at) >
            new Date()
          );
        });

      return res.json({
        success: true,
        authorized: Boolean(active),
        wrt: Boolean(active),
        requests
      });
    } catch (error) {
      console.error(
        "Access status error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve authorization status."
      });
    }
  }
);

/* =========================================================
   ADMIN APPROVE ACCESS
========================================================= */

app.patch(
  "/api/admin/access-requests/:requestId/approve",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET
            status = 'approved',
            approved_at = NOW(),
            expires_at =
              LEAST(
                COALESCE(
                  expires_at,
                  NOW() + INTERVAL '30 minutes'
                ),
                NOW() + INTERVAL '30 minutes'
              )
          WHERE
            id = $1
            AND status = 'pending'
            AND (
              expires_at IS NULL
              OR expires_at > NOW()
            )
          RETURNING *
          `,
          [req.params.requestId]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Authorization request not found, expired, or already processed."
        });
      }

      const request =
        result.rows[0];

      await writeAuditLog(
        "wrt_admin_approved",
        request.application_id,
        {
          requestId: request.id
        }
      );

      return res.json({
        success: true,
        request
      });
    } catch (error) {
      console.error(
        "Admin approval error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to approve authorization."
      });
    }
  }
);

/* =========================================================
   ADMIN DENY ACCESS
========================================================= */

app.patch(
  "/api/admin/access-requests/:requestId/deny",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET status = 'denied'
          WHERE
            id = $1
            AND status = 'pending'
          RETURNING *
          `,
          [req.params.requestId]
        );

      if (!result.rows.length) {
        return res.status(404).json({
          error:
            "Authorization request not found or already processed."
        });
      }

      const request =
        result.rows[0];

      await writeAuditLog(
        "wrt_admin_denied",
        request.application_id,
        {
          requestId: request.id
        }
      );

      return res.json({
        success: true,
        request
      });
    } catch (error) {
      console.error(
        "Admin denial error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to deny authorization."
      });
    }
  }
);

/* =========================================================
   AUDIT LOGS
========================================================= */

app.get(
  "/api/admin/audit-logs",
  requireAdmin,
  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          error:
            "Database is not configured."
        });
      }

      const result =
        await pool.query(`
          SELECT
            id,
            action,
            application_id,
            metadata,
            created_at
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT 500
        `);

      return res.json({
        success: true,
        logs: result.rows
      });
    } catch (error) {
      console.error(
        "Audit log retrieval error:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve audit logs."
      });
    }
  }
);

/* =========================================================
   AI
========================================================= */

app.post(
  "/api/admin/ai/analyze",
  requireAdmin,
  async (req, res) => {
    try {
      if (!AI_API_KEY) {
        return res.status(503).json({
          error:
            "AI_API_KEY is not configured."
        });
      }

      const input = req.body?.input;

      if (
        !input ||
        typeof input !== "string"
      ) {
        return res.status(400).json({
          error:
            "AI input is required."
        });
      }

      const response = await fetch(
        AI_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${AI_API_KEY}`
          },

          body: JSON.stringify({
            model: AI_MODEL,

            messages: [
              {
                role: "system",
                content:
                  "You are an administrative application-analysis assistant. Analyze supplied application information factually and clearly. Do not invent missing information."
              },

              {
                role: "user",
                content: input
              }
            ],

            temperature: 0.2
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "AI provider error:",
          data
        );

        return res.status(502).json({
          error:
            "AI provider request failed."
        });
      }

      const answer =
        data?.choices?.[0]
          ?.message?.content ||
        data?.output?.[0]
          ?.content?.[0]
          ?.text ||
        "";

      if (!answer) {
        return res.status(502).json({
          error:
            "AI provider returned no usable response."
        });
      }

      await writeAuditLog(
        "ai_analysis_requested",
        null,
        {
          model: AI_MODEL
        }
      );

      return res.json({
        success: true,
        model: AI_MODEL,
        analysis: answer
      });
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      return res.status(500).json({
        error:
          "AI analysis failed."
      });
    }
  }
);

/* =========================================================
   STATIC FILE SECURITY
========================================================= */

app.use((req, res, next) => {
  let pathname;

  try {
    pathname = decodeURIComponent(
      req.path
    );
  } catch {
    return res.status(400).send(
      "Bad Request"
    );
  }

  /*
   * API routes must never fall through
   * to static files.
   */
  if (
    pathname === "/api" ||
    pathname.startsWith("/api/")
  ) {
    return next();
  }

  const blocked = [
    "/server.js",
    "/.env",
    "/data",
    "/uploads",
    "/node_modules",
    "/package.json",
    "/package-lock.json",
    "/yarn.lock",
    "/pnpm-lock.yaml"
  ];

  const isBlocked = blocked.some(
    (item) =>
      pathname === item ||
      pathname.startsWith(item + "/")
  );

  if (isBlocked) {
    return res.status(404).send(
      "Not Found"
    );
  }

  if (pathname.startsWith("/.")) {
    return res.status(404).send(
      "Not Found"
    );
  }

  next();
});

/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(
  express.static(ROOT_DIR, {
    index: false
  })
);

/* =========================================================
   ROOT
========================================================= */

app.get(
  "/",
  (req, res) => {
    if (!fs.existsSync(INDEX_FILE)) {
      return res.status(404).send(
        "index.html not found."
      );
    }

    return res.sendFile(
      INDEX_FILE
    );
  }
);

/* =========================================================
   API 404
========================================================= */

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      error:
        "API endpoint not found.",
      method: req.method,
      path: req.originalUrl
    });
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          error:
            "File exceeds the 10 MB limit."
        });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res.status(400).json({
          error:
            "Too many files uploaded."
        });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          error:
            "Unexpected file field."
        });
      }

      return res.status(400).json({
        error:
          error.message
      });
    }

    if (
      error?.message ===
      "Unsupported file type."
    ) {
      return res.status(400).json({
        error:
          "Unsupported file type."
      });
    }

    return res.status(500).json({
      error:
        "Internal server error."
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    /*
     * Do not crash merely because the database
     * is temporarily unavailable.
     */
    if (pool) {
      try {
        await initializeDatabase();
      } catch (error) {
        console.error(
          "Database initialization failed:",
          error.message
        );

        console.warn(
          "Server will continue running, but database API operations may return errors."
        );
      }
    }

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          "=============================================="
        );

        console.log(
          "Application Form Management System"
        );

        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          `Environment: ${NODE_ENV}`
        );

        console.log(
          `Database configured: ${Boolean(
            DATABASE_URL
          )}`
        );

        console.log(
          `Admin configured: ${Boolean(
            ADMIN_TOKEN
          )}`
        );

        console.log(
          `Session configured: ${Boolean(
            SESSION_SECRET
          )}`
        );

        console.log(
          `AI configured: ${Boolean(
            AI_API_KEY
          )}`
        );

        console.log(
          "Health endpoint: /api/health"
        );

        console.log(
          "API endpoint: /api"
        );

        console.log(
          "=============================================="
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();