import { type PluginSettings } from "settings"

type Event = "tick" | "elapsed" | "toggle"
type Callback = (HFTime?: string) => void

type Mode = "work" | "break"

type InitialState = {
	mode: Mode
	initSecsCount: number
	secsLeft: number
	running: boolean
}

export class Timer {
	private readonly settings: PluginSettings

	running: boolean
	mode: Mode
	initSecsCount: number
	secsLeft: number

	private eventHandlers: { [key in Event]: Callback[] } = {
		tick: [],
		elapsed: [],
		toggle: [],
	}
	private intervalId: number | undefined

	constructor(settings: PluginSettings, initData?: InitialState) {
		this.settings = settings

		if (initData) {
			this.running = initData.running
			this.mode = initData.mode
			this.initSecsCount = initData.initSecsCount
			this.secsLeft = initData.secsLeft
		} else {
			this.running = false
			this.mode = "work"
			this.resetSecs()
		}
	}

	private resetSecs() {
		this.initSecsCount =
			this.mode == "work"
				? this.settings.workSecs
				: this.settings.breakSecs

		this.secsLeft = this.initSecsCount
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

	private tick(): void {
		this.secsLeft--
		this.runEventHandlers("tick")
		if (this.secsLeft == 0) {
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

	private stop(): void {
		this.running = false

		window.clearInterval(this.intervalId)
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers[ev].forEach((cb) => cb(this.HFTime))
	}

	get HFTime() {
		var humanTime = ""
		var savedSecs = this.secsLeft

		// Add a minus sign to the string if the second count is negative
		// and make seconds positive to avoid getting minus signs when
		// dividing
		if (this.secsLeft < 0) {
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
}
