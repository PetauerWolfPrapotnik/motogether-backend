Nginx
Setup

/                         -> frontend index.html
/api                      -> backend
/api/manga/:id/file/:file  GET -> to a specific folder for data

Handle CORS requests
Handle SSL certificates
Handle compression


API

/api
  /login
  /logout
  /userinfo
    /change-password
    /change-email
    /change-username

  /register
  /verify-email
  /reset-password



Auth:
  1. Get token
  If header present done
  If cookie present CONCAT them, If NOT GET check CSRF cookie (if matches passed value)

  2. Check if token is valid 
  Verify JWT

