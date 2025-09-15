document.addEventListener("DOMContentLoaded", () => {
  // Check for existing session on load
  checkSession();

  // Login
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
      console.log("Attempting login for:", email);
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        if (!data.access_token || !data.refresh_token || !data.expires_in) {
          console.error("Invalid login response, missing tokens:", data);
          alert("Login failed: Invalid response from server");
          return;
        }

        // Store tokens securely
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            userEmail: email,
            tokenExpires: Date.now() + data.expires_in * 1000
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
        console.log("Tokens stored successfully:", { email, accessToken: data.access_token });
        showDashboard(email, data.access_token);
      } else {
        console.error("Login failed:", data.message);
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed (network error)");
    }
  });

  // Register
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const confirm = inputs[3].value;

    if (password !== confirm) {
      console.warn("Passwords do not match");
      alert("Passwords do not match");
      return;
    }

    try {
      console.log("Attempting registration for:", email);
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      console.log("Register response:", data);

      if (res.ok) {
        if (!data.access_token || !data.refresh_token || !data.expires_in) {
          console.error("Invalid register response, missing tokens:", data);
          alert("Registration failed: Invalid response from server");
          return;
        }

        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            userEmail: email,
            tokenExpires: Date.now() + data.expires_in * 1000
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
        console.log("Tokens stored successfully:", { email, accessToken: data.access_token });
        showDashboard(email, data.access_token);
      } else {
        console.error("Registration failed:", data.message);
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed (network error)");
    }
  });

  // Reset Password
  document.getElementById("reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    try {
      console.log("Sending password reset for:", email);
      const res = await fetch("http://127.0.0.1:8000/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("Password reset response:", data);

      if (res.ok) {
        alert("Password reset email sent!");
      } else {
        console.error("Password reset failed:", data.message);
        alert(data.message || "Password reset failed");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      alert("Password reset failed (network error)");
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      const { accessToken } = await chrome.storage.local.get("accessToken");
      console.log("Logging out, accessToken:", accessToken);
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      await chrome.storage.local.remove(["accessToken", "refreshToken", "userEmail", "tokenExpires"]);
      console.log("Logout successful, tokens cleared");
      showLogin();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed");
    }
  });

  // Check session on load
  async function checkSession() {
    try {
      const storage = await chrome.storage.local.get(["accessToken", "tokenExpires", "userEmail", "refreshToken"]);
      console.log("Checking session:", storage);

      if (storage.accessToken && storage.tokenExpires > Date.now()) {
        // Validate token
        console.log("Validating token:", storage.accessToken);
        const res = await fetch("http://127.0.0.1:8000/api/validate-token", {
          method: "GET",
          headers: { "Authorization": `Bearer ${storage.accessToken}` }
        });

        if (res.ok) {
          console.log("Token valid, showing dashboard for:", storage.userEmail);
          showDashboard(storage.userEmail, storage.accessToken);
          return;
        } else {
          const errorText = await res.text();
          console.warn("Token validation failed:", res.status, errorText);
        }
      }

      // If token is expired or invalid, try to refresh
      if (storage.accessToken) {
        console.log("Token expired or invalid, attempting to refresh...");
        await refreshToken();
      } else {
        console.log("No access token found, showing login");
        showLogin();
      }
    } catch (err) {
      console.error("Session check error:", err);
      showLogin();
    }
  }

  // Refresh token
  async function refreshToken() {
    try {
      const { refreshToken } = await chrome.storage.local.get("refreshToken");
      console.log("Refreshing token:", { refreshToken });

      if (!refreshToken) {
        console.log("No refresh token, showing login");
        showLogin();
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const data = await res.json();
      console.log("Refresh response:", data);

      if (res.ok) {
        if (!data.access_token || !data.refresh_token || !data.expires_in) {
          console.error("Invalid refresh response, missing tokens:", data);
          await chrome.storage.local.remove(["accessToken", "refreshToken", "userEmail", "tokenExpires"]);
          showLogin();
          return;
        }

        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            tokenExpires: Date.now() + data.expires_in * 1000
          }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
        const { userEmail } = await chrome.storage.local.get("userEmail");
        console.log("Token refreshed successfully, showing dashboard for:", userEmail);
        showDashboard(userEmail, data.access_token);
      } else {
        console.warn("Refresh token failed:", data.message);
        await chrome.storage.local.remove(["accessToken", "refreshToken", "userEmail", "tokenExpires"]);
        showLogin();
      }
    } catch (err) {
      console.error("Refresh token error:", err);
      await chrome.storage.local.remove(["accessToken", "refreshToken", "userEmail", "tokenExpires"]);
      showLogin();
    }
  }

  // Show dashboard
  function showDashboard(email, token) {
    console.log("Showing dashboard for:", email);
    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "none";
    document.getElementById("reset-form").style.display = "none";
    document.getElementById("user-dashboard").style.display = "block";
    document.getElementById("user-title").textContent = "Your Account";
    document.getElementById("user-email").textContent = email;
    document.getElementById("user-token").value = token;
    enableAccountFeatures();
  }

  // Show login form
  function showLogin() {
    console.log("Showing login form");
    document.getElementById("login-form").style.display = "block";
    document.getElementById("register-form").style.display = "none";
    document.getElementById("reset-form").style.display = "none";
    document.getElementById("user-dashboard").style.display = "none";
    disableAccountFeatures();
  }

  // Enable account features
  function enableAccountFeatures() {
    console.log("Enabling account features");
    document.querySelectorAll(".main-content, .plus-btn, .side-nav").forEach(el => {
      el.style.display = "block";
    });
    // Add data loading logic here (e.g., call promptManagement.js)
    if (typeof loadPrompts === "function") {
      console.log("Loading prompts...");
    } else {
      console.warn("loadPrompts function not found, data may not load");
    }
  }

  // Disable account features
  function disableAccountFeatures() {
    console.log("Disabling account features");
    document.querySelectorAll(".main-content, .plus-btn, .side-nav").forEach(el => {
      el.style.display = "none";
    });
  }
});