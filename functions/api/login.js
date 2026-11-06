
export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            username.length > 20 ||
            password.length > 128
        ) {
            return Response.json(
                { message: "Data tidak valid." },
                { status: 400 }
            );
        }

        if (!env.SESSION_SECRET) {
            return Response.json(
                { message: "Konfigurasi server belum lengkap." },
                { status: 500 }
            );
        }

        // Cari akun berdasarkan username
        const user = await env.DB.prepare(
            "SELECT id, username, password_hash, salt FROM users WHERE username = ?"
        ).bind(username.trim()).first();

        if (!user) {
            return Response.json(
                { message: "Username atau password salah." },
                { status: 401 }
            );
        }

        // Hitung ulang hash password
        const encoder = new TextEncoder();

        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

        const calculatedHash = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: Uint8Array.from(
                    user.salt.match(/.{2}/g),
                    byte => parseInt(byte, 16)
                ),
                iterations: 100000,
                hash: "SHA-256"
            },
            key,
            256
        );

        const calculatedHex = Array.from(
            new Uint8Array(calculatedHash)
        ).map(b => b.toString(16).padStart(2, "0")).join("");

        if (calculatedHex !== user.password_hash) {
            return Response.json(
                { message: "Username atau password salah." },
                { status: 401 }
            );
        }

        // Membuat sesi login yang ditandatangani server
        const payload = {
            id: user.id,
            username: user.username,
            exp: Math.floor(Date.now() / 1000) + 86400
        };

        /**
         * @param {string} value
         * @returns {string}
         */
          function toBase64Url(value) {
              return btoa(value)
                  .replace(/\+/g, "-")
                  .replace(/\//g, "_")
                  .replace(/=+$/, "");
          }

        const payloadText = toBase64Url(
            JSON.stringify(payload)
        );

        const secretKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(env.SESSION_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign(
            "HMAC",
            secretKey,
            encoder.encode(payloadText)
        );

        const signatureText = toBase64Url(
            String.fromCharCode(
                ...new Uint8Array(signature)
            )
        );

        const token = payloadText + "." + signatureText;

        return Response.json(
            {
                message: "Login berhasil!",
                username: user.username
            },
            {
                headers: {
                    "Set-Cookie":
                        `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
                }
            }
        );

    } catch (error) {
        return Response.json(
            { message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
 }
              
