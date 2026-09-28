"use strict";

/*
===========================================================
 APPLICATION FORM MANAGEMENT SYSTEM
 Frontend Form Controller

 Responsibilities:
 - Form validation
 - File validation
 - FormData creation
 - API submission
 - Loading state
 - Error handling
 - Successful submission redirect
===========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

  const form =
    document.getElementById("applicationForm");

  const submitButton =
    document.getElementById("submitButton");

  const messageBox =
    document.getElementById("formMessage");

  const currentYear =
    document.getElementById("currentYear");


  /* =====================================================
     BASIC SAFETY CHECK
  ===================================================== */

  if (!form || !submitButton || !messageBox) {

    console.error(
      "Application form elements could not be found."
    );

    return;
  }


  /* =====================================================
     CURRENT YEAR
  ===================================================== */

  if (currentYear) {

    currentYear.textContent =
      new Date().getFullYear();

  }


  /* =====================================================
     DEFAULT SIGNATURE DATE
  ===================================================== */

  const signatureDate =
    document.getElementById(
      "signatureDate"
    );

  if (
    signatureDate &&
    !signatureDate.value
  ) {

    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    signatureDate.value =
      `${year}-${month}-${day}`;

  }


  /* =====================================================
     CONSTANTS
  ===================================================== */

  const MAX_FILE_SIZE =
    10 * 1024 * 1024;

  const MAX_DOCUMENT_FILES =
    15;

  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const allowedDocumentTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  const allowedResumeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];


  /* =====================================================
     MESSAGE HELPERS
  ===================================================== */

  function showMessage(
    text,
    type = "info"
  ) {

    messageBox.textContent =
      text;

    messageBox.className =
      `form-message show ${type}`;

  }


  function clearMessage() {

    messageBox.textContent =
      "";

    messageBox.className =
      "form-message";

  }


  /* =====================================================
     FILE VALIDATION
  ===================================================== */

  function validateFile(
    file,
    allowedTypes,
    label
  ) {

    if (!file) {
      return null;
    }


    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      return `${label} exceeds the 10 MB file-size limit.`;

    }


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      return `${label} has an unsupported file type.`;

    }


    return null;

  }


  function validateUploads() {

    const photoInput =
      document.getElementById(
        "photo"
      );

    const documentsInput =
      document.getElementById(
        "documents"
      );

    const resumeInput =
      document.getElementById(
        "resume"
      );


    /* ---------------------------------------------------
       PHOTO
    --------------------------------------------------- */

    if (
      photoInput &&
      photoInput.files.length > 0
    ) {

      const file =
        photoInput.files[0];

      const error =
        validateFile(
          file,
          allowedImageTypes,
          "Applicant photo"
        );

      if (error) {
        return error;
      }

    }


    /* ---------------------------------------------------
       DOCUMENTS
    --------------------------------------------------- */

    if (
      documentsInput &&
      documentsInput.files.length >
        MAX_DOCUMENT_FILES
    ) {

      return `You can upload a maximum of ${MAX_DOCUMENT_FILES} documents.`;

    }


    if (documentsInput) {

      for (
        const file
        of documentsInput.files
      ) {

        const error =
          validateFile(
            file,
            allowedDocumentTypes,
            "Document"
          );

        if (error) {
          return error;
        }

      }

    }


    /* ---------------------------------------------------
       RESUME
    --------------------------------------------------- */

    if (
      resumeInput &&
      resumeInput.files.length > 0
    ) {

      const file =
        resumeInput.files[0];

      const error =
        validateFile(
          file,
          allowedResumeTypes,
          "Resume"
        );

      if (error) {
        return error;
      }

    }


    return null;

  }


  /* =====================================================
     FORM VALIDATION
  ===================================================== */

  function validateForm() {

    clearMessage();


    if (
      !form.checkValidity()
    ) {

      form.reportValidity();

      showMessage(
        "Please complete all required fields.",
        "error"
      );

      return false;

    }


    const fullName =
      document.getElementById(
        "fullName"
      );


    if (
      fullName &&
      fullName.value.trim().length < 2
    ) {

      showMessage(
        "Please enter a valid full name.",
        "error"
      );

      fullName.focus();

      return false;

    }


    const phone =
      document.getElementById(
        "phone"
      );


    if (phone) {

      const phoneDigits =
        phone.value.replace(
          /\D/g,
          ""
        );

      if (
        phoneDigits.length < 7 ||
        phoneDigits.length > 15
      ) {

        showMessage(
          "Please enter a valid phone number.",
          "error"
        );

        phone.focus();

        return false;

      }

    }


    const uploadError =
      validateUploads();


    if (uploadError) {

      showMessage(
        uploadError,
        "error"
      );

      return false;

    }


    return true;

  }


  /* =====================================================
     SUBMIT BUTTON STATE
  ===================================================== */

  function setSubmitting(
    submitting
  ) {

    submitButton.disabled =
      submitting;


    if (submitting) {

      submitButton.dataset.originalText =
        submitButton.textContent;

      submitButton.textContent =
        "Submitting...";

    } else {

      submitButton.textContent =
        submitButton.dataset.originalText ||
        "Submit Application";

    }

  }


  /* =====================================================
     API ERROR EXTRACTION
  ===================================================== */

  async function getErrorMessage(
    response
  ) {

    try {

      const data =
        await response.json();

      if (
        data &&
        typeof data.error === "string"
      ) {

        return data.error;

      }

      if (
        data &&
        typeof data.message === "string"
      ) {

        return data.message;

      }

    } catch {

      /* Response was not JSON. */

    }


    return `Request failed with status ${response.status}.`;

  }


  /* =====================================================
     SUBMIT APPLICATION
  ===================================================== */

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (
        submitButton.disabled
      ) {

        return;

      }


      if (
        !validateForm()
      ) {

        return;

      }


      setSubmitting(true);


      showMessage(
        "Submitting your application securely...",
        "info"
      );


      try {

        /*
         * FormData automatically collects all
         * named form fields and selected files.
         *
         * The field names match server.js:
         *
         * photo
         * documents
         * resume
         */

        const formData =
          new FormData(form);


        /*
         * Do NOT manually set Content-Type.
         *
         * The browser automatically creates
         * the multipart/form-data boundary.
         */

        const response =
          await fetch(
            "/api/applications",
            {
              method: "POST",

              body: formData,

              credentials: "same-origin"
            }
          );


        if (!response.ok) {

          const errorMessage =
            await getErrorMessage(
              response
            );

          throw new Error(
            errorMessage
          );

        }


        const result =
          await response.json();


        if (
          !result.success ||
          !result.applicationId
        ) {

          throw new Error(
            "The server returned an invalid submission response."
          );

        }


        /*
         * Keep the application ID available
         * for success.html.
         */

        sessionStorage.setItem(
          "applicationId",
          result.applicationId
        );


        sessionStorage.setItem(
          "applicationUUID",
          result.id || ""
        );


        sessionStorage.setItem(
          "applicationStatus",
          result.status || "Submitted"
        );


        /*
         * Redirect applicant to the result page.
         */

        window.location.href =
          `/success.html?id=${encodeURIComponent(
            result.applicationId
          )}`;

      } catch (error) {

        console.error(
          "Application submission error:",
          error
        );


        showMessage(
          error.message ||
            "Unable to submit the application. Please try again.",
          "error"
        );


        setSubmitting(false);

      }

    }
  );


  /* =====================================================
     FILE INPUT FEEDBACK
  ===================================================== */

  function attachFileFeedback(
    inputId
  ) {

    const input =
      document.getElementById(
        inputId
      );

    if (!input) {
      return;
    }


    input.addEventListener(
      "change",
      () => {

        clearMessage();

        const count =
          input.files.length;


        if (count === 0) {
          return;
        }


        if (count === 1) {

          showMessage(
            `${input.files[0].name} selected.`,
            "info"
          );

        } else {

          showMessage(
            `${count} files selected.`,
            "info"
          );

        }

      }
    );

  }


  attachFileFeedback(
    "photo"
  );

  attachFileFeedback(
    "documents"
  );

  attachFileFeedback(
    "resume"
  );


  /* =====================================================
     PREVENT ACCIDENTAL DOUBLE SUBMISSION
  ===================================================== */

  window.addEventListener(
    "beforeunload",
    event => {

      if (
        submitButton.disabled
      ) {

        event.preventDefault();

        event.returnValue =
          "";

      }

    }
  );


});
