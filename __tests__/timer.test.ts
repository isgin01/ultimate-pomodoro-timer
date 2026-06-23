import {
	recoverableTimerState as RecoverableTimerState,
	Timer,
} from '../src/timer'
import { PluginSettings } from '../src/settings'

jest.useFakeTimers()

function getSettingsHelper(
	paramsNecessaryToRunSuccessfully?: Partial<PluginSettings>,
): PluginSettings {
	let empty_settings: PluginSettings = {
		workSecs: 0,
		breakSecs: 0,
		systemNotificationsPreferred: false,
		continueAfterTimeHasElapsed: false,
		showCustomView: false,
		showStatusBar: false,
		CvColors: { remaining: '', elapsed: '' },
		playNotificationSound: false,
		customNotificationSound: '',
		autostart: false,
	}

	return {
		...empty_settings,
		...paramsNecessaryToRunSuccessfully,
	}
}

test('toggle', () => {
	var timer = new Timer(getSettingsHelper())
	expect(timer.running).toBe(false)
	timer.toggle()
	expect(timer.running).toBe(true)
	timer.toggle()
	expect(timer.running).toBe(false)
})

test('switch', () => {
	var timer = new Timer(
		getSettingsHelper({
			workSecs: 60 * 60,
			breakSecs: 60 * 10,
		}),
	)

	expect(timer.HFTime).toBe('01:00:00')
	timer.switch()
	expect(timer.HFTime).toBe('00:10:00')
})

test('event handler func called correct amount of times', () => {
	var timer = new Timer(
		getSettingsHelper({ continueAfterTimeHasElapsed: true }),
	)

	let cb = jest.fn()
	timer.on(['tick'], cb)
	timer.toggle()

	jest.advanceTimersByTime(1000)
	expect(cb).toHaveBeenCalledTimes(1)
	jest.advanceTimersByTime(1000)
	expect(cb).toHaveBeenCalledTimes(2)
	jest.advanceTimersByTime(1000 * 60)
	expect(cb).toHaveBeenCalledTimes(62)
	jest.advanceTimersByTime(1000 * 60 * 60 * 10)
	expect(cb).toHaveBeenCalledTimes(36062)

	timer.toggle() // stop
	jest.advanceTimersByTime(1000 * 60)
	expect(cb).toHaveBeenCalledTimes(36062)
})

test('HF time display', () => {
	var timer = new Timer(
		getSettingsHelper({
			workSecs: 60 * 60 * 24,
			continueAfterTimeHasElapsed: true,
		}),
	)

	expect(timer.HFTime).toBe('24:00:00')

	timer.toggle()

	jest.advanceTimersByTime(1000)
	expect(timer.HFTime).toBe('23:59:59')

	jest.advanceTimersByTime(1000 * 60)
	expect(timer.HFTime).toBe('23:58:59')

	jest.advanceTimersByTime(1000 * 60 * 60 * 23)
	expect(timer.HFTime).toBe('00:58:59')

	jest.advanceTimersByTime(1000 * 60 * 58)
	expect(timer.HFTime).toBe('00:00:59')

	jest.advanceTimersByTime(1000 * 59)
	expect(timer.HFTime).toBe('00:00:00')

	jest.advanceTimersByTime(1000 * 60)
	expect(timer.HFTime).toBe('-00:01:00')

	jest.advanceTimersByTime(1000 * 60 * 60 * 11)
	expect(timer.HFTime).toBe('-11:01:00')
})

describe('create an instance of Timer from initial state', () => {
	var recoverableState: RecoverableTimerState = {
		mode: 'work' as const,
		unmodified: 10,
		remaining: 5,
		running: true,
	}

	test('initialization', () => {
		var timer = new Timer(getSettingsHelper(), recoverableState)
		expect(timer.mode).toBe('work')
		expect(timer.unmodified).toBe(10)
		expect(timer.remaining).toBe(5)
		expect(timer.running).toBe(true)
	})

	test('running: true', () => {
		recoverableState.running = true
		var timer = new Timer(getSettingsHelper(), recoverableState)

		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(4)

		let testCb = jest.fn()
		timer.on(['tick'], testCb)
		jest.advanceTimersByTime(1000)
		expect(testCb).toHaveBeenCalledTimes(1)
		expect(timer.remaining).toBe(3)

		jest.advanceTimersByTime(1000)
		expect(testCb).toHaveBeenCalledTimes(2)
		expect(timer.remaining).toBe(2)
	})

	test('running: false', () => {
		recoverableState.running = false
		var timer = new Timer(getSettingsHelper(), recoverableState)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(5)
	})
})

test('recoverable session state obtaining', () => {
	var timer = new Timer(
		getSettingsHelper({
			workSecs: 60,
			breakSecs: 10,
			continueAfterTimeHasElapsed: true,
		}),
	)

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		mode: 'work',
		running: false,
		unmodified: 60,
		remaining: 60,
	})

	timer.toggle()

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		mode: 'work',
		running: true,
		unmodified: 60,
		remaining: 60,
	})

	jest.advanceTimersByTime(1000)

	expect(timer.recoverableState.remaining).toBe(59)

	jest.advanceTimersByTime(1000 * 59)

	expect(timer.recoverableState.remaining).toBe(0)

	jest.advanceTimersByTime(1000 * 1)

	expect(timer.recoverableState.remaining).toBe(-1)

	timer.toggle()

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		mode: 'work',
		running: false,
		unmodified: 60,
		remaining: -1,
	})

	timer.switch()

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		mode: 'break',
		running: false,
		unmodified: 10,
		remaining: 10,
	})
})

test('autostart', () => {
	var timer = new Timer(
		getSettingsHelper({ autostart: true, workSecs: 5, breakSecs: 10 }),
	)

	expect(timer.mode).toBe('work')
	timer.toggle()
	jest.advanceTimersByTime(1000 * 5)

	expect(timer.mode).toBe('break')
	expect(timer.running).toBe(true)
	jest.advanceTimersByTime(1000 * 3)
	expect(timer.remaining).toBe(7)
})
