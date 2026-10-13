import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

let inMemorySaveStore: unknown = null;

export async function saveState(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('HTTP trigger saveState processed a request.');

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return {
        status: 400,
        jsonBody: { error: 'Invalid save payload structure' },
      };
    }

    inMemorySaveStore = {
      ...body,
      syncedAt: new Date().toISOString(),
    };

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Telemetry and investigation progress archived successfully',
        data: inMemorySaveStore,
      },
    };
  } catch (error) {
    context.error('Failed to parse save payload:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to process save data' },
    };
  }
}

app.http('saveState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: saveState,
});
