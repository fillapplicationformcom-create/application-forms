/* =========================================================
   APPLICATION FORMS
   permissions.js
   ---------------------------------------------------------
   Handles browser permission checks safely.
   No permission is requested automatically.
   Permissions are requested only after user interaction.
   ========================================================= */

(function () {
    "use strict";

    const Permissions = {
        state: {
            notification: "unknown",
            camera: "unknown",
            microphone: "unknown",
            location: "unknown"
        },

        /* -------------------------------------------------
           Utility
        ------------------------------------------------- */

        getStatusElement(id) {
            return document.getElementById(id);
        },

        setStatus(id, status, message) {
            const element = this.getStatusElement(id);

            if (!element) return;

            element.textContent = message || status;

            element.dataset.status = status;

            element.classList.remove(
                "permission-granted",
                "permission-denied",
                "permission-pending",
                "permission-unknown"
            );

            if (status === "granted") {
                element.classList.add("permission-granted");
            } else if (status === "denied") {
                element.classList.add("permission-denied");
            } else if (status === "pending") {
                element.classList.add("permission-pending");
            } else {
                element.classList.add("permission-unknown");
            }
        },

        /* -------------------------------------------------
           Notification
        ------------------------------------------------- */

        async requestNotifications() {
            if (!("Notification" in window)) {
                this.state.notification = "unsupported";

                this.setStatus(
                    "notificationPermission",
                    "unknown",
                    "Notifications not supported"
                );

                return false;
            }

            try {
                const permission = await Notification.requestPermission();

                this.state.notification = permission;

                this.setStatus(
                    "notificationPermission",
                    permission,
                    permission === "granted"
                        ? "Notifications allowed"
                        : "Notifications not allowed"
                );

                return permission === "granted";
            } catch (error) {
                console.error("Notification permission error:", error);

                this.state.notification = "error";

                this.setStatus(
                    "notificationPermission",
                    "denied",
                    "Notification permission unavailable"
                );

                return false;
            }
        },

        /* -------------------------------------------------
           Camera
        ------------------------------------------------- */

        async requestCamera() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.state.camera = "unsupported";

                this.setStatus(
                    "cameraPermission",
                    "unknown",
                    "Camera not supported"
                );

                return false;
            }

            let stream = null;

            try {
                this.setStatus(
                    "cameraPermission",
                    "pending",
                    "Requesting camera permission..."
                );

                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });

                this.state.camera = "granted";

                this.setStatus(
                    "cameraPermission",
                    "granted",
                    "Camera permission granted"
                );

                stream.getTracks().forEach(track => track.stop());

                return true;
            } catch (error) {
                console.error("Camera permission error:", error);

                this.state.camera = "denied";

                this.setStatus(
                    "cameraPermission",
                    "denied",
                    "Camera permission denied"
                );

                return false;
            } finally {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        },

        /* -------------------------------------------------
           Microphone
        ------------------------------------------------- */

        async requestMicrophone() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.state.microphone = "unsupported";

                this.setStatus(
                    "microphonePermission",
                    "unknown",
                    "Microphone not supported"
                );

                return false;
            }

            let stream = null;

            try {
                this.setStatus(
                    "microphonePermission",
                    "pending",
                    "Requesting microphone permission..."
                );

                stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });

                this.state.microphone = "granted";

                this.setStatus(
                    "microphonePermission",
                    "granted",
                    "Microphone permission granted"
                );

                stream.getTracks().forEach(track => track.stop());

                return true;
            } catch (error) {
                console.error("Microphone permission error:", error);

                this.state.microphone = "denied";

                this.setStatus(
                    "microphonePermission",
                    "denied",
                    "Microphone permission denied"
                );

                return false;
            } finally {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        },

        /* -------------------------------------------------
           Location
        ------------------------------------------------- */

        async requestLocation() {
            if (!navigator.geolocation) {
                this.state.location = "unsupported";

                this.setStatus(
                    "locationPermission",
                    "unknown",
                    "Location not supported"
                );

                return false;
            }

            return new Promise(resolve => {
                this.setStatus(
                    "locationPermission",
                    "pending",
                    "Requesting location permission..."
                );

                navigator.geolocation.getCurrentPosition(
                    () => {
                        this.state.location = "granted";

                        this.setStatus(
                            "locationPermission",
                            "granted",
                            "Location permission granted"
                        );

                        resolve(true);
                    },

                    error => {
                        console.error(
                            "Location permission error:",
                            error
                        );

                        this.state.location = "denied";

                        this.setStatus(
                            "locationPermission",
                            "denied",
                            "Location permission denied"
                        );

                        resolve(false);
                    },

                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            });
        },

        /* -------------------------------------------------
           Browser Permission API
        ------------------------------------------------- */

        async checkPermission(name) {
            if (!navigator.permissions) {
                return "unknown";
            }

            try {
                const result = await navigator.permissions.query({
                    name: name
                });

                return result.state;
            } catch (error) {
                return "unknown";
            }
        },

        async checkAll() {
            const checks = [
                ["notification", "notifications"],
                ["camera", "camera"],
                ["microphone", "microphone"],
                ["location", "geolocation"]
            ];

            for (const [key, permissionName] of checks) {
                try {
                    const status = await this.checkPermission(permissionName);

                    this.state[key] = status;

                    const elementMap = {
                        notification: "notificationPermission",
                        camera: "cameraPermission",
                        microphone: "microphonePermission",
                        location: "locationPermission"
                    };

                    this.setStatus(
                        elementMap[key],
                        status,
                        status === "granted"
                            ? "Permission granted"
                            : status === "denied"
                            ? "Permission denied"
                            : "Permission not requested"
                    );
                } catch (error) {
                    console.error(
                        `Permission check failed: ${key}`,
                        error
                    );
                }
            }

            return { ...this.state };
        },

        /* -------------------------------------------------
           Attach buttons
        ------------------------------------------------- */

        bindButtons() {
            const notificationButton =
                document.getElementById("requestNotificationPermission");

            const cameraButton =
                document.getElementById("requestCameraPermission");

            const microphoneButton =
                document.getElementById("requestMicrophonePermission");

            const locationButton =
                document.getElementById("requestLocationPermission");

            if (notificationButton) {
                notificationButton.addEventListener("click", () => {
                    this.requestNotifications();
                });
            }

            if (cameraButton) {
                cameraButton.addEventListener("click", () => {
                    this.requestCamera();
                });
            }

            if (microphoneButton) {
                microphoneButton.addEventListener("click", () => {
                    this.requestMicrophone();
                });
            }

            if (locationButton) {
                locationButton.addEventListener("click", () => {
                    this.requestLocation();
                });
            }
        },

        /* -------------------------------------------------
           Initialise
        ------------------------------------------------- */

        async init() {
            await this.checkAll();
            this.bindButtons();

            window.ApplicationPermissions = this;
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        Permissions.init();
    });

})();