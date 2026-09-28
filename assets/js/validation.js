"use strict";

/*
============================================================
APPLICATION FORM MANAGEMENT SYSTEM
FILE: public/assets/js/validation.js

Purpose:
- Client-side form validation
- Required field validation
- Email / phone validation
- File validation
- Size validation
- Password validation
- Error display
- Form submission protection
- Safe validation helpers

Canonical frontend validation file.
============================================================
*/

(function () {

  const Validation = {};


  /* ========================================================
     CONFIGURATION
  ======================================================== */

  const CONFIG = {

    maxFileSize:
      10 * 1024 * 1024,

    maxFiles:
      20,

    allowedMimeTypes: [

      "image/jpeg",
      "image/png",
      "image/webp",

      "application/pdf",

      "application/msword",

      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ],

    allowedExtensions: [

      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".pdf",
      ".doc",
      ".docx"

    ]

  };


  /* ========================================================
     BASIC HELPERS
  ======================================================== */

  function getValue(
    element
  ) {

    if (!element) {
      return "";
    }

    if (
      element.type ===
      "checkbox"
    ) {

      return element.checked;

    }

    if (
      element.type ===
      "file"
    ) {

      return element.files;

    }

    return String(
      element.value || ""
    ).trim();

  }


  function normalize(
    value
  ) {

    return String(
      value || ""
    ).trim();

  }


  function isEmpty(
    value
  ) {

    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    );

  }


  /* ========================================================
     REGEX
  ======================================================== */

  const patterns = {

    email:
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

    phone:
      /^\+?[0-9\s().-]{7,20}$/,

    indianPhone:
      /^(?:\+91[\s-]?)?[6-9][0-9]{9}$/,

    name:
      /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,99}$/,

    pincode:
      /^[1-9][0-9]{5}$/,

    postalCode:
      /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/,

    url:
      /^(https?:\/\/)([^\s.]+\.)+[^\s]{2,}$/i,

    applicationId:
      /^APP-[A-Z0-9]+-[A-F0-9]+$/i

  };


  /* ========================================================
     ERROR HELPERS
  ======================================================== */

  function clearFieldError(
    field
  ) {

    if (!field) {
      return;
    }

    field.classList.remove(
      "is-invalid"
    );

    field.removeAttribute(
      "aria-invalid"
    );

    const parent =
      field.parentElement;

    if (!parent) {
      return;
    }

    const error =
      parent.querySelector(
        ".validation-error"
      );

    if (error) {
      error.remove();
    }

  }


  function showFieldError(
    field,
    message
  ) {

    if (!field) {
      return false;
    }

    clearFieldError(
      field
    );

    field.classList.add(
      "is-invalid"
    );

    field.setAttribute(
      "aria-invalid",
      "true"
    );

    const error =
      document.createElement(
        "div"
      );

    error.className =
      "validation-error";

    error.textContent =
      message;

    error.style.color =
      "#b42318";

    error.style.fontSize =
      "12px";

    error.style.marginTop =
      "5px";

    const parent =
      field.parentElement;

    if (parent) {

      parent.appendChild(
        error
      );

    }

    return false;

  }


  function showFormError(
    form,
    message
  ) {

    if (!form) {
      return;
    }

    let container =
      form.querySelector(
        ".validation-form-error"
      );

    if (!container) {

      container =
        document.createElement(
          "div"
        );

      container.className =
        "validation-form-error";

      container.style.padding =
        "12px 14px";

      container.style.marginBottom =
        "15px";

      container.style.borderRadius =
        "10px";

      container.style.background =
        "#fef2f2";

      container.style.color =
        "#991b1b";

      container.style.fontSize =
        "14px";

      form.prepend(
        container
      );

    }

    container.textContent =
      message;

    return false;

  }


  function clearFormErrors(
    form
  ) {

    if (!form) {
      return;
    }

    form
      .querySelectorAll(
        ".validation-error"
      )
      .forEach(
        (element) => {
          element.remove();
        }
      );

    form
      .querySelectorAll(
        ".validation-form-error"
      )
      .forEach(
        (element) => {
          element.remove();
        }
      );

    form
      .querySelectorAll(
        ".is-invalid"
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

  }


  /* ========================================================
     REQUIRED
  ======================================================== */

  Validation.required = function (
    field,
    message = "This field is required."
  ) {

    const value =
      getValue(field);

    if (
      field?.type ===
      "checkbox"
    ) {

      if (!field.checked) {

        return showFieldError(
          field,
          message
        );

      }

      clearFieldError(
        field
      );

      return true;

    }

    if (
      field?.type ===
      "file"
    ) {

      if (
        !field.files ||
        field.files.length === 0
      ) {

        return showFieldError(
          field,
          message
        );

      }

      clearFieldError(
        field
      );

      return true;

    }

    if (
      isEmpty(value)
    ) {

      return showFieldError(
        field,
        message
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     EMAIL
  ======================================================== */

  Validation.email = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (
      !value
    ) {

      return showFieldError(
        field,
        "Email address is required."
      );

    }

    if (
      !patterns.email.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid email address."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     PHONE
  ======================================================== */

  Validation.phone = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "Phone number is required."
      );

    }

    if (
      !patterns.phone.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid phone number."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     INDIAN PHONE
  ======================================================== */

  Validation.indianPhone = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      )
      .replace(
        /\s/g,
        ""
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "Mobile number is required."
      );

    }

    if (
      !patterns.indianPhone.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid Indian mobile number."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     NAME
  ======================================================== */

  Validation.name = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "Name is required."
      );

    }

    if (
      !patterns.name.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid name."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     MINIMUM LENGTH
  ======================================================== */

  Validation.minLength = function (
    field,
    length,
    message
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (
      value.length <
      Number(length)
    ) {

      return showFieldError(
        field,
        message ||
        `Minimum ${length} characters required.`
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     MAXIMUM LENGTH
  ======================================================== */

  Validation.maxLength = function (
    field,
    length,
    message
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      value.length >
      Number(length)
    ) {

      return showFieldError(
        field,
        message ||
        `Maximum ${length} characters allowed.`
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     PINCODE
  ======================================================== */

  Validation.pincode = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "PIN code is required."
      );

    }

    if (
      !patterns.pincode.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid 6-digit PIN code."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     URL
  ======================================================== */

  Validation.url = function (
    field,
    required = false
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "URL is required."
      );

    }

    if (
      !patterns.url.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid URL beginning with http:// or https://."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     NUMBER
  ======================================================== */

  Validation.number = function (
    field,
    options = {}
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !options.required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        options.message ||
        "Number is required."
      );

    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {

      return showFieldError(
        field,
        options.message ||
        "Enter a valid number."
      );

    }

    if (
      options.min !== undefined &&
      number < Number(options.min)
    ) {

      return showFieldError(
        field,
        `Value must be at least ${options.min}.`
      );

    }

    if (
      options.max !== undefined &&
      number > Number(options.max)
    ) {

      return showFieldError(
        field,
        `Value must not exceed ${options.max}.`
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     PASSWORD
  ======================================================== */

  Validation.password = function (
    field,
    options = {}
  ) {

    const value =
      String(
        getValue(field) || ""
      );

    const min =
      Number(
        options.min ||
        8
      );

    if (
      !value &&
      !options.required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "Password is required."
      );

    }

    if (
      value.length < min
    ) {

      return showFieldError(
        field,
        `Password must contain at least ${min} characters.`
      );

    }

    if (
      options.strong
    ) {

      if (
        !/[A-Z]/.test(value) ||
        !/[a-z]/.test(value) ||
        !/[0-9]/.test(value)
      ) {

        return showFieldError(
          field,
          "Password must contain uppercase, lowercase and a number."
        );

      }

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     CONFIRM PASSWORD
  ======================================================== */

  Validation.confirmPassword = function (
    passwordField,
    confirmField
  ) {

    if (!confirmField) {
      return false;
    }

    const password =
      String(
        getValue(passwordField) || ""
      );

    const confirm =
      String(
        getValue(confirmField) || ""
      );

    if (
      !confirm
    ) {

      return showFieldError(
        confirmField,
        "Please confirm the password."
      );

    }

    if (
      password !==
      confirm
    ) {

      return showFieldError(
        confirmField,
        "Passwords do not match."
      );

    }

    clearFieldError(
      confirmField
    );

    return true;

  };


  /* ========================================================
     FILE VALIDATION
  ======================================================== */

  Validation.file = function (
    field,
    options = {}
  ) {

    if (!field) {
      return false;
    }

    const files =
      field.files;

    const required =
      Boolean(
        options.required
      );

    if (
      !files ||
      files.length === 0
    ) {

      if (required) {

        return showFieldError(
          field,
          options.message ||
          "Please select a file."
        );

      }

      clearFieldError(
        field
      );

      return true;

    }


    const maxSize =
      Number(
        options.maxSize ||
        CONFIG.maxFileSize
      );


    const allowedTypes =
      options.allowedMimeTypes ||
      CONFIG.allowedMimeTypes;


    const allowedExtensions =
      options.allowedExtensions ||
      CONFIG.allowedExtensions;


    if (
      options.maxFiles &&
      files.length >
      Number(options.maxFiles)
    ) {

      return showFieldError(
        field,
        `You can upload a maximum of ${options.maxFiles} files.`
      );

    }


    for (
      const file
      of files
    ) {

      if (
        file.size >
        maxSize
      ) {

        return showFieldError(
          field,
          `${file.name} exceeds the maximum file size of ${Math.round(
            maxSize / 1024 / 1024
          )} MB.`
        );

      }


      if (
        allowedTypes.length &&
        file.type &&
        !allowedTypes.includes(
          file.type
        )
      ) {

        return showFieldError(
          field,
          `${file.name} has an unsupported file type.`
        );

      }


      const extension =
        "." +
        file.name
          .split(".")
          .pop()
          .toLowerCase();


      if (
        allowedExtensions.length &&
        !allowedExtensions.includes(
          extension
        )
      ) {

        return showFieldError(
          field,
          `${file.name} has an unsupported file extension.`
        );

      }

    }


    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     DATE
  ======================================================== */

  Validation.date = function (
    field,
    options = {}
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (
      !value &&
      !options.required
    ) {

      clearFieldError(
        field
      );

      return true;

    }

    if (!value) {

      return showFieldError(
        field,
        "Date is required."
      );

    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return showFieldError(
        field,
        "Enter a valid date."
      );

    }

    if (
      options.min
    ) {

      const minDate =
        new Date(
          options.min
        );

      if (
        date < minDate
      ) {

        return showFieldError(
          field,
          "Selected date is too early."
        );

      }

    }

    if (
      options.max
    ) {

      const maxDate =
        new Date(
          options.max
        );

      if (
        date > maxDate
      ) {

        return showFieldError(
          field,
          "Selected date is too late."
        );

      }

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     SELECT
  ======================================================== */

  Validation.select = function (
    field,
    message = "Please select an option."
  ) {

    if (!field) {
      return false;
    }

    if (
      !normalize(
        field.value
      )
    ) {

      return showFieldError(
        field,
        message
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     CHECKBOX
  ======================================================== */

  Validation.checkbox = function (
    field,
    message =
      "You must accept this option."
  ) {

    if (!field) {
      return false;
    }

    if (!field.checked) {

      return showFieldError(
        field,
        message
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     APPLICATION ID
  ======================================================== */

  Validation.applicationId = function (
    field
  ) {

    const value =
      normalize(
        getValue(field)
      );

    if (!value) {

      return showFieldError(
        field,
        "Application ID is required."
      );

    }

    if (
      !patterns.applicationId.test(
        value
      )
    ) {

      return showFieldError(
        field,
        "Invalid application ID."
      );

    }

    clearFieldError(
      field
    );

    return true;

  };


  /* ========================================================
     GENERIC FIELD VALIDATION
  ======================================================== */

  Validation.field = function (
    field
  ) {

    if (!field) {
      return true;
    }

    const required =
      field.required ||
      field.dataset.required ===
      "true";


    if (
      required &&
      field.type !== "file"
    ) {

      if (
        !Validation.required(
          field
        )
      ) {

        return false;

      }

    }


    if (
      field.type ===
      "file"
    ) {

      return Validation.file(
        field,
        {
          required
        }
      );

    }


    const type =
      String(
        field.dataset.validate ||
        field.type ||
        ""
      ).toLowerCase();


    switch (type) {

      case "email":

        return Validation.email(
          field,
          required
        );


      case "phone":

        return Validation.phone(
          field,
          required
        );


      case "indian-phone":

        return Validation.indianPhone(
          field,
          required
        );


      case "name":

        return Validation.name(
          field,
          required
        );


      case "pincode":

        return Validation.pincode(
          field,
          required
        );


      case "url":

        return Validation.url(
          field,
          required
        );


      case "number":

        return Validation.number(
          field,
          {
            required,
            min:
              field.dataset.min,
            max:
              field.dataset.max
          }
        );


      case "password":

        return Validation.password(
          field,
          {
            required
          }
        );


      case "date":

        return Validation.date(
          field,
          {
            required
          }
        );


      case "select-one":

        return required
          ? Validation.select(
              field
            )
          : true;


      case "checkbox":

        return required
          ? Validation.checkbox(
              field
            )
          : true;


      default:

        return true;

    }

  };


  /* ========================================================
     FORM VALIDATION
  ======================================================== */

  Validation.form = function (
    form,
    options = {}
  ) {

    if (!form) {
      return false;
    }

    clearFormErrors(
      form
    );

    let valid =
      true;

    let firstInvalid =
      null;


    const fields =
      form.querySelectorAll(
        "input, select, textarea"
      );


    fields.forEach(
      (field) => {

        const result =
          Validation.field(
            field
          );

        if (!result) {

          valid =
            false;

          if (!firstInvalid) {

            firstInvalid =
              field;

          }

        }

      }
    );


    if (
      typeof options.custom ===
      "function"
    ) {

      const customResult =
        options.custom(
          form
        );

      if (
        customResult === false
      ) {

        valid =
          false;

      }

    }


    if (!valid) {

      showFormError(
        form,
        options.message ||
        "Please correct the highlighted fields."
      );


      if (
        options.focus !== false &&
        firstInvalid
      ) {

        try {

          firstInvalid.focus();

          firstInvalid.scrollIntoView({
            behavior:
              "smooth",
            block:
              "center"
          });

        } catch {}

      }

    }

    return valid;

  };


  /* ========================================================
     FORM SUBMISSION PROTECTION
  ======================================================== */

  const submittingForms =
    new WeakSet();


  Validation.preventDuplicateSubmit =
    function (
      form
    ) {

      if (!form) {
        return false;
      }

      if (
        submittingForms.has(
          form
        )
      ) {

        return false;

      }

      submittingForms.add(
        form
      );

      form.dataset.submitting =
        "true";

      return true;

    };


  Validation.allowSubmitAgain =
    function (
      form
    ) {

      if (!form) {
        return;
      }

      submittingForms.delete(
        form
      );

      delete form.dataset.submitting;

    };


  /* ========================================================
     AUTOMATIC FORM HANDLING
  ======================================================== */

  function initializeForms() {

    document
      .querySelectorAll(
        "form[data-validation]"
      )
      .forEach(
        (form) => {

          form.addEventListener(
            "submit",
            (event) => {

              const valid =
                Validation.form(
                  form
                );

              if (!valid) {

                event.preventDefault();

                return;

              }

              if (
                !Validation.preventDuplicateSubmit(
                  form
                )
              {

                event.preventDefault();

                return;

              }

            }
          );

        }
      );

  }


  /* ========================================================
     LIVE VALIDATION
  ======================================================== */

  function initializeLiveValidation() {

    document.addEventListener(
      "blur",
      (event) => {

        const field =
          event.target;

        if (
          !field.matches(
            "input, select, textarea"
          )
        ) {

          return;

        }

        if (
          field.dataset.validateLive !==
          "true"
        ) {

          return;

        }

        Validation.field(
          field
        );

      },
      true
    );

  }


  /* ========================================================
     STYLES
  ======================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "validation-styles"
      )
    ) {

      return;

    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "validation-styles";

    style.textContent =
      `

      .is-invalid {
        border-color: #b42318 !important;
        outline-color: #b42318 !important;
      }

      .validation-error {
        animation:
          validationFadeIn .15s ease;
      }

      @keyframes validationFadeIn {

        from {
          opacity: 0;
          transform:
            translateY(-3px);
        }

        to {
          opacity: 1;
          transform:
            translateY(0);
        }

      }

      `;

    document.head.appendChild(
      style
    );

  }


  /* ========================================================
     PUBLIC CONFIG
  ======================================================== */

  Validation.config =
    CONFIG;

  Validation.patterns =
    patterns;

  Validation.clearFieldError =
    clearFieldError;

  Validation.showFieldError =
    showFieldError;

  Validation.clearFormErrors =
    clearFormErrors;

  Validation.showFormError =
    showFormError;


  /* ========================================================
     INITIALIZATION
  ======================================================== */

  function initialize() {

    injectStyles();

    initializeForms();

    initializeLiveValidation();

    window.Validation =
      Validation;

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
