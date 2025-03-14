import { AdvancedSecurityResponse } from './types';

async function fetchAdvancedSecurityData(enterpriseId: string, token: string): Promise<AdvancedSecurityResponse> {
    let allRepositories: any[] = [];
    let page = 1;
    const perPage = 100; // GitHub's maximum items per page
    
    while (true) {
        const response = await fetch(
            `https://api.github.com/enterprises/${enterpriseId}/settings/billing/advanced-security?page=${page}&per_page=${perPage}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        allRepositories.push(...data.repositories);

        // Check if there are more pages
        const linkHeader = response.headers.get('link');
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
            // No more pages
            return {
                ...data,
                repositories: allRepositories
            };
        }

        page++;
    }
}

function calculateUniqueCommittersPerOrg(data: AdvancedSecurityResponse): Map<string, Set<string>> {
    const orgCommitters = new Map<string, Set<string>>();

    for (const repo of data.repositories) {
        // Extract org name from repo name (everything before the /)
        const orgName = repo.name.split('/')[0];
        
        if (!orgCommitters.has(orgName)) {
            orgCommitters.set(orgName, new Set<string>());
        }

        // Get the set of committers for this org
        const orgCommitterSet = orgCommitters.get(orgName)!;
        
        // Add all committers from this repo to the org's set
        for (const committer of repo.advanced_security_committers_breakdown) {
            orgCommitterSet.add(committer.user_login);
        }
    }

    return orgCommitters;
}

// Usage example:
async function main(enterpriseId: string, token: string) {
    try {
        const data = await fetchAdvancedSecurityData(enterpriseId, token);
        const orgCommitters = calculateUniqueCommittersPerOrg(data);

        const output = {
            enterpriseStats: {
                totalAdvancedSecurityCommitters: data.total_advanced_security_committers,
                totalCount: data.total_count,
                maximumAdvancedSecurityCommitters: data.maximum_advanced_security_committers,
                purchasedAdvancedSecurityCommitters: data.purchased_advanced_security_committers,
                totalOrganizations: orgCommitters.size
            },
            organizationStats: Array.from(orgCommitters).map(([org, committers]) => ({
                organization: org,
                uniqueCommitters: committers.size,
                committers: Array.from(committers)
            }))
        };

        console.log(JSON.stringify(output, null, 2));
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
    }
}

// Only run this code if this file is being executed directly
if (require.main === module) {
    const enterpriseId = process.argv[2];
    const token = process.argv[3];
    
    if (!enterpriseId || !token) {
        console.error('Usage: npm start <enterprise-id> <github-token>');
        process.exit(1);
    }
    
    main(enterpriseId, token);
}

export { calculateUniqueCommittersPerOrg, fetchAdvancedSecurityData };