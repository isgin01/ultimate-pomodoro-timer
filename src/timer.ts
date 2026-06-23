import { type PluginSettings } from 'settings'

// Switch is missing because 'toggle' is sufficient
// Whenever 'switch' would be triggered, 'reset' would be too
export type Event = 'tick' | 'elapsed' | 'toggle' | 'reset'
type Callback = (HFTime?: string) => void

type Mode = 'work' | 'break'

export type recoverableTimerState = {
	running: boolean
	mode: Mode
	unmodified: number
	remaining: number
}

export class Timer {
	running: boolean
	mode: Mode
	unmodified: number
	remaining: number

	private eventHandlers: { [key in Event]: Callback[] } = {
		tick: [],
		elapsed: [],
		toggle: [],
		reset: [],
	}
	private intervalId: number | undefined

	constructor(
		private readonly settings: PluginSettings,
		initialState?: recoverableTimerState,
	) {
		this.settings = settings

		if (initialState) {
			this.mode = initialState.mode
			this.unmodified = initialState.unmodified
			this.remaining = initialState.remaining

			// Inverse the value to run toggle properly
			this.running = !initialState.running
			this.toggle()
		} else {
			this.running = false
			this.mode = 'work'
			this.resetSecs()
		}
	}

	private resetSecs() {
		this.unmodified =
			this.mode == 'work'
				? this.settings.workSecs
				: this.settings.breakSecs

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
			this.elapsed()
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
	private elapsed(): void {
		if (this.remaining == 0) {
			this.runEventHandlers('elapsed')
			if (!this.settings.continueAfterTimeHasElapsed) {
				this.switch()
				if (this.settings.autostart) {
					this.toggle()
				}
			}
		}
	}

	switch(): void {
		this.mode = this.mode == 'work' ? 'break' : 'work'
		this.reset()
	}

	reset(): void {
		this.stop()
		this.resetSecs()
		this.runEventHandlers('reset')
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers[ev].forEach((cb) => cb(this.HFTime))
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
			(timeUnit) => String(timeUnit).padStart(2, '00'),
		)

		humanTime += paddedTimeUnits.join(':')

		return humanTime
	}

	get recoverableState(): recoverableTimerState {
		return {
			running: this.running,
			mode: this.mode,
			unmodified: this.unmodified,
			remaining: this.remaining,
		}
	}
}
