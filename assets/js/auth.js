"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
AUTH.JS
============================================================

Purpose:
- Admin authentication UI
- Login handling
- Logout handling
- Session checking
- Protected-page handling
- Login form integration
- Authentication state events

Works with:
    public/assets/js/admin.js

Backend:
    /api/admin/login
    /api/admin/logout
    /api/admin/applications

No credentials are stored in this file.
============================================================
*/

(function () {

  const ADMIN =
    window.ApplicationAdmin || null;


  /* ========================================================
     CONFIGURATION
  ======================================================== */

  const SELECTORS = {

    loginForm:
      "#adminLoginForm",

    tokenInput:
      "#adminToken",

    loginButton:
      "#adminLoginButton",

    logoutButton:
      "#adminLogoutButton",

    loginSection:
      "#adminLoginSection",

    dashboardSection:
      "#adminDashboardSection",

    authMessage:
      "#adminAuthMessage",

    authStatus:
      "#adminAuthStatus"

  };


  /* ========================================================
     HELPERS
  ======================================================== */

  function getElement(selector) {

    return document.querySelector(
      selector
    );

  }


  function getElements(selector) {

    return Array.from(
      document.querySelectorAll(
        selector
      )
    );

  }


  function setText(
    element,
    text
  ) {

    if (!element) {
      return;
    }

    element.textContent =
      text || "";

  }


  function setVisible(
    element,
    visible
  ) {

    if (!element) {
      return;
    }

    element.hidden =
      !visible;

    element.style.display =
      visible
        ? ""
        : "none";

  }


  function setLoading(
    button,
    loading,
    normalText
  ) {

    if (!button) {
      return;
    }


    if (
      !button.dataset.originalText
    ) {

      button.dataset.originalText =
        normalText ||
        button.textContent ||
        "Login";

    }


    button.disabled =
      loading;


    button.setAttribute(
      "aria-busy",
      loading
        ? "true"
        : "false"
    );


    button.textContent =
      loading
        ? "Please wait..."
        : (
            normalText ||
            button.dataset.originalText
          );

  }


  function showMessage(
    message,
    type = "info"
  ) {

    const element =
      getElement(
        SELECTORS.authMessage
      );


    if (!element) {

      console.log(
        `[${type}] ${message}`
      );

      return;

    }


    element.textContent =
      message || "";


    element.dataset.type =
      type;


    element.hidden =
      !message;

  }


  function setAuthStatus(
    authenticated
  ) {

    const element =
      getElement(
        SELECTORS.authStatus
      );


    if (!element) {
      return;
    }


    element.textContent =
      authenticated
        ? "Authenticated"
        : "Not authenticated";


    element.dataset.authenticated =
      authenticated
        ? "true"
        : "false";

  }


  /* ========================================================
     UI STATE
  ======================================================== */

  function showLoginScreen() {

    setVisible(
      getElement(
        SELECTORS.loginSection
      ),
      true
    );


    setVisible(
      getElement(
        SELECTORS.dashboardSection
      ),
      false
    );


    setAuthStatus(
      false
    );

  }


  function showDashboardScreen() {

    setVisible(
      getElement(
        SELECTORS.loginSection
      ),
      false
    );


    setVisible(
      getElement(
        SELECTORS.dashboardSection
      ),
      true
    );


    setAuthStatus(
      true
    );

  }


  /* ========================================================
     LOGIN
  ======================================================== */

  async function login(
    token
  ) {

    if (!ADMIN) {

      throw new Error(
        "Admin authentication module is unavailable."
      );

    }


    const administratorToken =
      String(
        token || ""
      ).trim();


    if (!administratorToken) {

      showMessage(
        "Please enter the administrator token.",
        "error"
      );

      throw new Error(
        "Administrator token is required."
      );

    }


    const button =
      getElement(
        SELECTORS.loginButton
      );


    setLoading(
      button,
      true,
      "Login"
    );


    showMessage(
      "Authenticating administrator...",
      "info"
    );


    try {

      const result =
        await ADMIN.adminLogin(
          administratorToken
        );


      showMessage(
        "Administrator login successful.",
        "success"
      );


      showDashboardScreen();


      document.dispatchEvent(
        new CustomEvent(
          "auth:login-success",
          {
            detail: result
          }
        )
      );


      return result;

    } catch(error) {

      showMessage(
        error.message ||
          "Login failed.",
        "error"
      );


      showLoginScreen();


      document.dispatchEvent(
        new CustomEvent(
          "auth:login-error",
          {
            detail: {
              error
            }
          }
        )
      );


      throw error;

    } finally {

      setLoading(
        button,
        false,
        "Login"
      );

    }

  }


  /* ========================================================
     LOGOUT
  ======================================================== */

  async function logout() {

    try {

      if (ADMIN) {

        await ADMIN.adminLogout();

      }

    } catch(error) {

      console.warn(
        "Logout error:",
        error.message
      );

    } finally {

      showLoginScreen();


      showMessage(
        "You have been logged out.",
        "success"
      );


      document.dispatchEvent(
        new CustomEvent(
          "auth:logout"
        )
      );

    }

  }


  /* ========================================================
     CHECK AUTHENTICATION
  ======================================================== */

  async function checkAuthentication() {

    if (!ADMIN) {

      showLoginScreen();

      return false;

    }


    if (
      !ADMIN.isLoggedIn()
    ) {

      showLoginScreen();

      return false;

    }


    try {

      const session =
        await ADMIN.checkAdminSession();


      if (
        session &&
        session.authenticated
      ) {

        showDashboardScreen();


        document.dispatchEvent(
          new CustomEvent(
            "auth:authenticated",
            {
              detail: session
            }
          )
        );


        return true;

      }


      showLoginScreen();


      document.dispatchEvent(
        new CustomEvent(
          "auth:unauthenticated"
        )
      );


      return false;

    } catch(error) {

      console.warn(
        "Authentication check failed:",
        error.message
      );


      showLoginScreen();

      return false;

    }

  }


  /* ========================================================
     TOKEN STATE
  ======================================================== */

  function hasAuthenticationToken() {

    if (!ADMIN) {
      return false;
    }

    return ADMIN.isLoggedIn();

  }


  function getAuthenticationToken() {

    if (!ADMIN) {
      return "";
    }

    return ADMIN.getToken();

  }


  function clearAuthentication() {

    if (ADMIN) {

      ADMIN.clearToken();

    }


    showLoginScreen();


    document.dispatchEvent(
      new CustomEvent(
        "auth:cleared"
      )
    );

  }


  /* ========================================================
     LOGIN FORM
  ======================================================== */

  function handleLoginSubmit(
    event
  ) {

    event.preventDefault();


    const form =
      event.currentTarget;


    const input =
      form.querySelector(
        SELECTORS.tokenInput
      );


    const token =
      input
        ? input.value
        : "";


    login(
      token
    ).catch(
      error => {

        console.error(
          "Login failed:",
          error
        );

      }
    );

  }


  /* ========================================================
     LOGOUT BUTTONS
  ======================================================== */

  function bindLogoutButtons() {

    getElements(
      SELECTORS.logoutButton
    )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            event => {

              event.preventDefault();

              logout();

            }
          );

        }
      );

  }


  /* ========================================================
     FORM INITIALIZATION
  ======================================================== */

  function bindLoginForm() {

    const form =
      getElement(
        SELECTORS.loginForm
      );


    if (!form) {
      return;
    }


    form.addEventListener(
      "submit",
      handleLoginSubmit
    );

  }


  /* ========================================================
     AUTH GUARD
  ======================================================== */

  function protectAdminPage() {

    const pageRequiresAuth =
      document.body?.dataset
        ?.adminProtected ===
      "true";


    if (!pageRequiresAuth) {
      return;
    }


    checkAuthentication()
      .catch(
        error => {

          console.error(
            "Admin page protection error:",
            error
          );

          showLoginScreen();

        }
      );

  }


  /* ========================================================
     ADMIN.JS EVENTS
  ======================================================== */

  function bindAdminEvents() {

    document.addEventListener(
      "admin:unauthorized",
      () => {

        clearAuthentication();


        showMessage(
          "Your administrator session has expired. Please log in again.",
          "error"
        );

      }
    );


    document.addEventListener(
      "admin:login",
      event => {

        showDashboardScreen();


        document.dispatchEvent(
          new CustomEvent(
            "auth:login-success",
            {
              detail:
                event.detail
            }
          )
        );

      }
    );


    document.addEventListener(
      "admin:logout",
      () => {

        showLoginScreen();

      }
    );

  }


  /* ========================================================
     PUBLIC API
  ======================================================== */

  window.ApplicationAuth = {

    login,

    logout,

    checkAuthentication,

    hasAuthenticationToken,

    getAuthenticationToken,

    clearAuthentication,

    showLoginScreen,

    showDashboardScreen

  };


  /* ========================================================
     GLOBAL ALIASES
  ======================================================== */

  window.adminLogin =
    login;

  window.adminLogout =
    logout;

  window.checkAdminAuthentication =
    checkAuthentication;


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      bindLoginForm();

      bindLogoutButtons();

      bindAdminEvents();

      protectAdminPage();


      document.dispatchEvent(
        new CustomEvent(
          "auth:ready"
        )
      );

    }
  );


})();