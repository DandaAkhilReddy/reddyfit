import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

export async function GetKPIs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('GetKPIs function processed request');

    try {
        const clinicId = request.query.get('clinic_id');

        if (!clinicId) {
            return {
                status: 400,
                jsonBody: { error: 'clinic_id is required' }
            };
        }

        // TODO: Replace with actual database queries using Prisma
        // This is mock data for now
        const kpis = {
            calls_today: 47,
            fcr_percentage: 92,
            average_handle_time: '3m 12s',
            csat_score: 4.8,
        };

        return {
            status: 200,
            jsonBody: kpis,
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (error) {
        context.error('Error in GetKPIs:', error);
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

app.http('GetKPIs', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'analytics/kpis',
    handler: GetKPIs
});
