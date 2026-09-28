"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
FILE: public/assets/js/ui.js

Purpose:
- Global UI helpers
- Toast notifications
- Loading states
- Modal handling
- Status badges
- Empty states
- Safe HTML escaping
- Date/number formatting
- Admin dashboard UI utilities

Canonical frontend utility file.
============================================================
*/

(function () {

  const UI = {};

  /* ========================================================
     CONFIG
  ======================================================== */

  const CONFIG = {
    toastDuration: 4000,
    modalAnimationDuration: 180,
    loadingText: "Loading..."
  };


  /* ========================================================
     SAFE HTML
  ======================================================== */

  UI.escapeHTML = function (value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  };


  /* ========================================================
     TOAST CONTAINER
  ======================================================== */

  function getToastContainer() {

    let container =
      document.getElementById(
        "ui-toast-container"
      );

    if (container) {
      return container;
    }

    container =
      document.createElement("div");

    container.id =
      "ui-toast-container";

    container.setAttribute(
      "aria-live",
      "polite"
    );

    container.setAttribute(
      "aria-atomic",
      "true"
    );

    container.style.position =
      "fixed";

    container.style.top =
      "20px";

    container.style.right =
      "20px";

    container.style.zIndex =
      "99999";

    container.style.display =
      "flex";

    container.style.flexDirection =
      "column";

    container.style.gap =
      "10px";

    container.style.maxWidth =
      "min(420px, calc(100vw - 40px))";

    document.body.appendChild(
      container
    );

    return container;

  }


  /* ========================================================
     TOAST
  ======================================================== */

  UI.toast = function (
    message,
    type = "info",
    duration = CONFIG.toastDuration
  ) {

    const container =
      getToastContainer();

    const toast =
      document.createElement("div");

    const validTypes = [
      "success",
      "error",
      "warning",
      "info"
    ];

    if (
      !validTypes.includes(type)
    ) {
      type = "info";
    }

    toast.className =
      `ui-toast ui-toast-${type}`;

    toast.setAttribute(
      "role",
      type === "error"
        ? "alert"
        : "status"
    );

    toast.style.padding =
      "13px 16px";

    toast.style.borderRadius =
      "12px";

    toast.style.background =
      "rgba(30, 30, 30, 0.96)";

    toast.style.color =
      "#ffffff";

    toast.style.boxShadow =
      "0 8px 30px rgba(0,0,0,.18)";

    toast.style.fontSize =
      "14px";

    toast.style.lineHeight =
      "1.45";

    toast.style.display =
      "flex";

    toast.style.alignItems =
      "center";

    toast.style.gap =
      "10px";

    toast.style.opacity =
      "0";

    toast.style.transform =
      "translateY(-8px)";

    toast.style.transition =
      "opacity .18s ease, transform .18s ease";

    const icon =
      document.createElement("span");

    icon.textContent =
      type === "success"
        ? "✓"
        : type === "error"
          ? "!"
          : type === "warning"
            ? "⚠"
            : "i";

    icon.style.fontWeight =
      "700";

    const text =
      document.createElement("span");

    text.textContent =
      String(message ?? "");

    toast.appendChild(icon);
    toast.appendChild(text);

    container.appendChild(
      toast
    );

    requestAnimationFrame(() => {

      toast.style.opacity =
        "1";

      toast.style.transform =
        "translateY(0)";

    });

    const removeToast = () => {

      toast.style.opacity =
        "0";

      toast.style.transform =
        "translateY(-8px)";

      setTimeout(() => {

        if (toast.parentNode) {
          toast.parentNode.removeChild(
            toast
          );
        }

      }, 180);

    };

    const timer =
      setTimeout(
        removeToast,
        duration
      );

    toast.addEventListener(
      "click",
      () => {

        clearTimeout(timer);

        removeToast();

      }
    );

    return toast;

  };


  UI.success = function (
    message
  ) {

    return UI.toast(
      message,
      "success"
    );

  };


  UI.error = function (
    message
  ) {

    return UI.toast(
      message,
      "error"
    );

  };


  UI.warning = function (
    message
  ) {

    return UI.toast(
      message,
      "warning"
    );

  };


  UI.info = function (
    message
  ) {

    return UI.toast(
      message,
      "info"
    );

  };


  /* ========================================================
     LOADING
  ======================================================== */

  UI.setLoading = function (
    element,
    loading = true,
    text = CONFIG.loadingText
  ) {

    if (!element) {
      return;
    }

    if (loading) {

      if (
        !element.dataset.originalText
      ) {

        element.dataset.originalText =
          element.textContent;

      }

      element.disabled =
        true;

      element.setAttribute(
        "aria-busy",
        "true"
      );

      element.innerHTML =
        `
        <span
          class="ui-loading-spinner"
          aria-hidden="true"
          style="
            display:inline-block;
            width:14px;
            height:14px;
            border:2px solid currentColor;
            border-right-color:transparent;
            border-radius:50%;
            animation:uiSpin .7s linear infinite;
            vertical-align:-2px;
            margin-right:7px;
          "
        ></span>
        ${UI.escapeHTML(text)}
        `;

    } else {

      element.disabled =
        false;

      element.removeAttribute(
        "aria-busy"
      );

      if (
        element.dataset.originalText
      ) {

        element.textContent =
          element.dataset.originalText;

        delete element.dataset.originalText;

      }

    }

  };


  /* ========================================================
     GLOBAL SPINNER
  ======================================================== */

  UI.showSpinner = function (
    message = "Loading..."
  ) {

    let overlay =
      document.getElementById(
        "ui-loading-overlay"
      );

    if (overlay) {
      return overlay;
    }

    overlay =
      document.createElement("div");

    overlay.id =
      "ui-loading-overlay";

    overlay.style.position =
      "fixed";

    overlay.style.inset =
      "0";

    overlay.style.zIndex =
      "99998";

    overlay.style.display =
      "flex";

    overlay.style.alignItems =
      "center";

    overlay.style.justifyContent =
      "center";

    overlay.style.background =
      "rgba(0,0,0,.35)";

    overlay.innerHTML =
      `
      <div
        style="
          background:#ffffff;
          border-radius:16px;
          padding:22px 28px;
          box-shadow:0 12px 40px rgba(0,0,0,.2);
          text-align:center;
          min-width:180px;
        "
      >
        <div
          style="
            width:30px;
            height:30px;
            margin:0 auto 12px;
            border:3px solid #ddd;
            border-top-color:#333;
            border-radius:50%;
            animation:uiSpin .7s linear infinite;
          "
        ></div>

        <div>
          ${UI.escapeHTML(message)}
        </div>
      </div>
      `;

    document.body.appendChild(
      overlay
    );

    return overlay;

  };


  UI.hideSpinner = function () {

    const overlay =
      document.getElementById(
        "ui-loading-overlay"
      );

    if (overlay) {

      overlay.remove();

    }

  };


  /* ========================================================
     MODAL
  ======================================================== */

  UI.openModal = function (
    modal
  ) {

    if (
      typeof modal === "string"
    ) {

      modal =
        document.getElementById(
          modal
        );

    }

    if (!modal) {
      return;
    }

    modal.hidden =
      false;

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    modal.classList.add(
      "ui-modal-open"
    );

    document.body.classList.add(
      "ui-modal-active"
    );

  };


  UI.closeModal = function (
    modal
  ) {

    if (
      typeof modal === "string"
    ) {

      modal =
        document.getElementById(
          modal
        );

    }

    if (!modal) {
      return;
    }

    modal.classList.remove(
      "ui-modal-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modal.hidden =
      true;

    if (
      !document.querySelector(
        ".ui-modal-open"
      )
    ) {

      document.body.classList.remove(
        "ui-modal-active"
      );

    }

  };


  UI.createModal = function ({
    title = "",
    content = "",
    buttons = []
  } = {}) {

    const modal =
      document.createElement("div");

    modal.className =
      "ui-modal";

    modal.hidden =
      true;

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modal.style.position =
      "fixed";

    modal.style.inset =
      "0";

    modal.style.zIndex =
      "99997";

    modal.style.display =
      "flex";

    modal.style.alignItems =
      "center";

    modal.style.justifyContent =
      "center";

    modal.style.padding =
      "20px";

    modal.style.background =
      "rgba(0,0,0,.45)";

    const panel =
      document.createElement("div");

    panel.style.width =
      "min(600px, 100%)";

    panel.style.maxHeight =
      "90vh";

    panel.style.overflow =
      "auto";

    panel.style.background =
      "#ffffff";

    panel.style.borderRadius =
      "18px";

    panel.style.boxShadow =
      "0 20px 60px rgba(0,0,0,.25)";

    panel.style.padding =
      "24px";

    const header =
      document.createElement("div");

    header.style.display =
      "flex";

    header.style.alignItems =
      "center";

    header.style.justifyContent =
      "space-between";

    header.style.gap =
      "15px";

    const heading =
      document.createElement("h2");

    heading.textContent =
      title;

    heading.style.margin =
      "0";

    const close =
      document.createElement("button");

    close.type =
      "button";

    close.textContent =
      "×";

    close.setAttribute(
      "aria-label",
      "Close"
    );

    close.style.fontSize =
      "26px";

    close.style.border =
      "0";

    close.style.background =
      "transparent";

    close.style.cursor =
      "pointer";

    close.addEventListener(
      "click",
      () => UI.closeModal(modal)
    );

    header.appendChild(
      heading
    );

    header.appendChild(
      close
    );

    const body =
      document.createElement("div");

    body.style.marginTop =
      "18px";

    if (
      typeof content === "string"
    ) {

      body.innerHTML =
        content;

    } else if (
      content instanceof Node
    ) {

      body.appendChild(
        content
      );

    }

    const footer =
      document.createElement("div");

    footer.style.display =
      "flex";

    footer.style.justifyContent =
      "flex-end";

    footer.style.gap =
      "10px";

    footer.style.marginTop =
      "22px";

    buttons.forEach(
      (buttonConfig) => {

        const button =
          document.createElement("button");

        button.type =
          "button";

        button.textContent =
          buttonConfig.label ||
          "Close";

        if (
          buttonConfig.className
        ) {

          button.className =
            buttonConfig.className;

        }

        button.addEventListener(
          "click",
          () => {

            if (
              typeof buttonConfig.onClick ===
              "function"
            ) {

              buttonConfig.onClick(
                modal
              );

            }

          }
        );

        footer.appendChild(
          button
        );

      }
    );

    panel.appendChild(
      header
    );

    panel.appendChild(
      body
    );

    if (buttons.length) {

      panel.appendChild(
        footer
      );

    }

    modal.appendChild(
      panel
    );

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {

          UI.closeModal(
            modal
          );

        }

      }
    );

    document.body.appendChild(
      modal
    );

    return modal;

  };


  /* ========================================================
     STATUS BADGES
  ======================================================== */

  UI.statusClass = function (
    status
  ) {

    const normalized =
      String(
        status || ""
      )
        .trim()
        .toLowerCase();

    const map = {

      "submitted":
        "submitted",

      "under review":
        "review",

      "documents required":
        "documents",

      "verified":
        "verified",

      "approved":
        "approved",

      "rejected":
        "rejected",

      "withdrawn":
        "withdrawn"

    };

    return (
      map[normalized] ||
      "default"
    );

  };


  UI.statusBadge = function (
    status
  ) {

    const span =
      document.createElement(
        "span"
      );

    const safeStatus =
      String(
        status || "Unknown"
      );

    span.className =
      `status-badge status-${UI.statusClass(
        safeStatus
      )}`;

    span.textContent =
      safeStatus;

    return span;

  };


  /* ========================================================
     EMPTY STATE
  ======================================================== */

  UI.emptyState = function (
    message = "No records found."
  ) {

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "ui-empty-state";

    wrapper.style.textAlign =
      "center";

    wrapper.style.padding =
      "40px 20px";

    wrapper.style.opacity =
      ".75";

    const icon =
      document.createElement(
        "div"
      );

    icon.textContent =
      "○";

    icon.style.fontSize =
      "36px";

    icon.style.marginBottom =
      "10px";

    const text =
      document.createElement(
        "div"
      );

    text.textContent =
      message;

    wrapper.appendChild(
      icon
    );

    wrapper.appendChild(
      text
    );

    return wrapper;

  };


  /* ========================================================
     DATE FORMATTING
  ======================================================== */

  UI.formatDate = function (
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

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle:
          "medium"
      }
    ).format(date);

  };


  UI.formatDateTime = function (
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

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short"
      }
    ).format(date);

  };


  /* ========================================================
     NUMBER FORMATTING
  ======================================================== */

  UI.formatNumber = function (
    value
  ) {

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {

      return "0";

    }

    return new Intl.NumberFormat(
      "en-IN"
    ).format(number);

  };


  UI.formatBytes = function (
    bytes
  ) {

    const value =
      Number(bytes);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {

      return "0 B";

    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB"
    ];

    const index =
      Math.min(
        Math.floor(
          Math.log(value) /
          Math.log(1024)
        ),
        units.length - 1
      );

    return (
      `${(
        value /
        Math.pow(
          1024,
          index
        )
      ).toFixed(
        index === 0
          ? 0
          : 2
      )} ${units[index]}`
    );

  };


  /* ========================================================
     ELEMENT HELPERS
  ======================================================== */

  UI.show = function (
    element
  ) {

    if (!element) {
      return;
    }

    element.hidden =
      false;

    element.style.display =
      "";

  };


  UI.hide = function (
    element
  ) {

    if (!element) {
      return;
    }

    element.hidden =
      true;

  };


  UI.toggle = function (
    element,
    force
  ) {

    if (!element) {
      return false;
    }

    const shouldShow =
      typeof force === "boolean"
        ? force
        : element.hidden;

    if (shouldShow) {

      UI.show(
        element
      );

    } else {

      UI.hide(
        element
      );

    }

    return shouldShow;

  };


  UI.setText = function (
    element,
    value
  ) {

    if (!element) {
      return;
    }

    element.textContent =
      value === null ||
      value === undefined
        ? ""
        : String(value);

  };


  UI.setHTML = function (
    element,
    html
  ) {

    if (!element) {
      return;
    }

    element.innerHTML =
      String(html ?? "");

  };


  /* ========================================================
     FORM HELPERS
  ======================================================== */

  UI.clearValidation = function (
    form
  ) {

    if (!form) {
      return;
    }

    form
      .querySelectorAll(
        ".is-invalid, [aria-invalid='true']"
      )
      .forEach(
        (element) => {

          element.classList.remove(
            "is-invalid"
          );

          element.removeAttribute(
            "aria-invalid"
          );

        }
      );

    form
      .querySelectorAll(
        ".ui-field-error"
      )
      .forEach(
        (element) => {

          element.remove();

        }
      );

  };


  UI.fieldError = function (
    field,
    message
  ) {

    if (!field) {
      return;
    }

    field.classList.add(
      "is-invalid"
    );

    field.setAttribute(
      "aria-invalid",
      "true"
    );

    const oldError =
      field.parentElement?.querySelector(
        ".ui-field-error"
      );

    if (oldError) {
      oldError.remove();
    }

    const error =
      document.createElement(
        "div"
      );

    error.className =
      "ui-field-error";

    error.textContent =
      message ||
      "Invalid value.";

    error.style.color =
      "#b42318";

    error.style.fontSize =
      "12px";

    error.style.marginTop =
      "5px";

    field.parentElement?.appendChild(
      error
    );

  };


  /* ========================================================
     CONFIRMATION
  ======================================================== */

  UI.confirm = function (
    message,
    title = "Confirm"
  ) {

    return new Promise(
      (resolve) => {

        const modal =
          UI.createModal({
            title,
            content:
              `<p>${UI.escapeHTML(
                message
              )}</p>`,
            buttons: [
              {
                label:
                  "Cancel",

                onClick:
                  () => {

                    UI.closeModal(
                      modal
                    );

                    modal.remove();

                    resolve(false);

                  }
              },

              {
                label:
                  "Confirm",

                onClick:
                  () => {

                    UI.closeModal(
                      modal
                    );

                    modal.remove();

                    resolve(true);

                  }
              }
            ]
          });

        UI.openModal(
          modal
        );

      }
    );

  };


  /* ========================================================
     COPY TO CLIPBOARD
  ======================================================== */

  UI.copy = async function (
    value
  ) {

    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard.writeText(
          String(value)
        );

      } else {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          String(value);

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();

        textarea.select();

        document.execCommand(
          "copy"
        );

        textarea.remove();

      }

      UI.success(
        "Copied to clipboard."
      );

      return true;

    } catch(error) {

      console.error(
        "Clipboard error:",
        error
      );

      UI.error(
        "Unable to copy."
      );

      return false;

    }

  };


  /* ========================================================
     APPLICATION ID DISPLAY
  ======================================================== */

  UI.applicationId = function (
    id
  ) {

    const wrapper =
      document.createElement(
        "span"
      );

    wrapper.className =
      "application-id";

    wrapper.style.display =
      "inline-flex";

    wrapper.style.alignItems =
      "center";

    wrapper.style.gap =
      "7px";

    const text =
      document.createElement(
        "span"
      );

    text.textContent =
      id || "—";

    const copy =
      document.createElement(
        "button"
      );

    copy.type =
      "button";

    copy.textContent =
      "Copy";

    copy.addEventListener(
      "click",
      () => UI.copy(id)
    );

    wrapper.appendChild(
      text
    );

    if (id) {

      wrapper.appendChild(
        copy
      );

    }

    return wrapper;

  };


  /* ========================================================
     KEYBOARD / ACCESSIBILITY
  ======================================================== */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {
        return;
      }

      const modals =
        document.querySelectorAll(
          ".ui-modal-open"
        );

      if (
        modals.length
      ) {

        UI.closeModal(
          modals[modals.length - 1]
        );

      }

    }
  );


  /* ========================================================
     GLOBAL CSS
  ======================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "ui-helper-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "ui-helper-styles";

    style.textContent =
      `
      @keyframes uiSpin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      .ui-modal {
        opacity: 0;
        transition: opacity .18s ease;
      }

      .ui-modal.ui-modal-open {
        opacity: 1;
      }

      body.ui-modal-active {
        overflow: hidden;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .status-submitted {
        background: #eef2ff;
        color: #3730a3;
      }

      .status-review {
        background: #fff7ed;
        color: #9a3412;
      }

      .status-documents {
        background: #fefce8;
        color: #854d0e;
      }

      .status-verified {
        background: #ecfdf3;
        color: #166534;
      }

      .status-approved {
        background: #ecfdf3;
        color: #166534;
      }

      .status-rejected {
        background: #fef2f2;
        color: #991b1b;
      }

      .status-withdrawn {
        background: #f3f4f6;
        color: #374151;
      }

      .status-default {
        background: #f3f4f6;
        color: #374151;
      }

      @media (max-width: 600px) {

        #ui-toast-container {
          top: 10px !important;
          right: 10px !important;
          left: 10px !important;
          max-width: none !important;
        }

      }
      `;

    document.head.appendChild(
      style
    );

  }


  /* ========================================================
     INITIALIZE
  ======================================================== */

  function initialize() {

    injectStyles();

    /*
     * Make UI available globally.
     */
    window.UI =
      UI;

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }

})();