
import { User } from "@prisma/client";

export function calculateUserCredits(user: Pick<User, 'plan' | 'credits' | 'subscriptionCredits' | 'trialStartedAt' | 'subscriptionExpiresAt'>) {
    let isTrialExpired = false;
    
    // Check if trial is expired
    if (user.plan === 'free' && user.trialStartedAt) {
        const trialEnd = new Date(user.trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (new Date() > trialEnd) {
            isTrialExpired = true;
        }
    }

    // Effective Subscription Credits (0 if trial expired)
    // Note: If trial hasn't started (trialStartedAt is null), we count subscriptionCredits (which might be 0, but usually 0 until init)
    // However, for the purpose of "Available to use", if trial hasn't started, the user technically has 0 credits allocated yet, 
    // but they ARE eligible to start.
    const effectiveSubCredits = (user.plan === 'free' && isTrialExpired) ? 0 : user.subscriptionCredits;
    const total = effectiveSubCredits + user.credits;

    return {
        total,
        effectiveSubCredits,
        isTrialExpired
    };
}
