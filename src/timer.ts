import { type PluginSettings } from "settings"

type Event = "tick" | "elapsed" | "toggle"
type Callback = (HFTime?: string) => void

type Mode = "work" | "break"

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
			this.mode = "work"
			this.resetSecs()
		}
	}

	private resetSecs() {
		this.unmodified =
			this.mode == "work"
				? this.settings.workSecs
				: this.settings.breakSecs

		this.remaining = this.unmodified
	}

	registerEventHandler(event: Event, cb: Callback): void {
		this.eventHandlers[event].push(cb)
	}

	toggle(): void {
		if (this.running) {
			this.stop()
		} else {
			this.start()
		}

		this.runEventHandlers("toggle")
	}

	private start(): void {
		this.running = true

		const oneSecondMillis = 1000

		// Use window.setInterval explicitly to avoid TS confusing
		// between NodeJS and Browser API
		this.intervalId = window.setInterval(() => {
			this.tick()
		}, oneSecondMillis)
	}

	private stop(): void {
		this.running = false

		window.clearInterval(this.intervalId)
	}

	private tick(): void {
		this.remaining--
		this.runEventHandlers("tick")
		if (this.remaining == 0) {
			this.runEventHandlers("elapsed")

			if (!this.settings.continueAfterTimeHasElapsed) {
				this.switch()
			}
		}
	}

	switch(): void {
		this.mode = this.mode == "work" ? "break" : "work"
		this.reset()
	}

	reset(): void {
		this.stop()
		this.resetSecs()
		this.runEventHandlers("tick")
		this.runEventHandlers("toggle")
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers[ev].forEach((cb) => cb(this.HFTime))
	}

	get HFTime() {
		var humanTime = ""
		var savedSecs = this.remaining

		// Add a minus sign to the string if the second count is negative
		// and make seconds positive to avoid getting minus signs when
		// dividing
		if (this.remaining < 0) {
			humanTime = "-"
			savedSecs *= -1
		}

		const secondsLeft = savedSecs % 60
		const minutesTotal = (savedSecs - secondsLeft) / 60
		const minutesLeft = minutesTotal % 60
		const hoursTotal = (minutesTotal - minutesLeft) / 60

		const paddedTimeUnits = [hoursTotal, minutesLeft, secondsLeft].map(
			(timeUnit) => String(timeUnit).padStart(2, "00"),
		)

		humanTime += paddedTimeUnits.join(":")

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
