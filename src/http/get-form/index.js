const fetch = require('node-fetch')

function buildQueryForIds(ids) {
  var query = ids.reduce((accum, id) => {
    return accum + `RECORD_ID()='${id}',`
  })
  return query && query.length > 0 ? `OR(${query.slice(query.length - 1)})` : ''
}

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
      return {
        id: record.id,
        'Name': record.fields['Name'],
        'HackerRank Tests': record.fields['HackerRank Tests'],
        'Endorsement Requirements': record['Endorsement Requirements'],
        'Endorsement Unit Design': record.fields['Endorsement Unit Design']
      }
    })
  })
}

exports.handler = async function http(req) {
  // console.log(req)
  const body = await getData('Courses').catch(console.error)
  return {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'content-type': 'application/json; charset=utf8'
    },
    body: JSON.stringify(body)
  }
}
