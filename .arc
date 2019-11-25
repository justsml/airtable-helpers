@app
awaken-7tl

@static

@http
get /
get /objectives
get /courses
get /submission-types
post /submissions
get /interview/:id

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
