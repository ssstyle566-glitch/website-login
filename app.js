
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const message = document.getElementById("message");

// Berpindah ke Login
loginTab.addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    message.textContent = "";
});

// Berpindah ke Register
registerTab.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    message.textContent = "";
});

// Registrasi akun
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username =
        document.getElementById("registerUsername").value;

    const password =
        document.getElementById("registerPassword").value;

    message.textContent = "Menghubungkan ke server...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        message.textContent = result.message;

    } catch (error) {
        message.textContent = "Server belum tersedia.";
    }
});

// Login akun
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username =
        document.getElementById("loginUsername").value;

    const password =
        document.getElementById("loginPassword").value;

    message.textContent = "Memeriksa akun...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        message.textContent = result.message;

    } catch (error) {
        message.textContent = "Server belum tersedia.";
    }
});
