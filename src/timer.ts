// 'Switch' is missing because 'toggle' is sufficient
// Whenever 'switch' would be triggered, 'reset' would be too
export type Event = 'tick' | 'elapsed' | 'toggle' | 'reset'
type Callback = (HFTime?: string) => void

export type Mode = {
	name: string
	secs: number
}

export type recoverableTimerState = {
	running: boolean
	modeIdx: number
	unmodified: number
	remaining: number
}

export type Params = {
	autostart: boolean
	stopWhenElapsed: boolean
}

export class Timer {
	running: boolean
	// TODO: remove unmodified because mode is sufficient now
	unmodified: number
	remaining: number

	private currentModeIdx: number
	private eventHandlers: { [key in Event]: Callback[] } = {
		tick: [],
		elapsed: [],
		toggle: [],
		reset: [],
	}
	private intervalId: number | undefined

	constructor(
		private modes: Mode[],
		private readonly params: Params,
		readonly initialState?: recoverableTimerState,
	) {
		this.params = params
		this.modes = modes

		// TODO: handle situations when no modes list was supplied
		if (
			initialState &&
			!Object.entries(initialState).some(v => v[1] == null) &&
			// TODO: a temp solution
			initialState.modeIdx < modes.length
		) {
			this.setModes(modes)
			this.fromInitialState(initialState)
		} else {
			this.setModes(modes)
		}
	}

	setModes(modes: Mode[]) {
		this.updateModes(modes)
		this.reset()
	}

	private updateModes(modes: Mode[]) {
		this.currentModeIdx = 0
		// Copy the array and objects inside to avoid using references
		this.modes = Array.from(modes.map(m => ({ ...m })))
	}

	private fromInitialState(state: recoverableTimerState): void {
		this.currentModeIdx = state.modeIdx
		this.unmodified = state.unmodified
		this.remaining = state.remaining

		// Inverse the value to run toggle properly
		this.running = !state.running
		this.toggle()
	}

	get currentMode(): Mode {
		return this.modes[this.currentModeIdx]!
	}

	private resetSecs(): void {
		this.unmodified = this.currentMode.secs
		this.remaining = this.unmodified
	}

	on(events: Event[], cb: Callback): void {
		events.forEach((ev: Event) => this.eventHandlers[ev].push(cb))
	}

	toggle(): void {
		if (this.running) {
			this.stop()
		} else {
			this.start()
		}

		this.runEventHandlers('toggle')
	}

	private start(): void {
		this.running = true

		// Use window.setInterval explicitly to avoid TS confusing
		// between NodeJS and Browser API
		this.intervalId = window.setInterval(() => {
			this.tick()
			this.isElapsed()
		}, 1000)
	}

	private stop(): void {
		this.running = false
		window.clearInterval(this.intervalId)
	}

	private tick(): void {
		this.remaining--
		this.runEventHandlers('tick')
	}

	// TODO: refactor
	private isElapsed(): void {
		if (this.remaining === 0) {
			this.runEventHandlers('elapsed')
			if (this.params.stopWhenElapsed) {
				this.nextMode()
			}

			if (this.params.autostart) {
				this.toggle()
			}
		}
	}

	nextMode(): void {
		// WARNING: length may become zero if sth unexpected happens
		// TODO: Fix
		this.currentModeIdx = (this.currentModeIdx + 1) % this.modes.length
		this.reset()
	}

	reset(): void {
		this.stop()
		this.resetSecs()
		this.runEventHandlers('reset')
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers[ev].forEach(cb => cb(this.HFTime))
	}

	get HFTime() {
		var humanTime = ''
		var savedSecs = this.remaining

		// Add a minus sign to the string if the second count is negative
		// and make seconds positive to avoid getting minus signs when
		// dividing
		if (this.remaining < 0) {
			humanTime = '-'
			savedSecs *= -1
		}

		const secondsLeft = savedSecs % 60
		const minutesTotal = (savedSecs - secondsLeft) / 60
		const minutesLeft = minutesTotal % 60
		const hoursTotal = (minutesTotal - minutesLeft) / 60

		const paddedTimeUnits = [hoursTotal, minutesLeft, secondsLeft].map(
			timeUnit => String(timeUnit).padStart(2, '00'),
		)

		humanTime += paddedTimeUnits.join(':')

		return humanTime
	}

	get recoverableState(): recoverableTimerState {
		return {
			running: this.running,
			modeIdx: this.currentModeIdx,
			unmodified: this.unmodified,
			remaining: this.remaining,
		}
	}
}
