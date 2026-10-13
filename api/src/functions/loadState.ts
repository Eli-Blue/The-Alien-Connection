import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function loadState(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('HTTP trigger loadState processed a request.');

  return {
    status: 200,
    jsonBody: {
      status: 'ready',
      facility: 'STATION_ECHO_7',
      subLevel: 4,
      carrierLock: '84.7 kHz',
      directive: 'DEEP_HORIZON_BIO_ACOUSTICS',
    },
  };
}

app.http('loadState', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: loadState,
});
