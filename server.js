"use strict";

/*
===========================================================
 APPLICATION FORM MANAGEMENT SYSTEM
 Backend / REST API

 Stack:
 - Node.js
 - Express
 - PostgreSQL
 - Multer
 - JWT
 - PDFKit

 Main responsibilities:
 - Application submission
 - PostgreSQL storage
 - File uploads
 - Administrator authentication
 - Protected admin APIs
 - PDF generation
 - WRT / explicit authorization
 - Health checking
===========================================================
*/

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
   CONFIGURATION
========================================================= */

const app = express();

const PORT =
  Number(process.env.PORT) || 10000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

const DATABASE_URL =
  process.env.DATABASE_URL;

const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.randomBytes(48).toString("hex");


/*
 * Render/PostgreSQL normally provides DATABASE_URL.
 */
if (!DATABASE_URL) {

  console.error(
    "ERROR: DATABASE_URL environment variable is missing."
  );

}


/* =========================================================
   DIRECTORIES
========================================================= */

const PUBLIC_DIR =
  path.join(__dirname, "public");

const DATA_DIR =
  path.join(__dirname, "data");

const UPLOADS_DIR =
  path.join(__dirname, "uploads");

const PHOTOS_DIR =
  path.join(UPLOADS_DIR, "photos");

const DOCUMENTS_DIR =
  path.join(UPLOADS_DIR, "documents");

const RESUMES_DIR =
  path.join(UPLOADS_DIR, "resumes");


[
  DATA_DIR,
  UPLOADS_DIR,
  PHOTOS_DIR,
  DOCUMENTS_DIR,
  RESUMES_DIR
].forEach(directory => {

  fs.mkdirSync(
    directory,
    {
      recursive: true
    }
  );

});


/* =========================================================
   DATABASE
========================================================= */

const pool =
  DATABASE_URL
    ? new Pool({
        connectionString:
          DATABASE_URL,

        ssl:
          NODE_ENV === "production"
            ? {
                rejectUnauthorized: false
              }
            : false
      })
    : null;


/* =========================================================
   EXPRESS CONFIGURATION
========================================================= */

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: false
  })
);

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

app.use(
  (req, res, next) => {

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

    next();
  }
);


/* =========================================================
   RATE LIMITERS
========================================================= */

const loginLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      error:
        "Too many login attempts. Please try again later."
    }
  });


const applicationLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
      error:
        "Too many application submissions. Please try again later."
    }
  });


/* =========================================================
   MULTER
========================================================= */

const storage =
  multer.diskStorage({

    destination: (req, file, cb) => {

      const field =
        file.fieldname;

      if (
        field === "photo" ||
        field === "photoFile"
      ) {

        cb(
          null,
          PHOTOS_DIR
        );

        return;
      }


      if (
        field === "resume" ||
        field === "resumeFile"
      ) {

        cb(
          null,
          RESUMES_DIR
        );

        return;
      }


      cb(
        null,
        DOCUMENTS_DIR
      );

    },


    filename: (req, file, cb) => {

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      const randomName =
        crypto.randomBytes(18)
          .toString("hex");

      cb(
        null,
        `${Date.now()}-${randomName}${extension}`
      );

    }

  });


const upload =
  multer({

    storage,

    limits: {

      /*
       * Maximum individual file size:
       * 10 MB
       */
      fileSize:
        10 * 1024 * 1024,

      files: 20
    },


    fileFilter: (
      req,
      file,
      cb
    ) => {

      const allowed =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];


      if (
        allowed.includes(
          file.mimetype
        )
      ) {

        cb(
          null,
          true
        );

      } else {

        cb(
          new Error(
            "Unsupported file type."
          )
        );

      }

    }

  });


/*
 * Application upload fields.
 */
