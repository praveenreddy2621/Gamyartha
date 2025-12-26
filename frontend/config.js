window.ENV = {
  BACKEND_API:
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:3001" // local dev
      : "" // docker/production environment (accessed via IP 13.233.139.94)
};
