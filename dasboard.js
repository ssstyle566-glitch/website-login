// Periksa status login
async function checkLogin() {
    try {
        const response = await fetch("/api/me", {
            cache: "no-store"
        });

        if (!response.ok) {
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        if (!data.loggedIn) {
            window.location.href = "/";
            return;
        }

        const username = document.getElementById("username");

        if (username) {
            username.textContent = data.username;
        }

    } catch (error) {
        window.location.href = "/";
    }
}

// Jalankan pemeriksaan saat dashboard dibuka
checkLogin();
