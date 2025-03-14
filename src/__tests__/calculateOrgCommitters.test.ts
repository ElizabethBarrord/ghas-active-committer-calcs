import { calculateUniqueCommittersPerOrg, fetchAdvancedSecurityData } from '../calculateOrgCommitters';
import { AdvancedSecurityResponse } from '../types';

describe('calculateUniqueCommittersPerOrg', () => {
    it('should correctly calculate unique committers per organization', () => {
        const mockData: AdvancedSecurityResponse = {
            total_advanced_security_committers: 5,
            total_count: 3,
            maximum_advanced_security_committers: 10,
            purchased_advanced_security_committers: 10,
            repositories: [
                {
                    name: 'org1/repo1',
                    advanced_security_committers: 2,
                    advanced_security_committers_breakdown: [
                        { user_login: 'user1', last_pushed_date: '2023-01-01', last_pushed_email: 'user1@example.com' },
                        { user_login: 'user2', last_pushed_date: '2023-01-01', last_pushed_email: 'user2@example.com' }
                    ]
                },
                {
                    name: 'org1/repo2',
                    advanced_security_committers: 2,
                    advanced_security_committers_breakdown: [
                        { user_login: 'user1', last_pushed_date: '2023-01-01', last_pushed_email: 'user1@example.com' },
                        { user_login: 'user3', last_pushed_date: '2023-01-01', last_pushed_email: 'user3@example.com' }
                    ]
                },
                {
                    name: 'org2/repo1',
                    advanced_security_committers: 3,
                    advanced_security_committers_breakdown: [
                        { user_login: 'user4', last_pushed_date: '2023-01-01', last_pushed_email: 'user4@example.com' },
                        { user_login: 'user5', last_pushed_date: '2023-01-01', last_pushed_email: 'user5@example.com' },
                        { user_login: 'user1', last_pushed_date: '2023-01-01', last_pushed_email: 'user1@example.com' }
                    ]
                }
            ]
        };

        const result = calculateUniqueCommittersPerOrg(mockData);

        expect(result.get('org1')?.size).toBe(3); // user1, user2, user3
        expect(result.get('org2')?.size).toBe(3); // user1,user4, user5
        expect(Array.from(result.get('org1') || [])).toEqual(expect.arrayContaining(['user1', 'user2', 'user3']));
        expect(Array.from(result.get('org2') || [])).toEqual(expect.arrayContaining(['user4', 'user5']));
    });

    it('should handle empty repositories array', () => {
        const mockData: AdvancedSecurityResponse = {
            total_advanced_security_committers: 0,
            total_count: 0,
            maximum_advanced_security_committers: 10,
            purchased_advanced_security_committers: 10,
            repositories: []
        };

        const result = calculateUniqueCommittersPerOrg(mockData);
        expect(result.size).toBe(0);
    });
});

describe('fetchAdvancedSecurityData', () => {
    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = jest.fn();
    });

    it('should fetch and aggregate data from multiple pages', async () => {
        const mockResponses = [
            {
                ok: true,
                json: () => Promise.resolve({
                    total_advanced_security_committers: 3,
                    total_count: 2,
                    maximum_advanced_security_committers: 10,
                    purchased_advanced_security_committers: 10,
                    repositories: [{
                        name: 'org1/repo1',
                        advanced_security_committers: 1,
                        advanced_security_committers_breakdown: []
                    }]
                }),
                headers: new Headers({
                    link: '<next-page>; rel="next"'
                })
            },
            {
                ok: true,
                json: () => Promise.resolve({
                    total_advanced_security_committers: 3,
                    total_count: 2,
                    maximum_advanced_security_committers: 10,
                    purchased_advanced_security_committers: 10,
                    repositories: [{
                        name: 'org1/repo2',
                        advanced_security_committers: 1,
                        advanced_security_committers_breakdown: []
                    }]
                }),
                headers: new Headers({})
            }
        ];

        (global.fetch as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve(mockResponses[0]))
            .mockImplementationOnce(() => Promise.resolve(mockResponses[1]));

        const result = await fetchAdvancedSecurityData('test-enterprise', 'test-token');

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.repositories).toHaveLength(2);
        expect(result.repositories[0].name).toBe('org1/repo1');
        expect(result.repositories[1].name).toBe('org1/repo2');
    });

    it('should throw error on failed API request', async () => {
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            })
        );

        await expect(fetchAdvancedSecurityData('test-enterprise', 'test-token'))
            .rejects
            .toThrow('GitHub API request failed: 401 Unauthorized');
    });
});