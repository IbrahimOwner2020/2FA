import { Database } from "bun:sqlite";
import * as speakeasy from "speakeasy";
import { generateQRCode } from "./utils";

const db = new Database("mydb.sqlite", { create: true });
db.exec(
	"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, secret TEXT, password TEXT)"
);

console.log("Server running port 8000!");

Bun.serve({
	port: 8000,
	hostname: "localhost",
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname === "/register" && req.method === "POST") {
			const { email, password } = (await req.json()) as {
				email: string;
				password: string;
			};

			const secret = speakeasy.generateSecret({ length: 20 });
			console.log(secret.base32);
			const qrCodeImageUrl = await generateQRCode(secret.base32, email);

			db.prepare(
				"INSERT INTO users (email, secret, password) VALUES (?, ?, ?)"
			).run(email, secret.base32, password);

			return new Response(qrCodeImageUrl, {
				status: 200,
				headers: {
					"Content-Type": "image/png",
				},
			});
		}

		if (url.pathname === "/verify" && req.method === "POST") {
			const { email, token } = (await req.json()) as {
				email: string;
				token: string;
			};

            console.log(email, token);

			const user = db
				.prepare("SELECT * FROM users WHERE email = ?")
				.get(email);

            console.log(user);

			if (!user) {
				return new Response("User not found", { status: 404 });
			}

			const verified = speakeasy.totp.verify({
				secret: user.secret,
				encoding: "base32",
				token: token,
			});

            console.log(verified);

            // const verified = true;

			if (verified) {
				return new Response("Token verified!", { status: 200 });
			} else {
				return new Response("Token verification failed", {
					status: 400,
				});
			}
		}
		return new Response("Hello 2FA!");
	},
});
