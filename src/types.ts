export interface AdvancedSecurityResponse {
    total_advanced_security_committers: number;
    total_count: number;
    maximum_advanced_security_committers: number;
    purchased_advanced_security_committers: number;
    repositories: Repository[];
}

export interface Repository {
    name: string;
    advanced_security_committers: number;
    advanced_security_committers_breakdown: Committer[];
}

export interface Committer {
    user_login: string;
    last_pushed_date: string;
    last_pushed_email: string;
}