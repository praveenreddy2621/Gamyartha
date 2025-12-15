window.ENV = {
  BACKEND_API:
    window.location.hostname === "localhost"
      ? "http://localhost:3001" // local dev
      : "/api" // docker/production environment
};
// window.ENV = {
//   BACKEND_API: "http://68.233.116.139:3001"
// };
