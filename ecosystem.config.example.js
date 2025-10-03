module.exports = {
  apps: [
    {
      name: 'kilo-web-server',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/kilo-web-server',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        KILOCODE_TOKEN: 'YOUR_KILOCODE_TOKEN_HERE'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '3001',
        KILOCODE_TOKEN: 'YOUR_KILOCODE_TOKEN_HERE'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/kilo-web-server-error.log',
      out_file: './logs/kilo-web-server-out.log',
      log_file: './logs/kilo-web-server-combined.log',
      time: true
    },
    {
      name: 'kilo-web-client',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/kilo-web-client',
      env: {
        NODE_ENV: 'production',
        PORT: '80',
        DISABLE_ESLINT_PLUGIN: 'true'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '80',
        DISABLE_ESLINT_PLUGIN: 'true'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/kilo-web-client-error.log',
      out_file: './logs/kilo-web-client-out.log',
      log_file: './logs/kilo-web-client-combined.log',
      time: true
    }
  ]
}