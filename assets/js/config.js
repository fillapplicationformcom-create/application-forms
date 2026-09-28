"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
CONFIGURATION
============================================================

File:
public/assets/js/config.js

Purpose:
- Central frontend configuration
- API endpoint management
- Environment detection
- Application settings
- Upload limits
- Admin/session settings
- WRT settings
- UI configuration

Do not put ADMIN_TOKEN, SESSION_SECRET,
DATABASE_URL, or AI_API_KEY here.

Those belong ONLY on the backend/server environment.
============================================================
*/

(function () {

  const hostname =
    window.location.hostname;

  const protocol =
    window.location.protocol;


  /*
  ==========================================================
  ENVIRONMENT
  ==========================================================
  */

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0";

  const isFileProtocol =
    protocol === "file:";


  const environment =
    isLocalhost || isFileProtocol
      ? "development"
      : "production";


  /*
  ==========================================================
  API BASE URL
  ==========================================================
  */

  /*
   * When frontend and backend are served by the same
   * Express server, relative API paths are preferred.
   *
   * Example:
   * https://your-domain.com/api/health
   */

  const API_BASE_URL =
    isFileProtocol
      ? "http://localhost:10000"
      : "";


  const API_PREFIX =
    "/api";


  /*
  ==========================================================
  API ENDPOINTS
  ==========================================================
  */

  const API = {

    BASE:
      `${API_BASE_URL}${API_PREFIX}`,

    HEALTH:
      `${API_BASE_URL}${API_PREFIX}/health`,


    /*
     * Admin
     */

    ADMIN_LOGIN:
      `${API_BASE_URL}${API_PREFIX}/admin/login`,

    ADMIN_LOGOUT:
      `${API_BASE_URL}${API_PREFIX}/admin/logout`,


    /*
     * Applications
     */

    APPLICATIONS:
      `${API_BASE_URL}${API_PREFIX}/applications`,

    ADMIN_APPLICATIONS:
      `${API_BASE_URL}${API_PREFIX}/admin/applications`,

    ADMIN_AUDIT_LOGS:
      `${API_BASE_URL}${API_PREFIX}/admin/audit-logs`,


    /*
     * WRT / Authorization
     */

    ACCESS:
      `${API_BASE_URL}${API_PREFIX}/access`,

    ADMIN_ACCESS_REQUESTS:
      `${API_BASE_URL}${API_PREFIX}/admin/access-requests`,


    /*
     * AI
     */

    AI_ANALYZE:
      `${API_BASE_URL}${API_PREFIX}/admin/ai/analyze`

  };


  /*
  ==========================================================
  APPLICATION SETTINGS
  ==========================================================
  */

  const APPLICATION = {

    NAME:
      "Application Form Management System",

    VERSION:
      "1.0.0",

    DEFAULT_STATUS:
      "Submitted",

    STATUSES: [

      "Submitted",

      "Under Review",

      "Documents Required",

      "Verified",

      "Approved",

      "Rejected",

      "Withdrawn"

    ]

  };


  /*
  ==========================================================
  UPLOAD SETTINGS
  ==========================================================
  */

  const UPLOAD = {

    MAX_FILE_SIZE:
      10 * 1024 * 1024,

    MAX_FILE_SIZE_MB:
      10,

    MAX_FILES:
      20,

    MAX_DOCUMENTS:
      15,

    MAX_RESUME_FILES:
      1,

    MAX_PHOTO_FILES:
      1,

    ACCEPTED_MIME_TYPES: [

      "image/jpeg",

      "image/png",

      "image/webp",

      "application/pdf",

      "application/msword",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ],

    ACCEPTED_EXTENSIONS: [

      ".jpg",

      ".jpeg",

      ".png",

      ".webp",

      ".pdf",

      ".doc",

      ".docx"

    ]

  };


  /*
  ==========================================================
  SESSION SETTINGS
  ==========================================================
  */

  const SESSION = {

    TOKEN_KEY:
      "application_admin_session",

    ADMIN_KEY:
      "application_admin_authenticated",

    EXPIRES_KEY:
      "application_admin_session_expiry",

    /*
     * Backend JWT currently expires after 8 hours.
     */

    DEFAULT_DURATION:
      8 * 60 * 60 * 1000

  };


  /*
  ==========================================================
  WRT SETTINGS
  ==========================================================
  */

  const WRT = {

    TYPE:
      "wrt",

    REQUEST_EXPIRY_MINUTES:
      30,

    REQUEST_EXPIRY_MS:
      30 * 60 * 1000,

    STATUSES: [

      "pending",

      "approved",

      "denied",

      "expired"

    ]

  };


  /*
  ==========================================================
  SECURITY SETTINGS
  ==========================================================
  */

  const SECURITY = {

    /*
     * Never store backend secrets here.
     */

    SEND_CREDENTIALS:
      false,

    REQUEST_TIMEOUT:
      30000,

    MAX_JSON_SIZE:
      10 * 1024 * 1024

  };


  /*
  ==========================================================
  UI SETTINGS
  ==========================================================
  */

  const UI = {

    LOADING_TEXT:
      "Please wait...",

    SUBMITTING_TEXT:
      "Submitting application...",

    SUCCESS_TEXT:
      "Application submitted successfully.",

    ERROR_TEXT:
      "Something went wrong. Please try again.",

    NETWORK_ERROR:
      "Unable to connect to the server.",

    SESSION_EXPIRED:
      "Your administrator session has expired.",

    DEFAULT_PAGE_SIZE:
      25,

    MAX_PAGE_SIZE:
      100

  };


  /*
  ==========================================================
  STORAGE KEYS
  ==========================================================
  */

  const STORAGE_KEYS = {

    ADMIN_TOKEN:
      SESSION.TOKEN_KEY,

    ADMIN_AUTH:
      SESSION.ADMIN_KEY,

    ADMIN_EXPIRY:
      SESSION.EXPIRES_KEY,

    APPLICATION_DRAFT:
      "application_form_draft",

    APPLICATION_ID:
      "application_id",

    WRT_REQUEST:
      "wrt_request"

  };


  /*
  ==========================================================
  HELPER FUNCTIONS
  ==========================================================
  */

  function getApiUrl(
    endpoint
  ) {

    if (
      !endpoint
    ) {

      return API.BASE;

    }


    if (
      endpoint.startsWith("http://") ||
      endpoint.startsWith("https://")
    ) {

      return endpoint;

    }


    if (
      endpoint.startsWith("/api/")
    ) {

      return `${API_BASE_URL}${endpoint}`;

    }


    if (
      endpoint.startsWith("/")
    ) {

      return `${API_BASE_URL}${endpoint}`;

    }


    return `${API.BASE}/${endpoint}`;

  }


  function getAdminToken() {

    try {

      return localStorage.getItem(
        STORAGE_KEYS.ADMIN_TOKEN
      ) || "";

    } catch {

      return "";

    }

  }


  function setAdminToken(
    token
  ) {

    if (
      typeof token !== "string" ||
      !token.trim()
    ) {

      return false;

    }


    try {

      localStorage.setItem(
        STORAGE_KEYS.ADMIN_TOKEN,
        token.trim()
      );

      localStorage.setItem(
        STORAGE_KEYS.ADMIN_AUTH,
        "true"
      );

      localStorage.setItem(
        STORAGE_KEYS.ADMIN_EXPIRY,
        String(
          Date.now() +
          SESSION.DEFAULT_DURATION
        )
      );

      return true;

    } catch {

      return false;

    }

  }


  function clearAdminSession() {

    try {

      localStorage.removeItem(
        STORAGE_KEYS.ADMIN_TOKEN
      );

      localStorage.removeItem(
        STORAGE_KEYS.ADMIN_AUTH
      );

      localStorage.removeItem(
        STORAGE_KEYS.ADMIN_EXPIRY
      );

    } catch {}

  }


  function isAdminAuthenticated() {

    const token =
      getAdminToken();


    if (!token) {
      return false;
    }


    try {

      const expiry =
        Number(
          localStorage.getItem(
            STORAGE_KEYS.ADMIN_EXPIRY
          ) || 0
        );


      if (
        expiry &&
        Date.now() >= expiry
      ) {

        clearAdminSession();

        return false;

      }


      return true;

    } catch {

      return Boolean(token);

    }

  }


  function getAuthHeaders(
    additionalHeaders = {}
  ) {

    const headers = {
      ...additionalHeaders
    };


    const token =
      getAdminToken();


    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }


    return headers;

  }


  /*
  ==========================================================
  CONFIG OBJECT
  ==========================================================
  */

  const CONFIG = {

    environment,

    isDevelopment:
      environment === "development",

    isProduction:
      environment === "production",

    API,

    APPLICATION,

    UPLOAD,

    SESSION,

    WRT,

    SECURITY,

    UI,

    STORAGE_KEYS,

    getApiUrl,

    getAdminToken,

    setAdminToken,

    clearAdminSession,

    isAdminAuthenticated,

    getAuthHeaders

  };


  /*
  ==========================================================
  GLOBAL EXPORT
  ==========================================================
  */

  window.APPLICATION_CONFIG =
    Object.freeze(
      CONFIG
    );


  /*
  ==========================================================
  COMPATIBILITY ALIASES
  ==========================================================
  */

  window.APP_CONFIG =
    window.APPLICATION_CONFIG;


  /*
  ==========================================================
  DEBUG INFORMATION
  ==========================================================
  */

  if (
    environment === "development"
  ) {

    console.log(
      "[Application Form] Configuration loaded.",
      {
        environment,
        apiBase:
          API.BASE,
        version:
          APPLICATION.VERSION
      }
    );

  }

})();
