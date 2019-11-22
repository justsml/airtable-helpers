@app
awaken-7tl

@static

@http
get /
get /objectives
get /courses
get /endorsement-requirements
get /student-next-steps
get /submission-types
post /submissions
get /form
get /form/:scheduledId

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
