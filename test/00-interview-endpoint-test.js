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


test('get /interview/:id', t => {
  t.plan(3)
  tiny.get({url: `${url}/interview/recfmDZDo4oG3QkP5`})
    .then(function win (result) {
      const json = result.body
      t.true(!!json.objectives, 'Got list of Objectives.')
      t.true(!!json.interview, 'Got Interview details.')
      t.true(!!json.interview.displayTitle, 'Has displayTitle in interview details.')
    })
    .catch(function fail (err) {
      console.error('FAIL', err)
      t.fail(err)
      if (err.message.includes('404') || err.code === 'ECONNREFUSED')
        console.log(didNotLoad)
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

let didNotLoad = 'You are likely seeing 404 or ECONNREFUSED errors because you do not have a `get /` HTTP function and also do not have a `public/index.html` file\nPlease make use of one or the other to respond to web requests at the root of your application'
