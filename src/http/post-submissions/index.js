const fetch = require('node-fetch')
// const submission = {
//   submissionType: 'recxxxxxxxxxx',
//   objectivesScored1: 'recxxxxxxxxxx,recxxxxxxxxxx,recxxxxxxxxxx,recxxxxxxxxxx',
//   objectivesScored2: 'recxxxxxxxxxx,recxxxxxxxxxx,recxxxxxxxxxx,recxxxxxxxxxx',
//   objectivesScored3: 'recxxxxxxxxxx,recxxxxxxxxxx',
//   reviewerName: 'Dan L',
//   student: 'recxxxxxxxxxx',
//   wouldHire: true
// }
const MAX_OBJECTIVES = 10
const MIN_OBJECTIVES = 1

function createSubmissionRecord(s) {
  if (!s.submissionType) throw new Error('submissionType is required')
  if (!s.student) throw new Error('student is required')
  if (!s.reviewerName) throw new Error('reviewerName is required')
  const objectives = [s.objectivesScored1 && s.objectivesScored1.split(','),
    s.objectivesScored2 && s.objectivesScored2.split(','),
    s.objectivesScored3 && s.objectivesScored3.split(',')].flat()
  if (objectives.length < MIN_OBJECTIVES) throw new Error('No objectives found')
  if (objectives.length > MAX_OBJECTIVES) throw new Error('Too many objectives found')
  return {
    fields: {
      'Submission Type': [s.submissionType],
      'Objectives Scored 1': s.objectivesScored1 && s.objectivesScored1.split(','),
      'Objectives Scored 2': s.objectivesScored2 && s.objectivesScored2.split(','),
      'Objectives Scored 3': s.objectivesScored3 && s.objectivesScored3.split(','),
      'Reviewer Name': s.reviewerName,
      'Student': [s.student],
      'Would Hire': s.wouldHire ? 'Yes' : 'No'
    }
  }
}


function sendData(tableName, data) {
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/${encodeURIComponent(tableName)}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(results => {
    console.log(tableName, JSON.stringify(results, null, 2))
    return results
  })
}
/*
curl -v -X POST https://api.airtable.com/v0/appVrtcS4vUYVuiD3/Submissions \
  -H "Authorization: Bearer keyIbzA1CubaOLW1w" \
  -H "Content-Type: application/json" \
  --data '{
  "records": [
    {
      "fields": {
        "Submission Type": [
          "rec7So00sMXJpZHBX"
        ],
        "Objectives Scored 2": [
          "rec600kDd9VFPqLvh",
          "recCzy8swmeFY6ZLQ",
          "recyirI11seVGWdj5"
        ],
        "Objectives Scored 3": [
          "reckGBlhkRa3iW8MN",
          "rec5RxAXmONcsWEJ6",
          "recNswqDOY3oprnzX"
        ],
        "Reviewer Name": "Sean Chen",
        "Student": [
          "recKo14W4S4mo8hYD"
        ],
        "Would Hire": "Yes"
      }
    },
    {
      "fields": {
        "Submission Type": [
          "rec7So00sMXJpZHBX"
        ],
        "Objectives Scored 2": [
          "rec600kDd9VFPqLvh",
          "recCzy8swmeFY6ZLQ",
          "rec5RxAXmONcsWEJ6",
          "recyirI11seVGWdj5"
        ],
        "Objectives Scored 3": [
          "reckGBlhkRa3iW8MN",
          "recNswqDOY3oprnzX"
        ],
        "Reviewer Name": "Sean Chen",
        "Student": [
          "recYrTVkoJSqY6MaJ"
        ],
        "Would Hire": "Yes"
      }
    }
  ]
}'
*/
exports.handler = async function http(req) {
  console.log('queryStringParameters', req.queryStringParameters)
  const payload = {
    records: [
      createSubmissionRecord(req.queryStringParameters)
    ]
  }
  const results = await sendData('Submissions', payload)
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(results)
  }
}
