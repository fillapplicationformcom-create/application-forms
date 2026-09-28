/* =========================================================
   APPLICATION FORMS
   storage.js
   ---------------------------------------------------------
   Central local-storage manager for application data.
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEYS = {
        APPLICATION: "applicationFormData",
        APPLICATIONS: "applicationFormSubmissions",
        DRAFT: "applicationFormDraft",
        SETTINGS: "applicationFormSettings"
    };

    const StorageManager = {

        /* -------------------------------------------------
           Safe JSON helpers
        ------------------------------------------------- */

        parse(value, fallback = null) {
            if (!value) return fallback;

            try {
                return JSON.parse(value);
            } catch (error) {
                console.error("Storage JSON parse error:", error);
                return fallback;
            }
        },

        stringify(value) {
            try {
                return JSON.stringify(value);
            } catch (error) {
                console.error("Storage JSON stringify error:", error);
                return null;
            }
        },

        /* -------------------------------------------------
           Generic storage
        ------------------------------------------------- */

        set(key, value) {
            try {
                const encoded = this.stringify(value);

                if (encoded === null) {
                    return false;
                }

                localStorage.setItem(key, encoded);
                return true;

            } catch (error) {
                console.error("Unable to save storage:", error);
                return false;
            }
        },

        get(key, fallback = null) {
            try {
                const value = localStorage.getItem(key);

                return this.parse(value, fallback);

            } catch (error) {
                console.error("Unable to read storage:", error);
                return fallback;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error("Unable to remove storage:", error);
                return false;
            }
        },

        clearAll() {
            try {
                Object.values(STORAGE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });

                return true;

            } catch (error) {
                console.error("Unable to clear application storage:", error);
                return false;
            }
        },

        /* -------------------------------------------------
           Application draft
        ------------------------------------------------- */

        saveDraft(data) {
            return this.set(STORAGE_KEYS.DRAFT, {
                data: data,
                savedAt: new Date().toISOString()
            });
        },

        getDraft() {
            const draft = this.get(STORAGE_KEYS.DRAFT, null);

            if (!draft || !draft.data) {
                return null;
            }

            return draft;
        },

        clearDraft() {
            return this.remove(STORAGE_KEYS.DRAFT);
        },

        /* -------------------------------------------------
           Current application
        ------------------------------------------------- */

        saveApplication(data) {
            const application = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            return this.set(
                STORAGE_KEYS.APPLICATION,
                application
            );
        },

        getApplication() {
            return this.get(
                STORAGE_KEYS.APPLICATION,
                null
            );
        },

        clearApplication() {
            return this.remove(
                STORAGE_KEYS.APPLICATION
            );
        },

        /* -------------------------------------------------
           Application submissions
        ------------------------------------------------- */

        getSubmissions() {
            const submissions = this.get(
                STORAGE_KEYS.APPLICATIONS,
                []
            );

            return Array.isArray(submissions)
                ? submissions
                : [];
        },

        addSubmission(data) {
            const submissions = this.getSubmissions();

            const submission = {
                id: this.generateId(),
                data: data,
                submittedAt: new Date().toISOString(),
                status: "submitted"
            };

            submissions.push(submission);

            const saved = this.set(
                STORAGE_KEYS.APPLICATIONS,
                submissions
            );

            return saved ? submission : null;
        },

        getSubmission(id) {
            const submissions = this.getSubmissions();

            return submissions.find(
                item => item.id === id
            ) || null;
        },

        deleteSubmission(id) {
            const submissions = this.getSubmissions();

            const filtered = submissions.filter(
                item => item.id !== id
            );

            return this.set(
                STORAGE_KEYS.APPLICATIONS,
                filtered
            );
        },

        clearSubmissions() {
            return this.remove(
                STORAGE_KEYS.APPLICATIONS
            );
        },

        /* -------------------------------------------------
           Settings
        ------------------------------------------------- */

        saveSettings(settings) {
            return this.set(
                STORAGE_KEYS.SETTINGS,
                settings
            );
        },

        getSettings() {
            return this.get(
                STORAGE_KEYS.SETTINGS,
                {}
            );
        },

        /* -------------------------------------------------
           ID generator
        ------------------------------------------------- */

        generateId() {
            if (
                typeof crypto !== "undefined" &&
                crypto.randomUUID
            ) {
                return crypto.randomUUID();
            }

            return (
                "APP-" +
                Date.now().toString(36) +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 10)
                    .toUpperCase()
            );
        },

        /* -------------------------------------------------
           Storage availability
        ------------------------------------------------- */

        isAvailable() {
            try {
                const testKey = "__storage_test__";

                localStorage.setItem(testKey, "1");
                localStorage.removeItem(testKey);

                return true;

            } catch (error) {
                return false;
            }
        },

        /* -------------------------------------------------
           Initialise
        ------------------------------------------------- */

        init() {
            window.ApplicationStorage = this;

            return this.isAvailable();
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        StorageManager.init();
    });

})();