import { validateNumericInput } from '../src/settings'

describe(`${validateNumericInput.name} tests`, () => {
	it('boundaries', () => {
		expect(validateNumericInput('')).toBe(0)
		expect(validateNumericInput('1')).toBe(1)
		expect(validateNumericInput('30')).toBe(30)
		expect(validateNumericInput('120')).toBe(120)
	})
	it('points', () => {
		expect(validateNumericInput('0.5')).toBe(0.5)
		expect(validateNumericInput('.5')).toBe(0.5)
		expect(validateNumericInput('1.')).toBe(1)
	})
	it('not a number', () => {
		expect(validateNumericInput('test')).toBe(false)
		expect(validateNumericInput('$')).toBe(false)
		expect(validateNumericInput('.')).toBe(false)
	})
	it('excessive symbols', () => {
		expect(validateNumericInput('3,0')).toBe(false)
		expect(validateNumericInput('0..5')).toBe(false)
		expect(validateNumericInput('.5$')).toBe(false)
		expect(validateNumericInput('1-20')).toBe(false)
	})
})
