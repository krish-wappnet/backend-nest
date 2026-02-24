# OTP Verification Curl Examples

## Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Verify OTP
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

## Resend OTP
```bash
curl -X POST http://localhost:3000/auth/resend-otp \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com"
  }'
```

## Login (after verification)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password@123"
  }'
```
