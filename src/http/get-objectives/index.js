const fetch = require('node-fetch')

function getObjectives() {
  return fetch("https://api.airtable.com/v0/appVrtcS4vUYVuiD3/Objectives?maxRecords=3&view=Grid%20view", {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log(data)
    return data.records.map(record => {
      // id, fields.1-3, fields.Objective, fields.['Display Name'], fields['Reviewer Facing Description']
      return {
        id: record.id,
        options: [
          record.fields['1'],
          record.fields['2'],
          record.fields['3']
        ],
        display: record.fields['Display Name'],
        description: record.fields['Reviewer Facing Description']
      }
    })
  })

}

// Enable secure sessions, express-style middleware, and more:
// https://docs.begin.com/en/functions/http/
//
// let begin = require('@architect/functions')



// HTTP function
exports.handler = async function http(req) {
  // console.log(req)
  const body = await getObjectives().catch(console.error)
  return {
    headers: {
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }
}
