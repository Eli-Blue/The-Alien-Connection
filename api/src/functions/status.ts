import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function status(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('HTTP trigger status telemetry processed a request.');

  return {
    status: 200,
    jsonBody: {
      facility: 'Blackwood Bio-Acoustic Array - Station Echo-7',
      status: 'CONTAINMENT_LOCKDOWN',
      subLevel: 4,
      targetWaveform: {
        frequency: '84.7 kHz',
        modulation: '65%',
        carrierState: 'PERSISTENT',
      },
      quarantineOverrideCode: 'REDACTED',
      timestamp: new Date().toISOString(),
    },
  };
}

app.http('status', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: status,
});
