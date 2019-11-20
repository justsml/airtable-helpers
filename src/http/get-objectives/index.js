const Airtable = require('airtable')
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appVrtcS4vUYVuiD3')

function getObjectives() {
  return new Promise((resolve, reject) => {
    const results = []
    base('Objectives').select({
      // Selecting the first 3 records in Grid view:
      maxRecords: 1000,
      view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function (record) {
        results.push(record.get('Objective'))
        // console.log('Retrieved', record.get('Objective'));
      })

      // To fetch the next page of records, call `fetchNextPage`.
      // If there are more records, `page` will get called again.
      // If there are no more records, `done` will get called.
      fetchNextPage()

    }, function done(err) {
      if (err) { return reject(err) }
      resolve(results)
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
  const body = await getObjectives()
  return {
    headers: {
      'content-type': 'text/html; charset=utf8'
    },
    body
  }
}
