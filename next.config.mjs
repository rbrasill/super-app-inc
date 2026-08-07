/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O driver `pg` carrega módulos dinamicamente (ex.: pg-native, quando existe).
  // Mantê-lo fora do bundle evita que o empacotador tente resolver isso.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
