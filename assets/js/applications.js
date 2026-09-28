"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
APPLICATIONS MODULE
============================================================

Path:
public/assets/js/applications.js

Purpose:
- Submit public applications
- Handle multipart/form-data
- Upload photo, resume and documents
- Load admin applications
- Search/filter applications
- View individual applications
- Update application status
- Generate application PDF
- Open uploaded files
- Request WRT authorization
- Check WRT authorization status

Backend:
Node.js + Express + PostgreSQL

Compatible with:
- config.js
- auth.js
- admin.js
- dashboard.js
- ui.js
- validation.js

============================================================
*/

(function () {

  const API_BASE =
    window.API_BASE_URL ||
    window.API_BASE ||
    "/api";


  let applications = [];

  let currentApplication = null;


  /* ========================================================
     TOKEN
  ======================================================== */

  function getToken() {

    if (
      typeof window.getAdminToken ===
      "function"
    ) {

      return window.getAdminToken();

    }


    return (
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken") ||
      ""
    );

  }


  /* ========================================================
     HTML ESCAPE
  ======================================================== */

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

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


    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }


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


    if (
      response.status === 401
    ) {

      if (
        typeof window.logoutAdmin ===
        "function"
      ) {

        window.logoutAdmin();

      } else {

        localStorage.removeItem(
          "adminToken"
        );

        sessionStorage.removeItem(
          "adminToken"
        );

      }

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Request failed."
      );

    }


    return data;

  }


  /* ========================================================
     PUBLIC — SUBMIT APPLICATION
  ======================================================== */

  async function submitApplication(
    formOrData,
    files = {}
  ) {

    const formData =
      new FormData();


    /*
     * If a real HTML form was supplied,
     * collect all normal form fields.
     */

    if (
      formOrData instanceof
      HTMLFormElement
    ) {

      const form =
        formOrData;


      const fields =
        new FormData(form);


      for (
        const [key, value]
        of fields.entries()
      ) {

        if (
          value instanceof File
        ) {

          continue;

        }


        formData.append(
          key,
          value
        );

      }

    }


    /*
     * If an object was supplied,
     * send it as applicationData.
     */

    else if (
      formOrData &&
      typeof formOrData ===
      "object"
    ) {

      formData.append(
        "data",
        JSON.stringify(
          formOrData
        )
      );

    }


    /*
     * File handling.
     */

    appendFile(
      formData,
      "photo",
      files.photo ||
      files.photoFile
    );


    appendFile(
      formData,
      "resume",
      files.resume ||
      files.resumeFile
    );


    appendMultipleFiles(
      formData,
      "documents",
      files.documents
    );


    appendMultipleFiles(
      formData,
      "files",
      files.files
    );


    /*
     * If a form was supplied, detect
     * file inputs automatically.
     */

    if (
      formOrData instanceof
      HTMLFormElement
    ) {

      appendInputFile(
        formData,
        formOrData,
        [
          "photo",
          "photoFile"
        ]
      );


      appendInputFile(
        formData,
        formOrData,
        [
          "resume",
          "resumeFile"
        ]
      );


      appendInputFiles(
        formData,
        formOrData,
        [
          "documents",
          "files"
        ]
      );

    }


    const response =
      await fetch(
        `${API_BASE}/applications`,
        {
          method:
            "POST",

          body:
            formData
        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Application submission failed."
      );

    }


    return data;

  }


  /* ========================================================
     FILE HELPERS
  ======================================================== */

  function appendFile(
    formData,
    fieldName,
    file
  ) {

    if (
      file instanceof File
    ) {

      formData.append(
        fieldName,
        file
      );

    }

  }


  function appendMultipleFiles(
    formData,
    fieldName,
    files
  ) {

    if (!files) {
      return;
    }


    const list =
      Array.from(
        files
      );


    for (
      const file
      of list
    ) {

      if (
        file instanceof File
      ) {

        formData.append(
          fieldName,
          file
        );

      }

    }

  }


  function appendInputFile(
    formData,
    form,
    names
  ) {

    for (
      const name
      of names
    ) {

      const input =
        form.querySelector(
          `input[name="${CSS.escape(name)}"]`
        );


      if (
        input &&
        input.files &&
        input.files[0]
      ) {

        formData.append(
          name,
          input.files[0]
        );

        return;

      }

    }

  }


  function appendInputFiles(
    formData,
    form,
    names
  ) {

    for (
      const name
      of names
    ) {

      const input =
        form.querySelector(
          `input[name="${CSS.escape(name)}"]`
        );


      if (
        input &&
        input.files &&
        input.files.length
      ) {

        for (
          const file
          of input.files
        ) {

          formData.append(
            name,
            file
          );

        }

      }

    }

  }


  /* ========================================================
     ADMIN — LOAD ALL APPLICATIONS
  ======================================================== */

  async function loadApplications() {

    const data =
      await apiRequest(
        "/admin/applications"
      );


    applications =
      Array.isArray(
        data.applications
      )
        ? data.applications
        : [];


    return applications;

  }


  /* ========================================================
     GET APPLICATION
  ======================================================== */

  async function getApplication(
    id
  ) {

    if (!id) {

      throw new Error(
        "Application ID is required."
      );

    }


    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(id)}`
      );


    currentApplication =
      data.application ||
      null;


    return data;

  }


  /* ========================================================
     GET FILES
  ======================================================== */

  async function getApplicationFiles(
    id
  ) {

    if (!id) {

      throw new Error(
        "Application ID is required."
      );

    }


    return apiRequest(
      `/admin/applications/${encodeURIComponent(id)}/files`
    );

  }


  /* ========================================================
     UPDATE STATUS
  ======================================================== */

  async function updateApplicationStatus(
    id,
    status
  ) {

    const allowedStatuses = [

      "Submitted",

      "Under Review",

      "Documents Required",

      "Verified",

      "Approved",

      "Rejected",

      "Withdrawn"

    ];


    if (
      !allowedStatuses.includes(
        status
      )
    ) {

      throw new Error(
        "Invalid application status."
      );

    }


    const data =
      await apiRequest(
        `/admin/applications/${encodeURIComponent(id)}/status`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify({
              status
            })
        }
      );


    /*
     * Update local cache.
     */

    const updated =
      data.application;


    if (updated) {

      applications =
        applications.map(
          (application) => {

            const same =
              application.id ===
                updated.id ||
              application.application_id ===
                updated.application_id;

            return same
              ? {
                  ...application,
                  ...updated
                }
              : application;

          }
        );

    }


    return data;

  }


  /* ========================================================
     GENERATE PDF
  ======================================================== */

  async function getApplicationPDF(
    id
  ) {

    if (!id) {

      throw new Error(
        "Application ID is required."
      );

    }


    const token =
      getToken();


    const response =
      await fetch(
        `${API_BASE}/admin/applications/${encodeURIComponent(id)}/pdf`,
        {
          method:
            "GET",

          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {}
        }
      );


    if (!response.ok) {

      let error = {};

      try {

        error =
          await response.json();

      } catch {}

      throw new Error(
        error.error ||
        "Unable to generate PDF."
      );

    }


    return response.blob();

  }


  async function downloadApplicationPDF(
    id
  ) {

    const blob =
      await getApplicationPDF(
        id
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      `${sanitizeFilename(id)}.pdf`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );

  }


  /* ========================================================
     VIEW FILE
  ======================================================== */

  function getFileURL(
    fileId
  ) {

    if (!fileId) {

      throw new Error(
        "File ID is required."
      );

    }


    return (
      `${API_BASE}/admin/files/${encodeURIComponent(fileId)}`
    );

  }


  async function openFile(
    fileId
  ) {

    const token =
      getToken();


    /*
     * Browser navigation cannot reliably
     * attach Authorization headers.
     *
     * Fetch the protected file first,
     * then open a Blob URL.
     */

    const response =
      await fetch(
        getFileURL(fileId),
        {
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {}
        }
      );


    if (!response.ok) {

      let error = {};

      try {

        error =
          await response.json();

      } catch {}


      throw new Error(
        error.error ||
        "Unable to open file."
      );

    }


    const blob =
      await response.blob();


    const url =
      URL.createObjectURL(
        blob
      );


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );


    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      60000
    );

  }


  /* ========================================================
     WRT — CREATE ACCESS REQUEST
  ======================================================== */

  async function createAccessRequest(
    id,
    type = "wrt"
  ) {

    if (!id) {

      throw new Error(
        "Application ID is required."
      );

    }


    return apiRequest(
      `/admin/applications/${encodeURIComponent(id)}/access-request`,
      {
        method:
          "POST",

        body:
          JSON.stringify({
            type
          })
      }
    );

  }


  /* ========================================================
     WRT — GET ACCESS STATUS
  ======================================================== */

  async function getAccessStatus(
    id
  ) {

    if (!id) {

      throw new Error(
        "Application ID is required."
      );

    }


    return apiRequest(
      `/admin/applications/${encodeURIComponent(id)}/access-status`
    );

  }


  /* ========================================================
     WRT — ADMIN APPROVE
  ======================================================== */

  async function approveAccessRequest(
    requestId
  ) {

    return apiRequest(
      `/admin/access-requests/${encodeURIComponent(requestId)}/approve`,
      {
        method:
          "PATCH"
      }
    );

  }


  /* ========================================================
     WRT — ADMIN DENY
  ======================================================== */

  async function denyAccessRequest(
    requestId
  ) {

    return apiRequest(
      `/admin/access-requests/${encodeURIComponent(requestId)}/deny`,
      {
        method:
          "PATCH"
      }
    );

  }


  /* ========================================================
     SEARCH
  ======================================================== */

  function searchApplications(
    searchTerm,
    status = ""
  ) {

    const term =
      String(
        searchTerm || ""
      )
      .trim()
      .toLowerCase();


    const statusFilter =
      String(
        status || ""
      )
      .trim();


    return applications.filter(
      (application) => {

        const data =
          application.applicant_data ||
          {};


        const searchable =
          JSON.stringify({
            applicationId:
              application.application_id,

            status:
              application.status,

            data
          })
          .toLowerCase();


        const matchesSearch =
          !term ||
          searchable.includes(
            term
          );


        const matchesStatus =
          !statusFilter ||
          application.status ===
            statusFilter;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );

  }


  /* ========================================================
     RENDER APPLICATION TABLE
  ======================================================== */

  function renderApplications(
    list,
    container
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }


    if (!container) {
      return;
    }


    if (
      !Array.isArray(list) ||
      list.length === 0
    ) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>No applications found</strong>
          <span>
            There are no applications matching the current filters.
          </span>
        </div>
      `;

      return;

    }


    container.innerHTML =
      list.map(
        (application) => {

          const data =
            application.applicant_data ||
            {};


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


          const statusClass =
            String(status)
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                "-"
              );


          return `
            <tr
              data-application-id="${escapeHTML(
                application.application_id
              )}"
            >

              <td>
                ${escapeHTML(
                  application.application_id
                )}
              </td>

              <td>
                <strong>
                  ${escapeHTML(name)}
                </strong>

                <small>
                  ${escapeHTML(email)}
                </small>
              </td>

              <td>
                <span
                  class="status-badge status-${escapeHTML(
                    statusClass
                  )}"
                >
                  ${escapeHTML(status)}
                </span>
              </td>

              <td>
                ${escapeHTML(
                  formatDate(
                    application.created_at
                  )
                )}
              </td>

              <td>

                <button
                  type="button"
                  class="btn btn-sm"
                  data-view-application="${escapeHTML(
                    application.application_id
                  )}"
                >
                  View
                </button>

              </td>

            </tr>
          `;

        }
      )
      .join("");

  }


  /* ========================================================
     DATE FORMAT
  ======================================================== */

  function formatDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleString(
      "en-IN",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    );

  }


  /* ========================================================
     SANITIZE FILENAME
  ======================================================== */

  function sanitizeFilename(
    value
  ) {

    return String(
      value || "application"
    )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

  }


  /* ========================================================
     APPLICATION DETAILS RENDERER
  ======================================================== */

  function renderApplicationDetails(
    data,
    container
  ) {

    if (
      typeof container ===
      "string"
    ) {

      container =
        document.querySelector(
          container
        );

    }


    if (!container) {
      return;
    }


    const application =
      data.application ||
      data;


    if (!application) {

      container.innerHTML = `
        <div class="empty-state">
          Application not found.
        </div>
      `;

      return;

    }


    const applicantData =
      application.applicant_data ||
      {};


    const entries =
      Object.entries(
        applicantData
      );


    const fields =
      entries.map(
        ([key, value]) => {

          let displayValue = "";


          if (
            value === null ||
            value === undefined
          ) {

            displayValue =
              "—";

          } else if (
            typeof value ===
            "object"
          ) {

            try {

              displayValue =
                JSON.stringify(
                  value
                );

            } catch {

              displayValue =
                "[Object]";

            }

          } else {

            displayValue =
              String(value);

          }


          return `
            <div class="application-field">

              <span class="field-label">
                ${escapeHTML(key)}
              </span>

              <strong class="field-value">
                ${escapeHTML(
                  displayValue
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");


    container.innerHTML = `

      <section class="application-details">

        <div class="application-header">

          <div>

            <span class="field-label">
              Application ID
            </span>

            <h2>
              ${escapeHTML(
                application.application_id
              )}
            </h2>

          </div>


          <div>

            <span class="status-badge">
              ${escapeHTML(
                application.status
              )}
            </span>

          </div>

        </div>


        <div class="application-meta">

          <div>
            <span>Submitted</span>
            <strong>
              ${escapeHTML(
                formatDate(
                  application.created_at
                )
              )}
            </strong>
          </div>

          <div>
            <span>Updated</span>
            <strong>
              ${escapeHTML(
                formatDate(
                  application.updated_at
                )
              )}
            </strong>
          </div>

        </div>


        <div class="application-fields">

          ${fields}

        </div>

      </section>

    `;

  }


  /* ========================================================
     STATUS OPTIONS
  ======================================================== */

  function getStatusOptions(
    selected
  ) {

    const statuses = [

      "Submitted",

      "Under Review",

      "Documents Required",

      "Verified",

      "Approved",

      "Rejected",

      "Withdrawn"

    ];


    return statuses
      .map(
        (status) => `

          <option
            value="${escapeHTML(status)}"
            ${
              status === selected
                ? "selected"
                : ""
            }
          >
            ${escapeHTML(status)}
          </option>

        `
      )
      .join("");

  }


  /* ========================================================
     APPLICATION EVENT BINDING
  ======================================================== */

  function bindApplicationEvents() {

    document.addEventListener(
      "click",
      async (event) => {

        const viewButton =
          event.target.closest(
            "[data-view-application]"
          );


        if (!viewButton) {
          return;
        }


        const id =
          viewButton.dataset
            .viewApplication;


        if (
          typeof window.openApplication ===
          "function"
        ) {

          window.openApplication(
            id
          );

          return;

        }


        try {

          const data =
            await getApplication(
              id
            );


          const container =
            document.querySelector(
              "#applicationDetails"
            );


          renderApplicationDetails(
            data,
            container
          );

        } catch(error) {

          console.error(
            error
          );

          alert(
            error.message
          );

        }

      }
    );

  }


  /* ========================================================
     PUBLIC API
  ======================================================== */

  window.applications = {

    submit:
      submitApplication,

    load:
      loadApplications,

    get:
      getApplication,

    getFiles:
      getApplicationFiles,

    updateStatus:
      updateApplicationStatus,

    getPDF:
      getApplicationPDF,

    downloadPDF:
      downloadApplicationPDF,

    openFile,

    createAccessRequest,

    getAccessStatus,

    approveAccessRequest,

    denyAccessRequest,

    search:
      searchApplications,

    render:
      renderApplications,

    renderDetails:
      renderApplicationDetails,

    getStatusOptions,

    getCurrent:
      () => currentApplication,

    getAll:
      () => applications.slice()

  };


  /*
   * Global compatibility functions.
   */

  window.submitApplication =
    submitApplication;

  window.loadApplications =
    loadApplications;

  window.getApplication =
    getApplication;

  window.updateApplicationStatus =
    updateApplicationStatus;

  window.downloadApplicationPDF =
    downloadApplicationPDF;

  window.openApplicationFile =
    openFile;

  window.createAccessRequest =
    createAccessRequest;

  window.getAccessStatus =
    getAccessStatus;


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  function initialize() {

    bindApplicationEvents();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }

})();
