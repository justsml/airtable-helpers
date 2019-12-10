const fetch = require('node-fetch')

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
      // console.log('getSubmissionType', JSON.stringify(record))
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
  const objectives = [
    s.objectivesScored1 && s.objectivesScored1.split(','),
    s.objectivesScored2 && s.objectivesScored2.split(','),
    s.objectivesScored3 && s.objectivesScored3.split(',')
  ].flat()

  const requiredObjectives = await getSubmissionType(s.submissionType).then(submissionType => {
    return submissionType.objectives.sort()
  })

  if (objectives.length !== requiredObjectives.length) throw new Error(`Submitted objectives don't match required objectives: ${objectives.length}/${requiredObjectives.length}`)

  return {
    fields: {
      'Submission Type': [s.submissionType],
      'Objectives Scored 1': s.objectivesScored1 && s.objectivesScored1.split(','),
      'Objectives Scored 2': s.objectivesScored2 && s.objectivesScored2.split(','),
      'Objectives Scored 3': s.objectivesScored3 && s.objectivesScored3.split(','),
      'Reviewer': [s.reviewer],
      'Student': [s.student],
      'Internal Reviewer Notes': s.internalNotes,
      'Student Facing Reviewer Notes': s.studentFacingNotes
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
