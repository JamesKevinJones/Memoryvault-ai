process.env.DATABASE_URL ??=
  "postgresql://root@localhost:26257/memoryvault?sslmode=disable";
process.env.AUTH_SECRET ??= "test-auth-secret";
process.env.AUTH_GOOGLE_ID ??= "test-google-id";
process.env.AUTH_GOOGLE_SECRET ??= "test-google-secret";
