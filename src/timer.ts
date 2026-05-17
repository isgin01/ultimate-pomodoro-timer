import { type PluginSettings } from "settings"
import { notify } from "./utils"

export type updateCallback = (time?: string) => void

export class Timer {
	private readonly settings: PluginSettings

	private isRunning: boolean
	private mode: "work" | "break"
	// Total secs needed to track the amount initial of seconds
	private totalSecs: number
	private secsLeft: number
	private onTickCallbacks: updateCallback[]
	private onToggleCallbacks: updateCallback[]
	private intervalId: number | undefined

	constructor(settings: PluginSettings) {
		// It's important to make sure that seetings are assigned first since
		// they can be used for other props initialization
		this.settings = settings

		// public props
		this.isRunning = false

		// private props
		// TODO: load the previous mode instead
		this.mode = "work"
		this.onTickCallbacks = []
		this.onToggleCallbacks = []

		this.resetSecondsCount(true)
	}

	private resetSecondsCount(tryRecover?: boolean) {
		// Set seconds count
		// First, try to restore from previous session if it wasn't explicitly stopped
		// Otherwise, simply use a value from settings

		this.totalSecs =
			this.mode == "work"
				? this.settings.workDurationSecs
				: this.settings.breakDurationSecs

		// TODO: recover previous session

		// otherwise
		this.secsLeft = this.totalSecs
	}

	// TODO: if a property is not private, it can be changed
	getIsRunning() {
		return this.isRunning
	}

	getTotalSecs(): number {
		return this.totalSecs
	}

	getCurrentMode(): string {
		return this.mode
	}

	getTimeLeft(): {
		secs: number
		HFTime: string
	} {
		let seconds = this.secsLeft
		return {
			secs: seconds,
			HFTime: secondsToHF(seconds),
		}
	}

	registerUpdateCallback(type: "tick" | "toggle", cb: updateCallback): void {
		if (type == "tick") {
			this.onTickCallbacks.push(cb)
		} else if (type == "toggle") {
			this.onToggleCallbacks.push(cb)
		}
	}

	toggle(): void {
		this.runOnToggleCallbacks()

		if (this.isRunning) {
			this.stop()
		} else {
			this.start()
		}
	}

	private start(): void {
		this.isRunning = true

		const oneSecondMillis = 1000

		// Use window.setInterval explicitly to avoid TS confusing
		// between NodeJS and Browser API
		this.intervalId = window.setInterval(() => {
			this.tick()
		}, oneSecondMillis)
	}

	private tick(): void {
		this.secsLeft--
		this.runOnTickCallbacks()
		if (this.secsLeft == 0) {
			notify("Time's up")

			this.playSound()

			if (!this.settings.continueAfterTimeIsUp) {
				this.switch()
			}
		}
	}

	private playSound(): void {
		if (this.settings.playSound) {
			const sound = new Audio(this.settings.notificationSoundPath)
			void sound.play()
		}
	}

	switch(): void {
		this.mode = this.mode == "work" ? "break" : "work"
		this.reset()
	}

	reset(): void {
		this.stop()
		this.resetSecondsCount()
		this.runOnTickCallbacks()
		this.runOnToggleCallbacks()
	}

	private stop(): void {
		this.isRunning = false

		window.clearInterval(this.intervalId)
	}

	private runOnTickCallbacks() {
		this.onTickCallbacks.forEach((cb) => cb(this.getTimeLeft().HFTime))
	}

	private runOnToggleCallbacks() {
		this.onToggleCallbacks.forEach((cb) => cb())
	}

	destroy(): void {
		// TODO: add time left saving
	}
}

export function secondsToHF(secondsTotal: number) {
	// Add a minus sign to the string if the seconds amount is negative
	// and make the variable positive to avoid getting minus signs when
	// dividing
	var humanTime: string
	if (secondsTotal < 0) {
		humanTime = "-"
		secondsTotal *= -1
	} else {
		humanTime = ""
	}

	const secondsLeft = secondsTotal % 60
	const minutesTotal = (secondsTotal - secondsLeft) / 60
	const minutesLeft = minutesTotal % 60
	const hoursTotal = (minutesTotal - minutesLeft) / 60

	const paddedWithZerosTimeUnits = [hoursTotal, minutesLeft, secondsLeft].map(
		function padTimeUnitsWithZeros(timeUnit: number) {
			let paddedTimeUnit = String(timeUnit).padStart(2, "00")
			return paddedTimeUnit
		},
	)

	humanTime += paddedWithZerosTimeUnits.join(":")

	return humanTime
}
