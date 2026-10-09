import { signRequest } from "./auth.js";

// Origin only — no path — since QSH signing needs the exact request path
// signed separately from the domain. Confirmed against SmartBear's own
// Zephyr Squad Cloud REST API docs: base is prod-api.zephyr4jiracloud.com,
// with "/connect" as part of the actual request path (include it in every
// path passed to request(), not folded into the base URL) so the signed
// path and the real request path stay identical.
const DEFAULT_BASE_URL = "https://prod-api.zephyr4jiracloud.com";

export class ZephyrSquadClient {
  constructor({ accessKey, secretKey, accountId, baseUrl }) {
    if (!accessKey || !secretKey || !accountId) {
      throw new Error(
        "Zephyr Squad credentials missing — set ZEPHYR_SQUAD_ACCESS_KEY, ZEPHYR_SQUAD_SECRET_KEY, and ZEPHYR_SQUAD_ACCOUNT_ID."
      );
    }
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.accountId = accountId;
    this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  async request(method, path, { queryParams, body } = {}) {
    // Confirmed live against the actual API (2026-08-15): the server signs
    // against the path WITHOUT the "/connect" prefix, contradicting the
    // assumption in the module comment above — a request built with
    // "/connect" included in both the URL and the QSH input gets a 401
    // "Expecting claim 'qsh' to have value X but instead it has Y". Strip
    // "/connect" for signing only; the actual request URL still needs it.
    const qshPath = path.replace(/^\/connect(?=\/|$)/, "") || "/";
    const token = signRequest({
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      accountId: this.accountId,
      method,
      path: qshPath,
      queryParams
    });
    const url = new URL(this.baseUrl + path);
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        url.searchParams.append(k, String(v));
      }
    }
    const headers = {
      Authorization: `JWT ${token}`,
      zapiAccessKey: this.accessKey
    };
    // Only set Content-Type when there's an actual body — sending it on a
    // bodyless GET makes the server try to parse the empty body as JSON
    // and fail with a generic 400 "Invalid Json".
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Zephyr Squad API ${method} ${path} -> ${res.status}: ${text.slice(0, 2000)}`);
    }
    if (!text.trim()) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  get(path, opts) {
    return this.request("GET", path, opts);
  }

  post(path, body) {
    return this.request("POST", path, { body });
  }
}
