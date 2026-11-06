export async function onRequestGet({ request, env }) {
    try {
        const cookie = request.headers.get("Cookie") || "";
        const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);

        if (!match || !env.SESSION_SECRET) {
            return Response.json(
                { loggedIn: false },
                { status: 401 }
            );
        }

        const [payloadText, signatureText] = match[1].split(".");

        if (!payloadText || !signatureText) {
            return Response.json(
                { loggedIn: false },
                { status: 401 }
            );
        }

        function fromBase64Url(value) {
            const base64 = value
                .replace(/-/g, "+")
                .replace(/_/g, "/");
            return Uint8Array.from(
                atob(base64 + "=".repeat((4 - base64.length % 4) % 4)),
                c => c.charCodeAt(0)
            );
        }

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(env.SESSION_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            fromBase64Url(signatureText),
            new TextEncoder().encode(payloadText)
        );

        if (!valid) {
            return Response.json(
                { loggedIn: false },
                { status: 401 }
            );
        }

        const payload = JSON.parse(
            new TextDecoder().decode(fromBase64Url(payloadText))
        );

        if (!payload.id || !payload.username ||
            !Number.isFinite(payload.exp) ||
            payload.exp <= Math.floor(Date.now() / 1000)) {
            return Response.json(
                { loggedIn: false },
                { status: 401 }
            );
        }

        return Response.json({
            loggedIn: true,
            username: payload.username
        });

    } catch {
        return Response.json(
            { loggedIn: false },
            { status: 401 }
        );
    }
              }
