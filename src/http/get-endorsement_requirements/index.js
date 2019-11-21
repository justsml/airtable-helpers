const fetch = require('node-fetch')

function getData(tableName) {
  return fetch(`https://api.airtable.com/v0/appVrtcS4vUYVuiD3/${encodeURIComponent(tableName)}?maxRecords=250&view=Grid%20view`, {
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log(tableName, JSON.stringify(data, null, 2))
    return data.records.map(record => {
      return record
    })
  })
}

exports.handler = async function http(req) {
  // console.log(req)
  const body = await getData('Endorsement Requirements').catch(console.error)
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }
}