const applicationUpload =
  upload.fields([
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
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

  if (!pool) {

    console.warn(
      "Database initialization skipped because DATABASE_URL is missing."
    );

    return;
  }


  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY,
      application_id VARCHAR(50) UNIQUE NOT NULL,

      applicant_data JSONB NOT NULL DEFAULT '{}'::jsonb,

      status VARCHAR(50)
        NOT NULL DEFAULT 'Submitted',

      created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
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

      created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
    );
  `);


  await pool.query(`
    CREATE TABLE IF NOT EXISTS access_requests (
      id UUID PRIMARY KEY,

      application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

      type VARCHAR(50)
        NOT NULL DEFAULT 'wrt',

      status VARCHAR(50)
        NOT NULL DEFAULT 'pending',

      requested_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

      approved_at TIMESTAMPTZ,

      expires_at TIMESTAMPTZ
    );
  `);


  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,

      action VARCHAR(100) NOT NULL,

      application_id UUID,

      metadata JSONB
        NOT NULL DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
    );
  `);


  console.log(
    "PostgreSQL database initialized."
  );

}


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function generateApplicationId() {

  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    crypto.randomBytes(4)
      .toString("hex")
      .toUpperCase();

  return `APP-${timestamp}-${random}`;

}


function safeJsonParse(value) {

  if (
    typeof value !== "string"
  ) {

    return value || {};

  }

  try {

    return JSON.parse(value);

  } catch {

    return {
      value
    };

  }

}


function getUploadedFiles(files) {

  if (!files) {
    return [];
  }

  return Object.values(files)
    .flat()
    .map(file => {

      let category =
        "document";


      if (
        file.fieldname === "photo" ||
        file.fieldname === "photoFile"
      ) {

        category =
          "photo";

      } else if (
        file.fieldname === "resume" ||
        file.fieldname === "resumeFile"
      ) {

        category =
          "resume";

      }


      return {
        file,
        category
      };

    });

}


/* =========================================================
   AUTHENTICATION
========================================================= */

function createAdminSession() {

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


function requireAdmin(
  req,
  res,
  next
) {

  const authorization =
    req.headers.authorization || "";


  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {

    return res
      .status(401)
      .json({
        error:
          "Administrator authentication required."
      });

  }


  const token =
    authorization.substring(7);


  try {

    const decoded =
      jwt.verify(
        token,
        SESSION_SECRET
      );


    if (
      decoded.role !== "admin"
    ) {

      return res
        .status(403)
        .json({
          error:
            "Administrator access required."
        });

    }


    req.admin =
      decoded;


    next();

  } catch {

    return res
      .status(401)
      .json({
        error:
          "Administrator session is invalid or expired."
      });

  }

}


/* =========================================================
   AUDIT LOGGING
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
        metadata
      ]
    );

  } catch(error) {

    console.error(
      "Audit log error:",
      error.message
    );

  }

}


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  async (req, res) => {

    let database =
      "unavailable";


    if (pool) {

      try {

        await pool.query(
          "SELECT 1"
        );

        database =
          "connected";

      } catch {

        database =
          "error";

      }

    }


    res.json({

      status:
        "ok",

      service:
        "application-form",

      database,

      environment:
        NODE_ENV,

      timestamp:
        new Date().toISOString()

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

        return res
          .status(500)
          .json({
            error:
              "ADMIN_TOKEN is not configured on the server."
          });

      }


      const token =
        typeof req.body?.token ===
        "string"
          ? req.body.token.trim()
          : "";


      if (!token) {

        return res
          .status(400)
          .json({
            error:
              "Administrator token is required."
          });

      }


      const supplied =
        Buffer.from(
          token
        );

      const expected =
        Buffer.from(
          ADMIN_TOKEN
        );


      const valid =
        supplied.length ===
          expected.length &&
        crypto.timingSafeEqual(
          supplied,
          expected
        );


      if (!valid) {

        await writeAuditLog(
          "admin_login_failed"
        );

        return res
          .status(401)
          .json({
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

        success:
          true,

        token:
          sessionToken,

        expiresIn:
          "8h"

      });

    } catch(error) {

      console.error(
        "Admin login error:",
        error
      );

      return res
        .status(500)
        .json({
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

    res.json({
      success:
        true
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

    const client =
      pool
        ? await pool.connect()
        : null;


    try {

      if (!pool) {

        return res
          .status(503)
          .json({
            error:
              "Database is not configured."
          });

      }


      const applicantData =
        safeJsonParse(
          req.body?.data ||
          req.body?.applicationData ||
          "{}"
        );


      /*
       * Also preserve ordinary form fields.
       */
      const ordinaryFields =
        {
          ...req.body
        };


      delete ordinaryFields.data;
      delete ordinaryFields.applicationData;


      const combinedData =
        {
          ...ordinaryFields,
          ...(
            typeof applicantData ===
              "object" &&
            applicantData !== null
              ? applicantData
              : {}
          )
        };


      const applicationUUID =
        crypto.randomUUID();


      const applicationId =
        generateApplicationId();


      await client.query(
        "BEGIN"
      );


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
          combinedData
        ]
      );


      const uploaded =
        getUploadedFiles(
          req.files
        );


      const savedFiles = [];


      for (
        const item of uploaded
      ) {

        const file =
          item.file;


        const relativePath =
          path.relative(
            __dirname,
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

          id:
            fileUUID,

          name:
            file.originalname,

          category:
            item.category,

          mimeType:
            file.mimetype,

          size:
            file.size

        });

      }


      await client.query(
        "COMMIT"
      );


      await writeAuditLog(
        "application_submitted",
        applicationUUID,
        {
          applicationId
        }
      );


      return res
        .status(201)
        .json({

          success:
            true,

          applicationId,

          id:
            applicationUUID,

          status:
            "Submitted",

          files:
            savedFiles,

          message:
            "Application submitted successfully."

        });

    } catch(error) {

      if (client) {

        try {

          await client.query(
            "ROLLBACK"
          );

        } catch {}

      }


      console.error(
        "Application submission error:",
        error
      );


      return res
        .status(500)
        .json({
          error:
            "Application submission failed."
        });

    } finally {

      if (client) {
        client.release();
      }

    }

  }
);


