// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Token speichern
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", email);

      // Overlay anpassen
      document.getElementById("login-form").style.display = "none";
      document.getElementById("register-form").style.display = "none";
      document.getElementById("reset-form").style.display = "none";

      const dashboard = document.getElementById("user-dashboard");
      dashboard.style.display = "block";
      document.getElementById("user-title").textContent = "Your Account";

      document.getElementById("user-email").textContent = email;
      document.getElementById("user-token").value = data.token;
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Login failed (network error)");
  }
});

// REGISTER
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll("input");
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const confirm = inputs[3].value;

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful! Token: " + data.token);
        // Optional: token speichern
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Registration failed (network error)");
    }
  });

// RESET PASSWORD (API muss noch implementiert werden)
document.getElementById("reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;

  try {
    const res = await fetch("/api/password-reset", {
      // Stelle sicher, dass diese Route existiert
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password reset email sent!");
    } else {
      alert(data.message || "Password reset failed");
    }
  } catch (err) {
    console.error(err);
    alert("Password reset failed (network error)");
  }
});
