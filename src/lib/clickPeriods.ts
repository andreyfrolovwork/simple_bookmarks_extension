const DAY_MS = 24 * 60 * 60 * 1000;

export interface StatPeriod {
	id: string;
	label: string;
	ms: number;
	days: number;
}

export const STAT_PERIODS: readonly StatPeriod[] = [
	{ id: '1d', label: '1 day', ms: DAY_MS, days: 1 },
	{ id: '7d', label: '1 week', ms: 7 * DAY_MS, days: 7 },
	{ id: '14d', label: '2 weeks', ms: 14 * DAY_MS, days: 14 },
	{ id: '1mo', label: '1 month', ms: 30 * DAY_MS, days: 30 },
	{ id: '2mo', label: '2 months', ms: 60 * DAY_MS, days: 60 },
	{ id: '3mo', label: '3 months', ms: 90 * DAY_MS, days: 90 },
	{ id: '6mo', label: '6 months', ms: 183 * DAY_MS, days: 183 },
	{ id: '1y', label: '1 year', ms: 365 * DAY_MS, days: 365 }
];

export const SLIDER_TICKS: readonly { label: string; days: number }[] = [
	{ label: '0', days: 0 },
	{ label: '1 week', days: 7 },
	{ label: '1 month', days: 30 },
	{ label: '3 months', days: 90 },
	{ label: '6 months', days: 183 },
	{ label: '1 year', days: 365 }
];

export const SLIDER_MAX_DAYS = 365;
export const DEFAULT_PERIOD_ID = '1mo';

export function getPeriodById(id: string): StatPeriod {
	return STAT_PERIODS.find((p) => p.id === id) ?? STAT_PERIODS[3];
}

export function getPeriodCutoff(period: StatPeriod, now: number = Date.now()): number {
	return now - period.ms;
}

export function getSliderCutoff(days: number, now: number = Date.now()): number {
	return now - Math.max(0, days) * DAY_MS;
}

export function formatSliderDays(days: number): string {
	const value = Math.max(0, days);
	if (value < 0.5) return '0 days';
	if (value < 11) {
		const n = Math.max(1, Math.round(value));
		return n === 1 ? '1 day' : `${n} days`;
	}
	if (value < 25) {
		const weeks = Math.max(1, Math.round(value / 7));
		return weeks === 1 ? '1 week' : `${weeks} weeks`;
	}
	if (value < 360) {
		const months = Math.max(1, Math.round(value / 30));
		return months === 1 ? '1 month' : `${months} months`;
	}
	return '1 year';
}
