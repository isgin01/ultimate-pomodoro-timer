import {
	Params,
	recoverableTimerState as RecoverableTimerState,
	Timer,
} from '../src/timer'

jest.useFakeTimers()

var standardModes = [
	{
		name: 'work',
		secs: 60 * 60,
	},
	{
		name: 'break',
		secs: 60 * 10,
	},
]

function getParameters(propsNeededToRunSuccessfully?: Partial<Params>): Params {
	let empty_settings: Params = {
		stopWhenElapsed: true,
		autostart: false,
	}

	return {
		...empty_settings,
		...propsNeededToRunSuccessfully,
	}
}

test('toggle', () => {
	var timer = new Timer(standardModes, getParameters())
	expect(timer.running).toBe(false)
	timer.toggle()
	expect(timer.running).toBe(true)
	timer.toggle()
	expect(timer.running).toBe(false)
})

test('switch', () => {
	var timer = new Timer(standardModes, getParameters())

	expect(timer.HFTime).toBe('01:00:00')
	expect(timer.currentMode.name).toBe('work')
	timer.nextMode()
	expect(timer.HFTime).toBe('00:10:00')
	expect(timer.currentMode.name).toBe('break')
})

test('event handler func called correct amount of times', () => {
	var timer = new Timer(
		standardModes,
		getParameters({
			stopWhenElapsed: false,
		}),
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
		[
			{
				name: 'work',
				secs: 60 * 60 * 24,
			},
		],
		getParameters({
			stopWhenElapsed: false,
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
		modeIdx: 1,
		unmodified: 10,
		remaining: 5,
		running: true,
	}

	test('initialization', () => {
		var timer = new Timer(standardModes, getParameters(), recoverableState)
		expect(timer.currentMode.name).toBe('break')
		expect(timer.unmodified).toBe(10)
		expect(timer.remaining).toBe(5)
		expect(timer.running).toBe(true)
	})

	test('running: true', () => {
		recoverableState.running = true
		var timer = new Timer(standardModes, getParameters(), recoverableState)

		let testCb = jest.fn()
		timer.on(['tick'], testCb)
		jest.advanceTimersByTime(1000)
		expect(testCb).toHaveBeenCalledTimes(1)
		expect(timer.remaining).toBe(4)

		jest.advanceTimersByTime(1000)
		expect(testCb).toHaveBeenCalledTimes(2)
		expect(timer.remaining).toBe(3)
	})

	test('running: false', () => {
		recoverableState.running = false
		var timer = new Timer(standardModes, getParameters(), recoverableState)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(5)
	})
})

test('recoverable session state obtaining', () => {
	var timer = new Timer(
		[
			{ name: 'work', secs: 60 },
			{ name: 'break', secs: 60 },
		],
		getParameters({
			stopWhenElapsed: false,
		}),
	)

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		modeIdx: 0,
		running: false,
		unmodified: 60,
		remaining: 60,
	})

	timer.toggle()

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		modeIdx: 0,
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
		modeIdx: 0,
		running: false,
		unmodified: 60,
		remaining: -1,
	})

	timer.nextMode()

	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		modeIdx: 1,
		running: false,
		unmodified: 60,
		remaining: 60,
	})
})

test('autostart', () => {
	var timer = new Timer(standardModes, getParameters({ autostart: true }))

	expect(timer.currentMode.name).toBe('work')
	timer.toggle()
	jest.advanceTimersByTime(1000 * 60 * 60)

	expect(timer.currentMode.name).toBe('break')
	expect(timer.running).toBe(true)
	jest.advanceTimersByTime(1000 * 60 * 9)
	expect(timer.remaining).toBe(60)
})
