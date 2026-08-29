module.exports = {
  apps: [
    {
      name: "karamad-frontend",
      cwd: "/home/claude/karamad-medtech",
      script: "node_modules/next/dist/bin/next",
      // -H 127.0.0.1 is required: `next start`'s bare default binds
      // 0.0.0.0:3000, which would expose the frontend directly instead of
      // only through Nginx.
      args: "start -p 3000 -H 127.0.0.1",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
