const fetch = require('node-fetch')
let arc = require('@architect/functions')
let parseBody = arc.http.helpers.bodyParser

function buildFieldsParam(fields) {
  return fields.map(field => `${encodeURIComponent('fields[]')}=${encodeURIComponent(field)}`).join('&')
}

function buildQueryForIds(ids) {
  var query = ids.map(id => `RECORD_ID()='${id}'`)
  return query && query.length > 0 ? `OR(${query.join(',')})` : ''
}

function getSubmissionType(id) {
  const tableId = 'tblbVmHIKWpDipzUh'
  const filterByFormula = buildQueryForIds([id])
  const fields = buildFieldsParam(['Objectives', 'Display Name', 'Student Facing Description', 'Name', 'Course'])
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/${tableId}?filterByFormula=${filterByFormula}&${fields}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
    .then(res => res.json())
    .then(result => {
      const record = result.records[0]
      return {
        id: record.id,
        objectives: record.fields.Objectives,
        displayName: record.fields['Display Name'],
        studentFacingDescription: record.fields['Student Facing Description'],
        name: record.fields['Name'],
        courseId: record.fields['Course'] && record.fields['Course'][0],
      }
    })
}

async function createSubmissionRecord(s) {
  if (!s.submissionType) throw new Error('submissionType is required')
  if (!s.student) throw new Error('student is required')
  if (!s.reviewer) throw new Error('reviewer is required')

  const requiredObjectives = await getSubmissionType(s.submissionType).then(submissionType => {
    return submissionType.objectives.sort()
  })

  const submittedObjectives = Object.entries(s.objectives).map(([key, value]) => key)
  const unsubmittedObjectives = requiredObjectives.reduce((unsubmitted, objective) => {
    if (!submittedObjectives.some(id => objective === id)) {
      return unsubmitted.concat([objective])
    }

    return unsubmitted
  }, [])

  if (unsubmittedObjectives.length > 0) throw new Error(`The following required objectives are missing: ${unsubmittedObjectives}`)

  const objectivesScored1 = Object.entries(s.objectives).filter(([key, value]) => value === 1).map(([key, value]) => key)
  const objectivesScored2 = Object.entries(s.objectives).filter(([key, value]) => value === 2).map(([key, value]) => key)
  const objectivesScored3 = Object.entries(s.objectives).filter(([key, value]) => value === 3).map(([key, value]) => key)

  const record = {
    fields: {
      'Submission Type': [s.submissionType],
      'Objectives Scored 1': objectivesScored1,
      'Objectives Scored 2': objectivesScored2,
      'Objectives Scored 3': objectivesScored3,
      'Reviewer': [s.reviewer],
      'Student': [s.student],
      'Internal Reviewer Notes': s.internalNotes,
      'Student Facing Reviewer Notes': s.studentFacingNotes
    }
  }

  return record
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
      return results
    })
}

exports.handler = async function http(req) {
  let body = parseBody(req)
  const record = await createSubmissionRecord(body)
  const payload = {
    records: [
      record
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
