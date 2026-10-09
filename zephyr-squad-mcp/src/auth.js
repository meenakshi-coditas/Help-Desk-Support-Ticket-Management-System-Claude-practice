import jwt from "jsonwebtoken";
import crypto from "node:crypto";

// Zephyr Squad Cloud uses the same JWT + QSH (query string hash) scheme as
// Atlassian Connect apps: the request's method/path/query are hashed into
// the token itself, so a token is only valid for the exact request it was
// minted for. See Atlassian's "Understanding JWT" docs for the canonical
// algorithm this mirrors, and SmartBear's own Zephyr Squad Cloud REST API
// docs for the `sub` (Atlassian AccountID) requirement.

function canonicalizeQueryParams(params) {
  const keys = Object.keys(params).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

function computeQsh(method, path, queryParams) {
  const canonicalPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const canonicalQuery = queryParams ? canonicalizeQueryParams(queryParams) : "";
  const canonical = `${method.toUpperCase()}&${canonicalPath}&${canonicalQuery}`;
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function signRequest({ accessKey, secretKey, accountId, method, path, queryParams }) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    sub: accountId,
    iss: accessKey,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    qsh: computeQsh(method, path, queryParams)
  };
  return jwt.sign(payload, secretKey, { algorithm: "HS256" });
}
