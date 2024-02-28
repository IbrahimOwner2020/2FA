import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

const generateQRCode = async (secret: string, email: string) => {
	const otpauthUrl = speakeasy.otpauthURL({
		secret: secret,
		label: `Rusty2FA:${email}`,
		issuer: "Rusty2FA",
	});

	try {
		const qrCodeImageUrl = await QRCode.toDataURL(otpauthUrl);
		console.log(qrCodeImageUrl);
		const base64Data = qrCodeImageUrl.split(",")[1];
		const imgBuffer = Buffer.from(base64Data, "base64");
		return imgBuffer;
	} catch (error) {
		console.error("Error generating QR code", error);
	}
};

const verifyToken = (userSecret: string, userToken: string) => {
	const verified = speakeasy.totp.verify({
		secret: userSecret,
		encoding: "base32",
		token: userToken,
	});

	return verified;
};

export { generateQRCode, verifyToken };
