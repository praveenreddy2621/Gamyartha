window.ENV = {
  BACKEND_API:
    window.location.hostname === "localhost"
      ? "http://localhost:3001" // local dev
      : "http://68.233.116.139:3001" // your real production backend domain
};
// window.ENV = {
//   BACKEND_API: "http://68.233.116.139:3001"
// };
