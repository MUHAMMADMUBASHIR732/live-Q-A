/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // To test from a phone on the same Wi-Fi, set DEV_ORIGINS in .env to your
  // computer's local IP address, for example DEV_ORIGINS=192.168.1.20
  allowedDevOrigins: (process.env.DEV_ORIGINS || "").split(",").filter(Boolean),
};

module.exports = nextConfig;
