"use strict";

const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");

    if (!form) {
        console.error("adminLoginForm not found");
        return;
    }

    const tokenInput =
        document.getElementById("adminToken") ||
        document.getElementById("token") ||
        document.querySelector(
            'input[name="token"]'
        );

    const message =
        document.getElementById("loginMessage") ||
        document.getElementById("message") ||
        document.getElementById("errorMessage");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!tokenInput) {
            showMessage(
                "Administrator token field not found.",
                true
            );
            return;
        }

        const token =
            String(tokenInput.value || "").trim();

        if (!token) {
            showMessage(
                "Please enter the administrator token.",
                true
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE}/admin/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({
                        token: token
                    })
                }
            );

            const text =
                await response.text();

            let data = {};

            try {
                data = text
                    ? JSON.parse(text)
                    : {};
            } catch {
                data = {
                    error:
                        text ||
                        "Invalid server response."
                };
            }

            console.log(
                "Login response:",
                response.status,
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    `Login failed (${response.status}).`
                );
            }

            if (
                !data.success ||
                !data.token
            ) {
                throw new Error(
                    data.error ||
                    "Server did not return an administrator session."
                );
            }

            sessionStorage.setItem(
                "adminToken",
                data.token
            );

            localStorage.setItem(
                "adminToken",
                data.token
            );

            showMessage(
                "Login successful. Redirecting...",
                false
            );

            window.location.href =
                "/admin.html";

        } catch (error) {

            console.error(
                "Administrator login error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to connect to the server.",
                true
            );

        } finally {
            setLoading(false);
        }
    });

    async function checkHealth() {
        try {
            const response =
                await fetch(
                    `${API_BASE}/health`,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        },
                        cache: "no-store"
                    }
                );

            const data =
                await response.json();

            console.log(
                "API health:",
                data
            );

            if (!response.ok) {
                showMessage(
                    "API server is not healthy.",
                    true
                );
            }

        } catch (error) {

            console.error(
                "API health check failed:",
                error
            );

            showMessage(
                "Cannot connect to the API server.",
                true
            );
        }
    }

    function showMessage(
        text,
        isError
    ) {
        if (!message) {
            alert(text);
            return;
        }

        message.textContent = text;

        message.style.display =
            "block";

        message.style.color =
            isError
                ? "#b42318"
                : "#067647";
    }

    function setLoading(
        loading
    ) {
        const button =
            form.querySelector(
                'button[type="submit"]'
            );

        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText =
                button.textContent;
            button.textContent =
                "Signing in...";
        } else {
            button.disabled = false;
            button.textContent =
                button.dataset.originalText ||
                "Login";
        }
    }

    checkHealth();
});