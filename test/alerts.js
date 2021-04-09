const test = require('tape');
const Influx = require('influx');
const consoleLogger = {error: console.error, info: console.log, debug: console.log};

const {
  writeCdrs,
  queryCdrs,
  writeAlerts,
  queryAlerts,
  AlertType
} = require('..')(consoleLogger, '127.0.0.1');

test('write cdr data', async(t) => {
  let result = await writeCdrs([{
    from: 'me',
    to: 'you',
    sip_callid: 'foo@127.0.0.1',
    answered: true,
    duration: 22,
    attempted_at: new Date(Date.now() - (3600 * 1000)),
    answered_at: Date.now() - (3590 * 1000),
    terminated_at: Date.now(),
    termination_reason: 'caller hungup',
    direction: 'inbound',
    host: '10.10.100.1',
    remote_host: '10.10.100.8',
    trunk: 'device',
    account_sid: 'xxxx',
    call_sid: 'foo'
  },
  {
    from: 'me2',
    to: 'you2',
    sip_callid: 'foo@127.0.0.1',
    answered: false,
    duration: 20,
    attempted_at: new Date(Date.now() - (7200 * 1000)),
    answered_at: Date.now() - (7180 * 1000),
    terminated_at: Date.now(),
    termination_reason: 'caller hungup',
    direction: 'inbound',
    host: '10.10.100.1',
    remote_host: '10.10.100.8',
    trunk: 'twilio',
    account_sid: 'yyyy',
    call_sid: 'bar'
  }]);
  t.pass('wrote cdr');

  result = await queryCdrs({account_sid: 'xxxx', page: 1, count:25});
  //console.log(JSON.stringify(result));
  t.ok(result.data.length === 1, 'queried cdrs')

  result = await queryCdrs({account_sid: 'yyyy', trunk: 'twilio', page: 1, count:25});
  t.ok(result.data.length === 1, 'queried cdrs by trunk')

  result = await writeAlerts([{
    alert_type: AlertType.WEBHOOK_FAILURE,
    account_sid: 'yyyy',
    message: 'your webhook returned 404'
  }]);
  t.pass('wrote alert');

  result = await queryAlerts({limit: 10});
  //console.log(JSON.stringify(result));
  t.ok(result.results[0].series[0].values.length  === 1, 'queried alerts')

  result = await queryAlerts({alert_type: AlertType.WEBHOOK_FAILURE, limit: 10});
  t.ok(result.results[0].series[0].values.length  === 1, 'queried alerts by tags')

});
