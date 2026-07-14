import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_FACEBOOK_PAGE_URL",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "NEXT_PUBLIC_PHONE_TEL",
  "NEXT_PUBLIC_PHONE_DISPLAY",
];

const errors = [];
const value = (name) => process.env[name]?.trim() ?? "";

for (const name of required) {
  if (!value(name)) errors.push(`${name} is required.`);
}

const validateHttpsUrl = (name) => {
  const configured = value(name);
  if (!configured) return;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") errors.push(`${name} must use https://.`);
  } catch {
    errors.push(`${name} must be a valid absolute URL.`);
  }
};

validateHttpsUrl("NEXT_PUBLIC_SITE_URL");
validateHttpsUrl("NEXT_PUBLIC_FACEBOOK_PAGE_URL");
validateHttpsUrl("NEXT_PUBLIC_GOOGLE_MAPS_URL");
validateHttpsUrl("NEXT_PUBLIC_GOOGLE_BUSINESS_URL");

if (value("NEXT_PUBLIC_WHATSAPP_NUMBER") && !/^20\d{10}$/.test(value("NEXT_PUBLIC_WHATSAPP_NUMBER"))) {
  errors.push("NEXT_PUBLIC_WHATSAPP_NUMBER must contain exactly 12 digits, beginning with Egypt country code 20.");
}

if (value("NEXT_PUBLIC_PHONE_TEL") && !/^\+20\d{10}$/.test(value("NEXT_PUBLIC_PHONE_TEL"))) {
  errors.push("NEXT_PUBLIC_PHONE_TEL must use +20 followed by exactly 10 digits.");
}

if (value("NEXT_PUBLIC_EMAIL") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("NEXT_PUBLIC_EMAIL"))) {
  errors.push("NEXT_PUBLIC_EMAIL must be a valid email address.");
}

if (value("NEXT_PUBLIC_META_PIXEL_ID") && !/^\d+$/.test(value("NEXT_PUBLIC_META_PIXEL_ID"))) {
  errors.push("NEXT_PUBLIC_META_PIXEL_ID must contain digits only when provided.");
}

if (value("NEXT_PUBLIC_GA_MEASUREMENT_ID") && !/^G-[A-Z0-9]+$/.test(value("NEXT_PUBLIC_GA_MEASUREMENT_ID"))) {
  errors.push("NEXT_PUBLIC_GA_MEASUREMENT_ID must use the G-XXXXXXXXXX format when provided.");
}

if (errors.length) {
  console.error("Production environment validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Production environment configuration is valid.");
}
