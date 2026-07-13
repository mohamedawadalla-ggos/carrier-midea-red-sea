import { spawn } from "node:child_process";

const env = { ...process.env, NEXT_PUBLIC_SITE_URL: "https://example.test", NEXT_PUBLIC_FACEBOOK_PAGE_URL: "https://facebook.com/example", NEXT_PUBLIC_WHATSAPP_NUMBER: "201000000000", NEXT_PUBLIC_PHONE_TEL: "+201000000000", NEXT_PUBLIC_PHONE_DISPLAY: "+20 100 000 0000", NEXT_PUBLIC_EMAIL: "hello@example.test", NEXT_PUBLIC_GOOGLE_MAPS_URL: "https://maps.google.com/", NEXT_PUBLIC_GOOGLE_BUSINESS_URL: "https://business.google.com/", NEXT_PUBLIC_META_PIXEL_ID: "", NEXT_PUBLIC_GA_MEASUREMENT_ID: "" };
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("npm_execpath is unavailable; run this check through npm.");
const child = spawn(process.execPath, [npmCli, "run", "build"], { env, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
