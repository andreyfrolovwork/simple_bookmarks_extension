import { describe, expect, it } from 'vitest';
import { getPeriodById, getPeriodCutoff, formatSliderDays, STAT_PERIODS } from './clickPeriods';

describe('clickPeriods', () => {
	it('includes the requested range of periods', () => {
		expect(STAT_PERIODS.map((p) => p.id)).toEqual([
			'1d',
			'7d',
			'14d',
			'1mo',
			'2mo',
			'3mo',
			'6mo',
			'1y'
		]);
	});

	it('computes cutoff as now minus period length', () => {
		const period = getPeriodById('7d');
		const now = 1_700_000_000_000;
		expect(getPeriodCutoff(period, now)).toBe(now - 7 * 24 * 60 * 60 * 1000);
	});

	it('falls back to 1 month for unknown ids', () => {
		expect(getPeriodById('nope').id).toBe('1mo');
	});

	it('formats slider days', () => {
		expect(formatSliderDays(0)).toBe('0 days');
		expect(formatSliderDays(1)).toBe('1 day');
		expect(formatSliderDays(10)).toBe('10 days');
		expect(formatSliderDays(30)).toBe('1 month');
		expect(formatSliderDays(365)).toBe('1 year');
	});
});
