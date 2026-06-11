import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "brained_super_secret_key_123";

export interface TokenPayload {
  email: string;
  role: "admin" | "employee";
}

export const generateToken = (payload: TokenPayload): string => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${data}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return payload;
  } catch (error) {
    return null;
  }
};
