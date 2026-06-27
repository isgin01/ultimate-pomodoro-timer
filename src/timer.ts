// 'Switch' is missing because 'toggle' is sufficient
// Whenever 'switch' would be triggered, 'reset' would be too
export type Event = 'tick' | 'elapsed' | 'toggle' | 'reset'

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
	keepRunning: boolean
}

export class Timer {
	running: boolean
	// TODO: remove unmodified because mode is sufficient now
	unmodified: number
	remaining: number

	private currentModeIdx: number
	private eventHandlers: { [key in Event]: (() => void)[] } = {
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

	on(events: Event[], cb: () => void): void {
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

	private stop(): void {
		this.running = false
		window.clearInterval(this.intervalId)
	}

	private start(): void {
		this.running = true

		// Use window.setInterval explicitly to avoid TS confusing
		// between NodeJS and Browser API
		this.intervalId = window.setInterval(() => {
			this.tick()
			if (this.isElapsed()) {
				this.elapsed()
			}
		}, 1000)
	}

	private tick(): void {
		this.remaining--
		this.runEventHandlers('tick')
	}

	private isElapsed(): boolean {
		if (this.remaining === 0) {
			return true
		}
		return false
	}

	private elapsed(): void {
		this.runEventHandlers('elapsed')

		if (!this.params.keepRunning) {
			this.switch()
		}

		if (this.params.autostart) {
			this.toggle()
		}
	}

	switch(): void {
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

	resetProgress(): void {
		this.currentModeIdx = 0
		this.reset()
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers[ev].forEach(cb => cb())
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
