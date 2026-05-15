const required = ['MONGODB_URI', 'JWT_SECRET'];

const validate = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy server/.env.example to server/.env and fill in the values.');
    process.exit(1);
  }

  if (
    process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production' ||
    process.env.JWT_SECRET.length < 32
  ) {
    console.error('FATAL: JWT_SECRET is insecure. Use a random string of at least 32 characters.');
    process.exit(1);
  }
};

module.exports = { validate };