/* =========================================================
   ADMIN — LIST APPLICATIONS
========================================================= */

app.get(
  "/api/admin/applications",
  requireAdmin,

  async (req, res) => {

    try {

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
          ORDER BY created_at DESC
          `
        );


      const applications =
        result.rows;


      return res.json({
        success:
          true,

        applications
      });

    } catch(error) {

      console.error(
        "Application list error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve applications."
        });

    }

  }
);


/* =========================================================
   ADMIN — GET ONE APPLICATION
========================================================= */

app.get(
  "/api/admin/applications/:id",
  requireAdmin,

  async (req, res) => {

    try {

      const identifier =
        req.params.id;


      const application =
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
          [
            identifier
          ]
        );


      if (
        application.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "Application not found."
          });

      }


      const row =
        application.rows[0];


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
          [
            row.id
          ]
        );


      await writeAuditLog(
        "application_viewed",
        row.id,
        {
          applicationId:
            row.application_id
        }
      );


      return res.json({

        success:
          true,

        application:
          row,

        files:
          files.rows

      });

    } catch(error) {

      console.error(
        "Application retrieval error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve application."
        });

    }

  }
);


/* =========================================================
   ADMIN — UPDATE STATUS
========================================================= */

app.patch(
  "/api/admin/applications/:id/status",
  requireAdmin,

  async (req, res) => {

    try {

      const allowedStatuses =
        [
          "Submitted",
          "Under Review",
          "Documents Required",
          "Verified",
          "Approved",
          "Rejected",
          "Withdrawn"
        ];


      const status =
        String(
          req.body?.status || ""
        ).trim();


      if (
        !allowedStatuses.includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({
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


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "Application not found."
          });

      }


      const row =
        result.rows[0];


      await writeAuditLog(
        "application_status_changed",
        row.id,
        {
          status
        }
      );


      return res.json({

        success:
          true,

        application:
          row

      });

    } catch(error) {

      console.error(
        "Status update error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to update application status."
        });

    }

  }
);


/* =========================================================
   ADMIN — LIST FILES
========================================================= */

app.get(
  "/api/admin/applications/:id/files",
  requireAdmin,

  async (req, res) => {

    try {

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
          [
            req.params.id
          ]
        );


      return res.json({

        success:
          true,

        files:
          result.rows

      });

    } catch(error) {

      console.error(
        "File list error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve files."
        });

    }

  }
);


/* =========================================================
   ADMIN — VIEW/DOWNLOAD FILE
========================================================= */

app.get(
  "/api/admin/files/:fileId",
  requireAdmin,

  async (req, res) => {

    try {

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
          [
            req.params.fileId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "File not found."
          });

      }


      const file =
        result.rows[0];


      const absolutePath =
        path.resolve(
          __dirname,
          file.relative_path
        );


      /*
       * Path safety check.
       */
      const uploadsRoot =
        path.resolve(
          UPLOADS_DIR
        );


      if (
        !absolutePath.startsWith(
          uploadsRoot + path.sep
        )
      ) {

        return res
          .status(403)
          .json({
            error:
              "Invalid file path."
          });

      }


      if (
        !fs.existsSync(
          absolutePath
        )
      ) {

        return res
          .status(404)
          .json({
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
        `inline; filename="${encodeURIComponent(file.original_name)}"`
      );


      await writeAuditLog(
        "file_accessed",
        null,
        {
          fileId:
            file.id
        }
      );


      return res.sendFile(
        absolutePath
      );

    } catch(error) {

      console.error(
        "File access error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to open file."
        });

    }

  }
);


/* =========================================================
   ADMIN — GENERATE APPLICATION PDF
========================================================= */

app.get(
  "/api/admin/applications/:id/pdf",
  requireAdmin,

  async (req, res) => {

    try {

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
          [
            req.params.id
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
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
            mime_type,
            category,
            file_size
          FROM application_files
          WHERE application_id = $1
          ORDER BY created_at ASC
          `,
          [
            application.id
          ]
        );


      const doc =
        new PDFDocument({
          margin: 50,
          size: "A4"
        });


      res.setHeader(
        "Content-Type",
        "application/pdf"
      );


      res.setHeader(
        "Content-Disposition",
        `inline; filename="${application.application_id}.pdf"`
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


      const applicantData =
        application.applicant_data || {};


      doc.fontSize(10);


      for (
        const [key, value]
        of Object.entries(
          applicantData
        )
      ) {

        let printable;


        if (
          value === null ||
          value === undefined
        ) {

          printable =
            "";

        } else if (
          typeof value === "object"
        ) {

          printable =
            JSON.stringify(
              value
            );

        } else {

          printable =
            String(value);

        }


        doc.text(
          `${key}: ${printable}`
        );

      }


      doc.moveDown();


      doc
        .fontSize(14)
        .text(
          "Uploaded Files"
        );


      doc.moveDown(0.5);


      doc.fontSize(10);


      if (
        files.rows.length === 0
      ) {

        doc.text(
          "No uploaded files."
        );

      } else {

        files.rows.forEach(
          file => {

            doc.text(
              `${file.category}: ${file.original_name}`
            );

          }
        );

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

    } catch(error) {

      console.error(
        "PDF generation error:",
        error
      );


      if (!res.headersSent) {

        return res
          .status(500)
          .json({
            error:
              "Unable to generate application PDF."
          });

      }

    }

  }
);


/* =========================================================
   WRT — REQUEST EXPLICIT AUTHORIZATION
========================================================= */

app.post(
  "/api/admin/applications/:id/access-request",
  requireAdmin,

  async (req, res) => {

    try {

      const type =
        String(
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
          [
            req.params.id
          ]
        );


      if (
        application.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "Application not found."
          });

      }


      const row =
        application.rows[0];


      /*
       * Expire old pending requests.
       */
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
        [
          row.id
        ]
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


      return res
        .status(201)
        .json({

          success:
            true,

          request:
            result.rows[0],

          message:
            "Authorization request created. User approval is still required."

        });

    } catch(error) {

      console.error(
        "Access request error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to create authorization request."
        });

    }

  }
);


