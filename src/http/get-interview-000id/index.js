const fetch = require('node-fetch')

function buildQueryForIds(ids) {
  var query = ids.map(id => `RECORD_ID()='${id}'`)
  return query && query.length > 0 ? `OR(${query.join(',')})` : ''
}

/*
# Outline
1. get scheduled interview id
  * student id -> name
  * submission type -> objectives w/ `buildQueryForIds(ids)`


*/

function buildFieldsParam(fields) {
  return fields.map(field => `${encodeURIComponent('fields[]')}=${encodeURIComponent(field)}`).join('&');
}

function getScheduledById(id) {
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/tblxsSqOyJAFDOzA4/${id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(results => {
    // console.log('SCHEDULED_BY_ID', results)
    if (!results.fields.Student && !results.fields.Student[0]) {
      console.warn('No Student ID Found!')
    }
    return {
      id: results.id,
      studentId: results.fields.Student && results.fields.Student[0],
      submissionTypeId: results.fields && results.fields.Type[0],
      displayTitle: results.fields.Name,
      description: results.fields['Calendar Invite Name'],
      startTime: results.fields['Start Time'] && results.fields['Start Time'][0],
      endTime: results.fields['End Time'] && results.fields['End Time'][0],
    }
  })
}

function getObjectives(objectiveIds) {
  const filterByFormula = buildQueryForIds(objectiveIds)
  const fields = ['Display Name', 'Objective', 'Reviewer Facing Description', 'Student Facing Description', '1', '2', '3']
  // console.log('filterByFormula', filterByFormula)
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/Objectives?filterByFormula=${filterByFormula}&${buildFieldsParam(fields)}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(data => {
    // console.log('OBJECTIVES', JSON.stringify(data, null, 2))
    return data.records.map(record => {
      return {
        id: record.id,
        displayName: record.fields['Display Name'],
        objective: record.fields['Objective'],
        reviewerFacingDescription: record.fields['Reviewer Facing Description'],
        studentFacingDescription: record.fields['Student Facing Description'],
        score1: record.fields['1'],
        score2: record.fields['2'],
        score3: record.fields['3'],
      }
    })
  })
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


exports.handler = async function http(req) {
  try {
    const scheduledInterview = await getScheduledById(req.pathParameters.id).catch(console.error)
    if (!scheduledInterview || !scheduledInterview.submissionTypeId) {
      throw new Error('Invalid scheduledInterview.submissionTypeId for requested id')
    }
    const submissionType = await getSubmissionType(scheduledInterview.submissionTypeId).catch(console.error)
    const objectives = await getObjectives(submissionType.objectives).catch(console.error)

    const body = {
      interview: scheduledInterview,
      objectives,
    }
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'content-type': 'application/json; charset=utf8'
      },
      body: JSON.stringify(body)
    }
  } catch (error) {
    console.error(`ERROR: /interview/${req.pathParameters.id}`, error)
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'content-type': 'application/json; charset=utf8'
      },
      body: JSON.stringify({error: error.message, stack: error.stack})
    }
  }
}
