"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
ADMIN.JS
============================================================

Purpose:
- Administrator login
- Session/token management
- Application listing
- Application details
- Status updates
- File listing/viewing
- PDF generation
- WRT authorization requests
- Audit logs
- AI analysis
- Dashboard statistics

Backend base:
Same-origin /api

No hard-coded administrator credentials.
============================================================
*/

(function () {

  const API_BASE = "/api";

  const STORAGE_KEYS = {
    ADMIN_TOKEN: "application_form_admin_token",
    ADMIN_SESSION: "application_form_admin_session"
  };


  /* ========================================================
     BASIC HELPERS
  ======================================================== */

  function getToken() {

    return (
      localStorage.getItem(
        STORAGE_KEYS.ADMIN_TOKEN
      ) || ""
    );

  }


  function setToken(token) {

    if (!token) {
      return false;
    }

    localStorage.setItem(
      STORAGE_KEYS.ADMIN_TOKEN,
      token
    );

    localStorage.setItem(
      STORAGE_KEYS.ADMIN_SESSION,
      JSON.stringify({
        loggedIn: true,
        loggedInAt: new Date().toISOString()
      })
    );

    return true;

  }


  function clearToken() {

    localStorage.removeItem(
      STORAGE_KEYS.ADMIN_TOKEN
    );

    localStorage.removeItem(
      STORAGE_KEYS.ADMIN_SESSION
    );

  }


  function isLoggedIn() {

    return Boolean(
      getToken()
    );

  }


  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }

    try {

      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

    } catch {

      return String(value);

    }

  }


  function formatFileSize(bytes) {

    const size =
      Number(bytes);

    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB"
    ];

    let index = 0;
    let result = size;

    while (
      result >= 1024 &&
      index < units.length - 1
    ) {

      result /= 1024;
      index++;

    }

    return (
      result.toFixed(
        index === 0 ? 0 : 2
      ) +
      " " +
      units[index]
    );

  }


  function notify(
    message,
    type = "info"
  ) {

    if (
      typeof window.showToast ===
      "function"
    ) {

      window.showToast(
        message,
        type
      );

      return;

    }


    if (
      typeof window.showNotification ===
      "function"
    ) {

      window.showNotification(
        message,
        type
      );

      return;

    }


    console.log(
      `[${type}]`,
      message
    );

  }


  /* ========================================================
     API REQUEST
  ======================================================== */

  async function apiRequest(
    endpoint,
    options = {}
  ) {

    const token =
      getToken();

    const headers = {
      ...(options.headers || {})
    };


    if (
      options.body &&
      !(
        options.body instanceof
        FormData
      )
    ) {

      headers[
        "Content-Type"
      ] =
        "application/json";

    }


    if (token) {

      headers[
        "Authorization"
      ] =
        `Bearer ${token}`;

    }


    let response;


    try {

      response =
        await fetch(
          API_BASE + endpoint,
          {
            ...options,
            headers
          }
        );

    } catch(error) {

      throw new Error(
        "Unable to connect to the application server."
      );

    }


    let data = null;

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";


    if (
      contentType.includes(
        "application/json"
      )
    ) {

      try {

        data =
          await response.json();

      } catch {

        data = null;

      }

    } else {

      try {

        data =
          await response.text();

      } catch {

        data = null;

      }

    }


    if (
      response.status === 401
    ) {

      clearToken();

      document.dispatchEvent(
        new CustomEvent(
          "admin:unauthorized"
        )
      );

    }


    if (!response.ok) {

      const message =
        data?.error ||
        data?.message ||
        `Request failed (${response.status}).`;

      throw new Error(
        message
      );

    }


    return data;

  }


  /* ========================================================
     LOGIN
  ======================================================== */

  async function adminLogin(
    administratorToken
  ) {

    const token =
      String(
        administratorToken || ""
      ).trim();


    if (!token) {

      throw new Error(
        "Administrator token is required."
      );

    }


    const data =
      await apiRequest(
        "/admin/login",
        {
          method: "POST",
          body: JSON.stringify({
            token
          })
        }
      );


    if (
      !data?.success ||
      !data?.token
    ) {

      throw new Error(
        "Administrator login failed."
      );

    }


    setToken(
      data.token
    );


    document.dispatchEvent(
      new CustomEvent(
        "admin:login",
        {
          detail: data
        }
      )
    );


    return data;

  }


  /* ========================================================
     LOGOUT
  ======================================================== */

  async function adminLogout() {

    try {

      if (getToken()) {

        await apiRequest(
          "/admin/logout",
          {
            method: "POST"
          }
        );

      }

    } catch(error) {

      console.warn(
        "Logout request failed:",
        error.message
      );

    } finally {

      clearToken();

      document.dispatchEvent(
        new CustomEvent(
          "admin:logout"
        )
      );

    }

  }


  /* ========================================================
     CHECK SESSION
  ======================================================== */

  async function checkAdminSession() {

    if (!isLoggedIn()) {

      return {
        authenticated: false
      };

    }


    try {

      const data =
        await apiRequest(
          "/admin/applications",
          {
            method: "GET"
          }
        );


      return {
        authenticated: true,
        applications:
          data?.applications || []
      };

    } catch(error) {

      if (
        error.message
          .toLowerCase()
          .includes("session")
      ) {

        clearToken();

      }

      return {
        authenticated: false,
        error: error.message
      };

    }

  }


  /* ========================================================
     APPLICATIONS
  ======================================================== */

  async function getApplications() {

    const data =
      await apiRequest(
        "/admin/applications",
        {
          method: "GET"
        }
      );


    const applications =
      Array.isArray(
        data?.applications
      )
        ? data.applications
        : [];


    document.dispatchEvent(
      new CustomEvent(
        "admin:applications-loaded",
        {
          detail: {
            applications
          }
        }
      )
    );


    return applications;

  }


  async function getApplication(
    applicationId
  ) {

    if (!applicationId) {

      throw new Error(
        "Application ID is required."
      );

    }


    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(
          applicationId
        )}`,
        {
          method: "GET"
        }
      );


    document.dispatchEvent(
      new CustomEvent(
        "admin:application-loaded",
        {
          detail: data
        }
      )
    );


    return data;

  }


  /* ========================================================
     STATUS
  ======================================================== */

  async function updateApplicationStatus(
    applicationId,
    status
  ) {

    if (!applicationId) {

      throw new Error(
        "Application ID is required."
      );

    }


    if (!status) {

      throw new Error(
        "Application status is required."
      );

    }


    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(
          applicationId
        )}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status
          })
        }
      );


    document.dispatchEvent(
      new CustomEvent(
        "admin:status-updated",
        {
          detail: data
        }
      )
    );


    notify(
      "Application status updated.",
      "success"
    );


    return data;

  }


  /* ========================================================
     FILES
  ======================================================== */

  async function getApplicationFiles(
    applicationId
  ) {

    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(
          applicationId
        )}/files`,
        {
          method: "GET"
        }
      );


    return Array.isArray(
      data?.files
    )
      ? data.files
      : [];

  }


  function getFileUrl(
    fileId
  ) {

    return (
      API_BASE +
      `/admin/files/${encodeURIComponent(
        fileId
      )}`
    );

  }


  function openFile(
    fileId
  ) {

    if (!fileId) {

      notify(
        "File ID is required.",
        "error"
      );

      return;

    }


    const token =
      getToken();


    if (!token) {

      notify(
        "Administrator session required.",
        "error"
      );

      return;

    }


    /*
     * Browser navigation cannot safely attach
     * the Authorization header.
     *
     * Fetch the protected file first, then
     * create a temporary object URL.
     */

    fetch(
      getFileUrl(fileId),
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    )
      .then(
        async response => {

          if (!response.ok) {

            let message =
              "Unable to open file.";

            try {

              const data =
                await response.json();

              message =
                data?.error ||
                message;

            } catch {}

            throw new Error(
              message
            );

          }

          return response.blob();

        }
      )
      .then(
        blob => {

          const objectUrl =
            URL.createObjectURL(
              blob
            );


          window.open(
            objectUrl,
            "_blank",
            "noopener,noreferrer"
          );


          setTimeout(
            () => {

              URL.revokeObjectURL(
                objectUrl
              );

            },
            60000
          );

        }
      )
      .catch(
        error => {

          notify(
            error.message,
            "error"
          );

        }
      );

  }


  /* ========================================================
     PDF
  ======================================================== */

  function getPdfUrl(
    applicationId
  ) {

    return (
      API_BASE +
      `/admin/applications/${encodeURIComponent(
        applicationId
      )}/pdf`
    );

  }


  async function openApplicationPdf(
    applicationId
  ) {

    if (!applicationId) {

      throw new Error(
        "Application ID is required."
      );

    }


    const token =
      getToken();


    if (!token) {

      throw new Error(
        "Administrator session required."
      );

    }


    const response =
      await fetch(
        getPdfUrl(
          applicationId
        ),
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!response.ok) {

      let message =
        "Unable to generate PDF.";

      try {

        const data =
          await response.json();

        message =
          data?.error ||
          message;

      } catch {}

      throw new Error(
        message
      );

    }


    const blob =
      await response.blob();


    const objectUrl =
      URL.createObjectURL(
        blob
      );


    window.open(
      objectUrl,
      "_blank",
      "noopener,noreferrer"
    );


    setTimeout(
      () => {

        URL.revokeObjectURL(
          objectUrl
        );

      },
      60000
    );


    return true;

  }


  /* ========================================================
     WRT ACCESS REQUEST
  ======================================================== */

  async function createAccessRequest(
    applicationId,
    type = "wrt"
  ) {

    if (!applicationId) {

      throw new Error(
        "Application ID is required."
      );

    }


    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(
          applicationId
        )}/access-request`,
        {
          method: "POST",
          body: JSON.stringify({
            type
          })
        }
      );


    document.dispatchEvent(
      new CustomEvent(
        "admin:access-request-created",
        {
          detail: data
        }
      )
    );


    return data;

  }


  async function getAccessStatus(
    applicationId
  ) {

    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(
          applicationId
        )}/access-status`,
        {
          method: "GET"
        }
      );


    return data;

  }


  async function approveAccess(
    requestId
  ) {

    const data =
      await apiRequest(
        `/admin/access-requests/${encodeURIComponent(
          requestId
        )}/approve`,
        {
          method: "PATCH"
        }
      );


    return data;

  }


  async function denyAccess(
    requestId
  ) {

    const data =
      await apiRequest(
        `/admin/access-requests/${encodeURIComponent(
          requestId
        )}/deny`,
        {
          method: "PATCH"
        }
      );


    return data;

  }


  /* ========================================================
     AUDIT LOGS
  ======================================================== */

  async function getAuditLogs() {

    const data =
      await apiRequest(
        "/admin/audit-logs",
        {
          method: "GET"
        }
      );


    return Array.isArray(
      data?.logs
    )
      ? data.logs
      : [];

  }


  /* ========================================================
     AI ANALYSIS
  ======================================================== */

  async function analyzeWithAI(
    input
  ) {

    if (
      !input ||
      typeof input !== "string"
    ) {

      throw new Error(
        "AI input is required."
      );

    }


    const data =
      await apiRequest(
        "/admin/ai/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            input
          })
        }
      );


    return data;

  }


  /* ========================================================
     DASHBOARD STATISTICS
  ======================================================== */

  function calculateStatistics(
    applications
  ) {

    const list =
      Array.isArray(
        applications
      )
        ? applications
        : [];


    const statistics = {

      total:
        list.length,

      submitted:
        0,

      underReview:
        0,

      documentsRequired:
        0,

      verified:
        0,

      approved:
        0,

      rejected:
        0,

      withdrawn:
        0

    };


    list.forEach(
      application => {

        const status =
          String(
            application?.status ||
            ""
          ).trim();


        switch(status) {

          case "Submitted":
            statistics.submitted++;
            break;

          case "Under Review":
            statistics.underReview++;
            break;

          case "Documents Required":
            statistics.documentsRequired++;
            break;

          case "Verified":
            statistics.verified++;
            break;

          case "Approved":
            statistics.approved++;
            break;

          case "Rejected":
            statistics.rejected++;
            break;

          case "Withdrawn":
            statistics.withdrawn++;
            break;

          default:
            break;

        }

      }
    );


    return statistics;

  }


  /* ========================================================
     RENDER APPLICATION TABLE
  ======================================================== */

  function renderApplications(
    container,
    applications
  ) {

    if (
      !container
    ) {

      return;

    }


    const list =
      Array.isArray(
        applications
      )
        ? applications
        : [];


    if (list.length === 0) {

      container.innerHTML = `
        <div class="admin-empty-state">
          <p>No applications found.</p>
        </div>
      `;

      return;

    }


    container.innerHTML = `

      <div class="admin-table-wrapper">

        <table class="admin-applications-table">

          <thead>

            <tr>

              <th>Application ID</th>

              <th>Status</th>

              <th>Created</th>

              <th>Updated</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            ${list.map(
              application => {

                return `

                  <tr
                    data-application-id="${escapeHtml(
                      application.id ||
                      application.application_id
                    )}"
                  >

                    <td>
                      <strong>
                        ${escapeHtml(
                          application.application_id
                        )}
                      </strong>
                    </td>

                    <td>

                      <span
                        class="application-status status-${String(
                          application.status || ""
                        )
                          .toLowerCase()
                          .replace(
                            /[^a-z0-9]+/g,
                            "-"
                          )}"
                      >
                        ${escapeHtml(
                          application.status
                        )}
                      </span>

                    </td>

                    <td>
                      ${escapeHtml(
                        formatDate(
                          application.created_at
                        )
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        formatDate(
                          application.updated_at
                        )
                      )}
                    </td>

                    <td>

                      <button
                        type="button"
                        class="admin-view-application"
                        data-id="${escapeHtml(
                          application.id ||
                          application.application_id
                        )}"
                      >
                        View
                      </button>

                    </td>

                  </tr>

                `;

              }
            ).join("")}

          </tbody>

        </table>

      </div>

    `;


    container
      .querySelectorAll(
        ".admin-view-application"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              document.dispatchEvent(
                new CustomEvent(
                  "admin:view-application",
                  {
                    detail: {
                      id:
                        button.dataset.id
                    }
                  }
                )
              );

            }
          );

        }
      );

  }


  /* ========================================================
     RENDER STATISTICS
  ======================================================== */

  function renderStatistics(
    container,
    statistics
  ) {

    if (!container) {
      return;
    }


    const stats =
      statistics ||
      {};


    container.innerHTML = `

      <div class="admin-stat-grid">

        <div class="admin-stat-card">
          <span>Total</span>
          <strong>${Number(
            stats.total || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Submitted</span>
          <strong>${Number(
            stats.submitted || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Under Review</span>
          <strong>${Number(
            stats.underReview || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Documents Required</span>
          <strong>${Number(
            stats.documentsRequired || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Verified</span>
          <strong>${Number(
            stats.verified || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Approved</span>
          <strong>${Number(
            stats.approved || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Rejected</span>
          <strong>${Number(
            stats.rejected || 0
          )}</strong>
        </div>

        <div class="admin-stat-card">
          <span>Withdrawn</span>
          <strong>${Number(
            stats.withdrawn || 0
          )}</strong>
        </div>

      </div>

    `;

  }


  /* ========================================================
     GLOBAL EXPORT
  ======================================================== */

  window.ApplicationAdmin = {

    API_BASE,

    getToken,

    setToken,

    clearToken,

    isLoggedIn,

    adminLogin,

    adminLogout,

    checkAdminSession,

    getApplications,

    getApplication,

    updateApplicationStatus,

    getApplicationFiles,

    getFileUrl,

    openFile,

    getPdfUrl,

    openApplicationPdf,

    createAccessRequest,

    getAccessStatus,

    approveAccess,

    denyAccess,

    getAuditLogs,

    analyzeWithAI,

    calculateStatistics,

    renderApplications,

    renderStatistics,

    formatDate,

    formatFileSize,

    escapeHtml

  };


  /* ========================================================
     OPTIONAL GLOBAL ALIASES
  ======================================================== */

  window.adminLogin =
    adminLogin;

  window.adminLogout =
    adminLogout;

  window.loadApplications =
    getApplications;

  window.loadApplication =
    getApplication;

  window.updateApplicationStatus =
    updateApplicationStatus;

  window.openApplicationFile =
    openFile;

  window.openApplicationPDF =
    openApplicationPdf;


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      document.dispatchEvent(
        new CustomEvent(
          "admin:ready",
          {
            detail: {
              authenticated:
                isLoggedIn()
            }
          }
        )
      );

    }
  );


})();