module.exports = {
  apps: [
    {
      name: "my-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3039",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork"
    }
  ]
}