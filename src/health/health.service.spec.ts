import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns the public service status without infrastructure details', () => {
    const service = new HealthService();
    const result = service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('utamedic-backend');
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    expect(JSON.stringify(result)).not.toMatch(/azure|sql|foundry|agent.?id/i);
  });
});
