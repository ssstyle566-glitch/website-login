
/**
 * @param {string} password
 * @returns {Promise<{salt: string, hash: string}>}
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();

    const salt = crypto.getRandomValues(
        new Uint8Array(16)
    );

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        key,
        256
    );

    /**
     * @param {Uint8Array} bytes
     * @returns {string}
     */
    function toHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    return {
        salt: toHex(salt),
        hash: toHex(new Uint8Array(hash))
    };
}


export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            return Response.json(
                { message: "Data tidak valid." },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim();

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
            return Response.json(
                { message: "Username harus 3-20 karakter." },
                { status: 400 }
            );
        }

        if (password.length < 8 || password.length > 128) {
            return Response.json(
                { message: "Password harus 8-128 karakter." },
                { status: 400 }
            );
        }

        const { salt, hash } = await hashPassword(password);

        await env.DB.prepare(`
            INSERT INTO users
            (username, password_hash, salt)
            VALUES (?, ?, ?)
        `).bind(
            cleanUsername,
            hash,
            salt
        ).run();

        return Response.json({
            message: "Registrasi berhasil!"
        });

    } catch (error) {
        if (
            error.message &&
            error.message.toLowerCase().includes("unique")
        ) {
            return Response.json(
                { message: "Username sudah digunakan." },
                { status: 409 }
            );
        }

        return Response.json(
            { message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
      }
          
