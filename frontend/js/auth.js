const BASE_URL = "http://127.0.0.1:8000";

/* TAB SWITCH */
function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
}

function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("registerTab").classList.add("active");
}

/* LOGIN */
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user", JSON.stringify({ email }));

      showMessage("Login successful ✅", "#10b981");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showMessage(data.detail || "Login failed ❌", "#ef4444");
    }

  } catch (err) {
    showMessage("Server error ❌", "#ef4444");
  }
}

/* DEMO LOGIN */
function demoLogin() {
  localStorage.setItem("token", "demo_token_stunning_review");
  localStorage.setItem("user_id", "demo_user_id");
  localStorage.setItem("username", "DemoReviewer");
  localStorage.setItem("user", JSON.stringify({ email: "demo@taskaligner.com" }));

  showMessage("Entering Demo Mode... 🚀", "#00ed64");

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
}

/* REGISTER */
async function register() {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("Registered successfully 🎉", "#10b981");
      showLogin();
    } else {
      showMessage(data.detail || "Registration failed ❌", "#ef4444");
    }

  } catch (err) {
    showMessage("Server error ❌", "#ef4444");
  }
}

/* MESSAGE */
function showMessage(msg, color) {
  const el = document.getElementById("message");
  el.innerText = msg;
  el.style.color = color;
}

// Background Movement
document.addEventListener('mousemove', (e) => {
  const movables = document.querySelectorAll('.movable');
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  movables.forEach((movable, index) => {
    const speed = (index + 1) * 20;
    movable.style.transform = `translate(${(x - 0.5) * speed}px, ${(y - 0.5) * speed}px)`;
  });
});

// Smooth Entrance Animation
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
});
