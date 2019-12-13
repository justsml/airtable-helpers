let test = require('tape')
let tiny = require('tiny-json-http')
let sandbox = require('@architect/sandbox')
let url = 'http://localhost:6666'

/**
 * Sandbox / http test
 * - Demonstrates execising basic web integration tests using the local dev server
 */
test('Set up env', t => {
  t.plan(1)
  t.ok(sandbox, 'sandbox loaded')
})

let end // Saves a reference to be used later to shut down the sandbox
test('Start sandbox', async t => {
  t.plan(1)
  end = await sandbox.start()
  t.ok(end, 'Sandbox started!')
})


test('post /submissions', t => {
  t.plan(2)

  const payload = {
    "submissionType": "reca6jeURsOqzvjQD",
    "student": "recs036I2abG71kHv",
    "reviewer": "recxK8ZYshbPmSV8S",
    "objectives": {
      "rec3JHcvtk1bf6N05": 2,
      "recTf9MWf8PdcH8b9": 1,
      "recAVsBXdE30OejFE": 3,
      "recUCUfrVjPLZglVJ": 2,
      "reclVaMJBlARW0M8n": 2,
      "recEEua9JlaSUi1WL": 3
    },
    "internalNotes": "test internal notes",
    "studentFacingNotes": "test student facing notes"
  }

  tiny.post({
    url: `${url}/submissions`,
    data: payload,
    headers: {'Content-Type': 'application/json'}
  }).then(result => {
    t.true(result.body.records.length === 1, 'Expected 1 record')
    cleanup(result.body.records[0].id).then(result => {
      t.true(result.body.deleted, 'Expected deleted to be true')
    })
  })
})

test('Shut down sandbox', t=> {
  t.plan(1)
  end()
  tiny.get({url},
  function win (err, result) {
    if (err) {
      t.equal(err.code, 'ECONNREFUSED', 'Sandbox succssfully shut down')
    } else {
      t.fail('Sandbox did not shut down')
    }
  })
})

function cleanup(id) {
  return tiny.del({
    url: `https://api.airtable.com/v0/appVrtcS4vUYVuiD3/Submissions/${id}`,
    headers: {'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`}
  })
}