/* =========================================================
   WRT — ACCESS STATUS
========================================================= */

app.get(
  "/api/admin/applications/:id/access-status",
  requireAdmin,

  async (req, res) => {

    try {

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
          [
            req.params.id
          ]
        );


      if (
        application.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
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
          [
            applicationId
          ]
        );


      const requests =
        result.rows;


      const active =
        requests.find(
          request =>
            request.status ===
              "approved" &&
            (
              !request.expires_at ||
              new Date(
                request.expires_at
              ) > new Date()
            )
        );


      return res.json({

        success:
          true,

        authorized:
          Boolean(active),

        wrt:
          Boolean(active),

        requests

      });

    } catch(error) {

      console.error(
        "Access status error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve authorization status."
        });

    }

  }
);


/* =========================================================
   WRT — APPROVE AUTHORIZATION
========================================================= */

app.patch(
  "/api/admin/access-requests/:requestId/approve",
  requireAdmin,

  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET
            status = 'approved',
            approved_at = NOW(),
            expires_at =
              COALESCE(
                expires_at,
                NOW() + INTERVAL '30 minutes'
              )
          WHERE
            id = $1
          RETURNING *
          `,
          [
            req.params.requestId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "Authorization request not found."
          });

      }


      const request =
        result.rows[0];


      await writeAuditLog(
        "wrt_authorization_approved",
        request.application_id,
        {
          requestId:
            request.id
        }
      );


      return res.json({

        success:
          true,

        request

      });

    } catch(error) {

      console.error(
        "Authorization approval error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to approve authorization."
        });

    }

  }
);


/* =========================================================
   WRT — DENY AUTHORIZATION
========================================================= */

app.patch(
  "/api/admin/access-requests/:requestId/deny",
  requireAdmin,

  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          UPDATE access_requests
          SET
            status = 'denied'
          WHERE
            id = $1
          RETURNING *
          `,
          [
            req.params.requestId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({
            error:
              "Authorization request not found."
          });

      }


      const request =
        result.rows[0];


      await writeAuditLog(
        "wrt_authorization_denied",
        request.application_id,
        {
          requestId:
            request.id
        }
      );


      return res.json({

        success:
          true,

        request

      });

    } catch(error) {

      console.error(
        "Authorization denial error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to deny authorization."
        });

    }

  }
);


