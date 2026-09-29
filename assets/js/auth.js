"use strict";

/*
============================================================
AUTH.JS
APPLICATION FORM MANAGEMENT SYSTEM
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
    assets/js/admin.js

Backend:
    /api/admin/login
    /api/admin/logout
    /api/admin/applications

Important:
- Prevents duplicate authentication events
- Prevents repeated login checks
- Prevents dashboard/login screen flickering
- Does not store administrator credentials
============================================================
*/

(function () {

  const ADMIN = window.ApplicationAdmin || null;

  /* ========================================================
     CONFIGURATION
  ======================================================== */

  const SELECTORS = {

    loginForm: "#adminLoginForm",

    tokenInput: "#adminToken",

    loginButton: "#adminLoginButton",

    logoutButton: "#adminLogoutButton",

    loginSection: "#adminLoginSection",

    dashboardSection: "#adminDashboardSection",

    authMessage: "#adminAuthMessage",

    authStatus: "#adminAuthStatus"

  };


  /* ========================================================
     INTERNAL STATE
  ======================================================== */

  let authenticationCheckRunning = false;

  let loginRunning = false;

  let currentAuthState = null;


  /* ========================================================
     HELPERS
  ======================================================== */

  function getElement(selector) {

    return document.querySelector(selector);

  }


  function getElements(selector) {

    return Array.from(
      document.querySelectorAll(selector)
    );

  }


  function setVisible(element, visible) {

    if (!element) {
      return;
    }

    element.hidden = !visible;

    element.style.display =
      visible ? "" : "none";

  }


  function showMessage(message, type = "info") {

    const element =
      getElement(SELECTORS.authMessage);

    if (!element) {
      return;
    }

    element.textContent = message || "";

    element.dataset.type = type;

    element.hidden = !message;

  }


  function setAuthStatus(authenticated) {

    const element =
      getElement(SELECTORS.authStatus);

    if (!element) {
      return;
    }

    element.textContent =
      authenticated
        ? "Authenticated"
        : "Not authenticated";

    element.dataset.authenticated =
      authenticated ? "true" : "false";

  }


  function setLoading(
    button,
    loading,
    normalText = "Login"
  ) {

    if (!button) {
      return;
    }

    if (!button.dataset.originalText) {

      button.dataset.originalText =
        button.textContent ||
        normalText;

    }

    button.disabled = loading;

    button.setAttribute(
      "aria-busy",
      loading ? "true" : "false"
    );

    button.textContent =
      loading
        ? "Please wait..."
        : (
            button.dataset.originalText ||
            normalText
          );

  }


  /* ========================================================
     UI STATE
  ======================================================== */

  function showLoginScreen(options = {}) {

    const force =
      options.force === true;

    if (
      !force &&
      currentAuthState === false
    ) {
      return;
    }

    currentAuthState = false;

    setVisible(
      getElement(SELECTORS.loginSection),
      true
    );

    setVisible(
      getElement(SELECTORS.dashboardSection),
      false
    );

    setAuthStatus(false);

  }


  function showDashboardScreen(options = {}) {

    const force =
      options.force === true;

    if (
      !force &&
      currentAuthState === true
    ) {
      return;
    }

    currentAuthState = true;

    setVisible(
      getElement(SELECTORS.loginSection),
      false
    );

    setVisible(
      getElement(SELECTORS.dashboardSection),
      true
    );

    setAuthStatus(true);

  }


  /* ========================================================
     LOGIN
  ======================================================== */

  async function login(token) {

    if (!ADMIN) {

      throw new Error(
        "Admin authentication module is unavailable."
      );

    }

    if (loginRunning) {

      return {
        success: false,
        alreadyRunning: true
      };

    }

    const administratorToken =
      String(token || "").trim();

    if (!administratorToken) {

      showMessage(
        "Please enter the administrator token.",
        "error"
      );

      throw new Error(
        "Administrator token is required."
      );

    }

    loginRunning = true;

    const button =
      getElement(SELECTORS.loginButton);

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

      /*
       * admin.js performs the actual API login.
       *
       * IMPORTANT:
       * We do not dispatch another auth:login-success
       * here. admin.js already dispatches admin:login.
       */

      const result =
        await ADMIN.adminLogin(
          administratorToken
        );

      showDashboardScreen({
        force: true
      });

      showMessage(
        "Administrator login successful.",
        "success"
      );

      /*
       * Only one application-level login event.
       */

      document.dispatchEvent(
        new CustomEvent(
          "auth:login-success",
          {
            detail: result
          }
        )
      );

      return result;

    } catch (error) {

      showLoginScreen({
        force: true
      });

      showMessage(
        error?.message ||
          "Login failed.",
        "error"
      );

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

      loginRunning = false;

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

    if (!ADMIN) {

      showLoginScreen({
        force: true
      });

      return;

    }

    try {

      await ADMIN.adminLogout();

    } catch (error) {

      console.warn(
        "Logout request failed:",
        error?.message
      );

    } finally {

      currentAuthState = null;

      showLoginScreen({
        force: true
      });

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

      showLoginScreen({
        force: true
      });

      return false;

    }

    /*
     * Prevent multiple simultaneous
     * session checks.
     */

    if (authenticationCheckRunning) {

      return (
        currentAuthState === true
      );

    }

    if (!ADMIN.isLoggedIn()) {

      showLoginScreen({
        force: true
      });

      return false;

    }

    authenticationCheckRunning = true;

    try {

      const session =
        await ADMIN.checkAdminSession();

      if (
        session &&
        session.authenticated
      ) {

        showDashboardScreen({
          force: true
        });

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

      showLoginScreen({
        force: true
      });

      document.dispatchEvent(
        new CustomEvent(
          "auth:unauthenticated"
        )
      );

      return false;

    } catch (error) {

      console.warn(
        "Authentication check failed:",
        error?.message
      );

      showLoginScreen({
        force: true
      });

      return false;

    } finally {

      authenticationCheckRunning = false;

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

    currentAuthState = null;

    showLoginScreen({
      force: true
    });

    document.dispatchEvent(
      new CustomEvent(
        "auth:cleared"
      )
    );

  }


  /* ========================================================
     LOGIN FORM
  ======================================================== */

  function handleLoginSubmit(event) {

    event.preventDefault();

    if (loginRunning) {
      return;
    }

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

    login(token).catch(
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
    ).forEach(
      button => {

        /*
         * Prevent binding the same button twice.
         */

        if (
          button.dataset.authLogoutBound === "true"
        ) {
          return;
        }

        button.dataset.authLogoutBound = "true";

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
     LOGIN FORM INITIALIZATION
  ======================================================== */

  function bindLoginForm() {

    const form =
      getElement(
        SELECTORS.loginForm
      );

    if (!form) {
      return;
    }

    if (
      form.dataset.authLoginBound === "true"
    ) {
      return;
    }

    form.dataset.authLoginBound = "true";

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
      document.body?.dataset?.adminProtected === "true";

    if (!pageRequiresAuth) {
      return;
    }

    checkAuthentication().catch(
      error => {

        console.error(
          "Admin page protection error:",
          error
        );

        showLoginScreen({
          force: true
        });

      }
    );

  }


  /* ========================================================
     ADMIN.JS EVENTS
  ======================================================== */

  function bindAdminEvents() {

    /*
     * SESSION EXPIRED
     */

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


    /*
     * ADMIN LOGIN
     *
     * IMPORTANT:
     * Do NOT dispatch auth:login-success here.
     *
     * login() already handles that event.
     */

    document.addEventListener(
      "admin:login",
      () => {

        showDashboardScreen({
          force: true
        });

      }
    );


    /*
     * ADMIN LOGOUT
     */

    document.addEventListener(
      "admin:logout",
      () => {

        currentAuthState = null;

        showLoginScreen({
          force: true
        });

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

  window.adminLogin = login;

  window.adminLogout = logout;

  window.checkAdminAuthentication =
    checkAuthentication;


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  function initializeAuth() {

    /*
     * Set the initial screen once.
     * Do not repeatedly toggle the DOM.
     */

    const hasToken =
      ADMIN &&
      ADMIN.isLoggedIn();

    if (hasToken) {

      /*
       * Temporarily show dashboard while
       * session verification happens.
       */

      showDashboardScreen({
        force: true
      });

    } else {

      showLoginScreen({
        force: true
      });

    }

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


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeAuth,
      {
        once: true
      }
    );

  } else {

    initializeAuth();

  }

})();