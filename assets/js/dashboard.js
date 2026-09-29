"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
DASHBOARD.JS
============================================================

Purpose:
- Wait for administrator authentication
- Load dashboard statistics
- Load applications
- Display recent applications
- Display status breakdown
- Search applications
- Refresh dashboard

IMPORTANT:
This module does NOT start before authentication is ready.
This prevents the login/dashboard blinking loop.
============================================================
*/

(function () {

  const API_BASE = "/api";

  let applications = [];
  let dashboardInitialized = false;
  let authenticationReady = false;
  let authenticated = false;
  let loadingDashboard = false;


  /* ========================================================
     HELPERS
  ======================================================== */

  function getAdmin() {
    return window.ApplicationAdmin || null;
  }


  function getToken() {

    const ADMIN = getAdmin();

    if (
      ADMIN &&
      typeof ADMIN.getToken === "function"
    ) {
      return ADMIN.getToken();
    }

    return (
      localStorage.getItem(
        "application_form_admin_token"
      ) || ""
    );

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });

  }


  function getStatusClass(status) {

    return String(status || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  }


  function findElement(...ids) {

    for (const id of ids) {

      const element =
        document.getElementById(id);

      if (element) {
        return element;
      }

    }

    return null;

  }


  function setText(ids, value) {

    const element =
      findElement(...ids);

    if (element) {
      element.textContent = value;
    }

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


    if (!token) {

      throw new Error(
        "Administrator authentication required."
      );

    }


    const headers = {
      ...(options.headers || {})
    };


    headers.Authorization =
      `Bearer ${token}`;


    if (
      options.body &&
      !(options.body instanceof FormData)
    ) {

      headers["Content-Type"] =
        "application/json";

    }


    const response =
      await fetch(
        `${API_BASE}${endpoint}`,
        {
          ...options,
          headers
        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    if (response.status === 401) {

      authenticated = false;


      const ADMIN =
        getAdmin();


      if (
        ADMIN &&
        typeof ADMIN.clearToken ===
        "function"
      ) {

        ADMIN.clearToken();

      }


      document.dispatchEvent(
        new CustomEvent(
          "admin:unauthorized"
        )
      );


      throw new Error(
        "Administrator session expired."
      );

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        data.message ||
        "Dashboard request failed."
      );

    }


    return data;

  }


  /* ========================================================
     LOAD APPLICATIONS
  ======================================================== */

  async function loadApplications() {

    const result =
      await apiRequest(
        "/admin/applications",
        {
          method: "GET"
        }
      );


    applications =
      Array.isArray(
        result?.applications
      )
        ? result.applications
        : [];


    return applications;

  }


  /* ========================================================
     STATISTICS
  ======================================================== */

  function calculateStatistics(
    list
  ) {

    const statistics = {

      total: list.length,

      submitted: 0,

      underReview: 0,

      documentsRequired: 0,

      verified: 0,

      approved: 0,

      rejected: 0,

      withdrawn: 0

    };


    for (const application of list) {

      const status =
        String(
          application?.status || ""
        ).trim();


      switch (status) {

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

      }

    }


    return statistics;

  }


  /* ========================================================
     STATISTIC CARDS
  ======================================================== */

  function renderStatistics(
    statistics
  ) {

    setText(
      [
        "totalApplications",
        "total-applications",
        "totalCount",
        "applicationCount"
      ],
      statistics.total
    );


    setText(
      [
        "submittedApplications",
        "submitted-applications",
        "submittedCount"
      ],
      statistics.submitted
    );


    setText(
      [
        "underReviewApplications",
        "under-review-applications",
        "underReviewCount"
      ],
      statistics.underReview
    );


    setText(
      [
        "documentsRequiredApplications",
        "documents-required-applications",
        "documentsRequiredCount"
      ],
      statistics.documentsRequired
    );


    setText(
      [
        "verifiedApplications",
        "verified-applications",
        "verifiedCount"
      ],
      statistics.verified
    );


    setText(
      [
        "approvedApplications",
        "approved-applications",
        "approvedCount"
      ],
      statistics.approved
    );


    setText(
      [
        "rejectedApplications",
        "rejected-applications",
        "rejectedCount"
      ],
      statistics.rejected
    );


    setText(
      [
        "withdrawnApplications",
        "withdrawn-applications",
        "withdrawnCount"
      ],
      statistics.withdrawn
    );

  }


  /* ========================================================
     RECENT APPLICATIONS
  ======================================================== */

  function renderRecentApplications(
    list
  ) {

    const container =
      findElement(
        "recentApplications",
        "recent-applications",
        "applicationsList",
        "dashboardApplications"
      );


    if (!container) {
      return;
    }


    const recent =
      list.slice(0, 10);


    if (recent.length === 0) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No applications found</strong>
          <span>Submitted applications will appear here.</span>
        </div>
      `;

      return;

    }


    container.innerHTML =
      recent.map(
        application => {

          const data =
            application.applicant_data || {};


          const name =
            data.name ||
            data.fullName ||
            data.full_name ||
            data.applicantName ||
            "Unnamed Applicant";


          const email =
            data.email ||
            data.emailAddress ||
            "—";


          const status =
            application.status ||
            "Submitted";


          const applicationId =
            application.application_id ||
            application.id ||
            "";


          return `
            <div
              class="application-row"
              data-application-id="${escapeHTML(
                applicationId
              )}"
            >

              <div class="application-main">

                <strong>
                  ${escapeHTML(name)}
                </strong>

                <span>
                  ${escapeHTML(email)}
                </span>

              </div>


              <div class="application-id">
                ${escapeHTML(applicationId)}
              </div>


              <div class="application-status">

                <span
                  class="status-badge status-${escapeHTML(
                    getStatusClass(status)
                  )}"
                >
                  ${escapeHTML(status)}
                </span>

              </div>


              <div class="application-date">
                ${escapeHTML(
                  formatDate(
                    application.created_at
                  )
                )}
              </div>

            </div>
          `;

        }
      )
      .join("");

  }


  /* ========================================================
     STATUS BREAKDOWN
  ======================================================== */

  function renderStatusBreakdown(
    statistics
  ) {

    const container =
      findElement(
        "statusBreakdown",
        "status-breakdown",
        "applicationStatusBreakdown"
      );


    if (!container) {
      return;
    }


    const statuses = [

      {
        name: "Submitted",
        value: statistics.submitted
      },

      {
        name: "Under Review",
        value: statistics.underReview
      },

      {
        name: "Documents Required",
        value: statistics.documentsRequired
      },

      {
        name: "Verified",
        value: statistics.verified
      },

      {
        name: "Approved",
        value: statistics.approved
      },

      {
        name: "Rejected",
        value: statistics.rejected
      },

      {
        name: "Withdrawn",
        value: statistics.withdrawn
      }

    ];


    const total =
      statistics.total || 1;


    container.innerHTML =
      statuses
        .map(item => {

          const percentage =
            Math.round(
              (
                item.value /
                total
              ) * 100
            );


          return `
            <div class="status-breakdown-item">

              <div class="status-breakdown-header">

                <span>
                  ${escapeHTML(item.name)}
                </span>

                <strong>
                  ${item.value}
                </strong>

              </div>


              <div class="status-progress">

                <div
                  class="status-progress-bar"
                  style="width:${percentage}%"
                ></div>

              </div>

            </div>
          `;

        })
        .join("");

  }


  /* ========================================================
     ERROR
  ======================================================== */

  function showDashboardError(
    message
  ) {

    const container =
      findElement(
        "dashboardError",
        "dashboard-error"
      );


    if (!container) {
      return;
    }


    container.hidden = false;

    container.textContent =
      message;

  }


  function hideDashboardError() {

    const container =
      findElement(
        "dashboardError",
        "dashboard-error"
      );


    if (!container) {
      return;
    }


    container.hidden = true;

  }


  /* ========================================================
     LOADING
  ======================================================== */

  function setLoading(
    loading
  ) {

    document
      .querySelectorAll(
        "[data-dashboard-loading]"
      )
      .forEach(element => {

        element.hidden =
          !loading;

      });


    document
      .querySelectorAll(
        "[data-dashboard-content]"
      )
      .forEach(element => {

        element.hidden =
          loading;

      });

  }


  /* ========================================================
     REFRESH DASHBOARD
  ======================================================== */

  async function refreshDashboard() {

    /*
     * Never load dashboard data until
     * authentication has completed.
     */

    if (!authenticationReady) {
      return null;
    }


    if (!authenticated) {
      return null;
    }


    if (loadingDashboard) {
      return null;
    }


    loadingDashboard = true;


    hideDashboardError();

    setLoading(true);


    try {

      const list =
        await loadApplications();


      const statistics =
        calculateStatistics(
          list
        );


      renderStatistics(
        statistics
      );


      renderRecentApplications(
        list
      );


      renderStatusBreakdown(
        statistics
      );


      return {
        applications: list,
        statistics
      };

    } catch(error) {

      console.error(
        "Dashboard loading error:",
        error
      );


      if (
        authenticated
      ) {

        showDashboardError(
          error.message ||
          "Unable to load dashboard."
        );

      }


      return null;

    } finally {

      loadingDashboard = false;

      setLoading(false);

    }

  }


  /* ========================================================
     SEARCH
  ======================================================== */

  function filterApplications(
    searchTerm
  ) {

    const term =
      String(
        searchTerm || ""
      )
      .trim()
      .toLowerCase();


    if (!term) {

      renderRecentApplications(
        applications
      );

      return;

    }


    const filtered =
      applications.filter(
        application => {

          const data =
            application.applicant_data ||
            {};


          const searchable =
            JSON.stringify({
              applicationId:
                application.application_id,

              id:
                application.id,

              status:
                application.status,

              data
            })
            .toLowerCase();


          return searchable.includes(
            term
          );

        }
      );


    renderRecentApplications(
      filtered
    );

  }


  /* ========================================================
     SEARCH EVENTS
  ======================================================== */

  function bindSearch() {

    const searchInput =
      findElement(
        "applicationSearch",
        "application-search",
        "dashboardSearch"
      );


    if (!searchInput) {
      return;
    }


    searchInput.addEventListener(
      "input",
      () => {

        filterApplications(
          searchInput.value
        );

      }
    );

  }


  /* ========================================================
     REFRESH BUTTON
  ======================================================== */

  function bindRefresh() {

    const buttons =
      document.querySelectorAll(
        "[data-dashboard-refresh], #refreshDashboard"
      );


    buttons.forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          if (
            !authenticated
          ) {
            return;
          }


          button.disabled = true;


          try {

            await refreshDashboard();

          } finally {

            button.disabled = false;

          }

        }
      );

    });

  }


  /* ========================================================
     APPLICATION CLICK
  ======================================================== */

  function bindApplicationClicks() {

    document.addEventListener(
      "click",
      event => {

        const row =
          event.target.closest(
            "[data-application-id]"
          );


        if (!row) {
          return;
        }


        const applicationId =
          row.dataset.applicationId;


        if (!applicationId) {
          return;
        }


        if (
          typeof window.openApplication ===
          "function"
        ) {

          window.openApplication(
            applicationId
          );

          return;

        }


        window.location.href =
          `application.html?id=${encodeURIComponent(
            applicationId
          )}`;

      }
    );

  }


  /* ========================================================
     AUTHENTICATION EVENTS
     ======================================================== */

  function bindAuthenticationEvents() {

    /*
     * Authentication succeeded.
     */

    document.addEventListener(
      "auth:authenticated",
      async () => {

        authenticationReady = true;
        authenticated = true;

        await refreshDashboard();

      }
    );


    /*
     * Login succeeded.
     */

    document.addEventListener(
      "auth:login-success",
      async () => {

        authenticationReady = true;
        authenticated = true;

        await refreshDashboard();

      }
    );


    /*
     * Authentication failed.
     */

    document.addEventListener(
      "auth:unauthenticated",
      () => {

        authenticationReady = true;
        authenticated = false;

        applications = [];

        setLoading(false);

      }
    );


    /*
     * Logout.
     */

    document.addEventListener(
      "auth:logout",
      () => {

        authenticationReady = true;
        authenticated = false;

        applications = [];

      }
    );


    /*
     * Unauthorized API response.
     */

    document.addEventListener(
      "admin:unauthorized",
      () => {

        authenticationReady = true;
        authenticated = false;

        applications = [];

      }
    );

  }


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  function initializeDashboard() {

    /*
     * Prevent duplicate initialization.
     */

    if (dashboardInitialized) {
      return;
    }


    dashboardInitialized = true;


    bindSearch();

    bindRefresh();

    bindApplicationClicks();

    bindAuthenticationEvents();


    /*
     * IMPORTANT:
     *
     * We intentionally DO NOT call
     * refreshDashboard() here.
     *
     * auth.js is responsible for checking
     * authentication first.
     */

  }


  /* ========================================================
     PUBLIC API
     ======================================================== */

  window.dashboard = {

    loadApplications,

    calculateStatistics,

    renderStatistics,

    renderRecentApplications,

    renderStatusBreakdown,

    refresh:
      refreshDashboard,

    search:
      filterApplications,

    getApplications:
      () => applications.slice()

  };


  window.loadDashboard =
    refreshDashboard;


  /* ========================================================
     START
     ======================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeDashboard,
      {
        once: true
      }
    );

  } else {

    initializeDashboard();

  }

})();