/* =========================================================
   ADMIN — AUDIT LOGS
========================================================= */

app.get(
  "/api/admin/audit-logs",
  requireAdmin,

  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            action,
            application_id,
            metadata,
            created_at
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT 500
          `
        );


      return res.json({

        success:
          true,

        logs:
          result.rows

      });

    } catch(error) {

      console.error(
        "Audit log retrieval error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to retrieve audit logs."
        });

    }

  }
);


/* =========================================================
   OPTIONAL AI ENDPOINT
========================================================= */

/*
 * AI is intentionally server-side.
 *
 * The frontend must never receive AI_API_KEY.
 *
 * This endpoint is a placeholder integration point.
 * We will connect the actual AI provider later.
 */

app.post(
  "/api/admin/ai/analyze",
  requireAdmin,

  async (req, res) => {

    try {

      if (
        !process.env.AI_API_KEY
      ) {

        return res
          .status(503)
          .json({
            error:
              "AI integration is not configured."
          });

      }


      /*
       * Actual provider integration can be
       * connected here later.
       */

      return res.json({

        success:
          true,

        configured:
          true,

        message:
          "AI integration point is ready."

      });

    } catch(error) {

      console.error(
        "AI endpoint error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "AI request failed."
        });

    }

  }
);


/* =========================================================
   SERVE FRONTEND
========================================================= */

app.use(
  express.static(
    PUBLIC_DIR
  )
);


/*
 * Explicit root route.
 */
app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "index.html"
      )
    );

  }
);


/* =========================================================
   404 API HANDLER
========================================================= */

app.use(
  "/api",
  (req, res) => {

    res
      .status(404)
      .json({
        error:
          "API endpoint not found."
      });

  }
);


/* =========================================================
   MULTER / GENERAL ERROR HANDLER
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

        return res
          .status(400)
          .json({
            error:
              "File exceeds the 10 MB limit."
          });

      }


      return res
        .status(400)
        .json({
          error:
            error.message
        });

    }


    if (
      error?.message ===
      "Unsupported file type."
    ) {

      return res
        .status(400)
        .json({
          error:
            error.message
        });

    }


    return res
      .status(500)
      .json({
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

    await initializeDatabase();


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
          "=============================================="
        );

      }
    );

  } catch(error) {

    console.error(
      "Unable to start server:",
      error
    );

    process.exit(1);

  }

}


startServer();
