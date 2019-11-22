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

// function buildFieldsParam(fields) {
//   // fields%5B%5D=Objective
//   // fields%5B%5D=Reviewer%20Facing%20Description
//   return fields.map(field => `${encodeURIComponent('fields[]')}=${encodeURIComponent(field)}`).join('&')
// }

function getScheduledById(id) {
  // const fields = buildFieldsParam(['Student'])
  // const fields = buildFieldsParam(['Student', 'Type', 'Name', 'Calendar Invite Name', 'Start Time', 'End Time'])
  // console.log('FIELDS', fields)
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/tblxsSqOyJAFDOzA4/${id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(results => {
    console.log('SCHEDULED_BY_ID', results)
    return {
      id: results.id,
      studentId: results.fields.Student[0],
      submissionTypeId: results.fields.Type[0],
      displayTitle: results.fields.Name,
      description: results.fields['Calendar Invite Name'],
      startTime: results.fields['Start Time'][0],
      endTime: results.fields['End Time'][0],
    }
  })
}

function getObjectives(objectiveIds) {
  const filterByFormula = buildQueryForIds(objectiveIds)
  console.log('filterByFormula', filterByFormula)
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/Objectives?maxRecords=250&view=Grid%20view&filterByFormula=${filterByFormula}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log('OBJECTIVES', JSON.stringify(data, null, 2))
    return data.records.map(record => {
      return {
        id: record.id,
        'Display Name': record.fields['Display Name'],
        'Objective': record.fields['Objective'],
        'Reviewer Facing Description': record.fields['Reviewer Facing Description'],
        'Student Facing Description': record.fields['Student Facing Description'],
        score1: record.fields['1'],
        score2: record.fields['2'],
        score3: record.fields['3'],
        // 'HackerRank Tests': record.fields['HackerRank Tests'],
        // 'Endorsement Requirements': record['Endorsement Requirements'],
        // 'Endorsement Unit Design': record.fields['Endorsement Unit Design']
      }
    })
  })
}


function getSubmissionType(id) {
  const tableId = 'tblbVmHIKWpDipzUh'
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/${tableId}/${id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(result => {
    // console.log('getSubmissionType', JSON.stringify(data, null, 2))
    return {
      id: result.id,
      objectives: result.fields.Objectives,
      endorsementRequirements: result.fields['Endorsement Requirements'],
      displayName: result.fields['Display Name'],
      studentFacingDescription: result.fields['Student Facing Description'],
      name: result.fields['Name'],
      courseId: result.fields['Course'] && result.fields['Course'][0],
    }
  })
}


exports.handler = async function http(req) {
  // console.log(req)
  const scheduledInterview = await getScheduledById(req.pathParameters.id).catch(console.error)
  const submissionType = await getSubmissionType(scheduledInterview.submissionTypeId).catch(console.error)
  // console.log('OBJECTIVE_IDs', submissionType.objectives)
  const objectives = await getObjectives(submissionType.objectives).catch(console.error)
  // console.log('OBJECTIVES', objectives)

  const body = { objectives, interview: scheduledInterview }
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }
}
