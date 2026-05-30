import { ItemView, WorkspaceLeaf, setIcon } from "obsidian"

import { type Timer } from "./timer"
import { PluginSettings } from "settings"

export const PLUGIN_CUSTOM_VIEW_ID = "better-pomodoro-view"

export class CustomView extends ItemView {
	private timer: Timer
	private settings: PluginSettings

	private toggleBtn: HTMLButtonElement
	private resetBtn: HTMLButtonElement
	private switchBtn: HTMLButtonElement

	private remainingTimeCircle: SVGCircleElement
	private elapsedTimeCircle: SVGCircleElement

	constructor(leaf: WorkspaceLeaf, timer: Timer, settings: PluginSettings) {
		super(leaf)
		this.containerEl.empty()

		this.timer = timer
		this.settings = settings

		// Set view icon
		this.icon = "timer"

		// Parent container
		var container = this.containerEl.createDiv({
			cls: "custom-view-container",
		})

		// Clock face

		var svg = container
			.createDiv({
				cls: "animation-container",
			})
			.createSvg("svg")
		this.remainingTimeCircle = svg.createSvg("circle", {
			attr: { id: "default", cx: 70, cy: 70, r: 70, "stroke-width": 2 },
		})
		this.elapsedTimeCircle = svg.createSvg("circle", {
			attr: { id: "elapsed", cx: 70, cy: 70, r: 60, "stroke-width": 20 },
		})
		this.setElapsedCircleReach()
		svg.createSvg("circle", {
			attr: { id: "bg", cx: 70, cy: 70, r: 60, "stroke-width": 8 },
		})
		this.setColors()

		// TODO: work/break text

		var timeContainer = container.createSpan({ cls: "time-container" })
		timeContainer.innerHTML = timer.getTimeLeft().HFTime
		this.timer.registerUpdateCallback("tick", (HFTime: string) => {
			timeContainer.innerText = HFTime
			this.setElapsedCircleReach()
		})

		// Buttons

		// TODO: hover and click effects

		var btnContainer = container.createDiv({ cls: "btn-container" })

		this.toggleBtn = btnContainer.createEl("button", {
			text: "Toggle",
			cls: "toggle",
		})
		this.setToggleBtnIcon()
		this.toggleBtn.addEventListener("click", () => {
			this.timer.toggle()
		})
		this.timer.registerUpdateCallback("toggle", () => {
			this.setToggleBtnIcon()
		})

		this.resetBtn = btnContainer.createEl("button", {
			text: "Reset",
			cls: "reset",
		})
		setIcon(this.resetBtn, "reset")
		this.resetBtn.addEventListener("click", () => {
			this.timer.reset()
		})

		this.switchBtn = btnContainer.createEl("button", {
			text: "Switch",
			cls: "switch",
		})
		setIcon(this.switchBtn, "switch")
		this.switchBtn.addEventListener("click", () => {
			this.timer.switch()
		})
	}

	setColors() {
		this.remainingTimeCircle.style.fill =
			this.settings.customViewColors.remaining
		this.elapsedTimeCircle.style.stroke =
			this.settings.customViewColors.elapsed
	}

	private updateModeBanner() {
		var m = this.timer.getCurrentMode()
	}

	private setToggleBtnIcon() {
		setIcon(this.toggleBtn, this.timer.getIsRunning() ? "pause" : "play")
	}

	private setElapsedCircleReach() {
		this.elapsedTimeCircle.style.strokeDashoffset = String(
			(this.timer.getTimeLeft().secs / this.timer.getTotalSecs()) * 440,
		)
	}

	getViewType() {
		return PLUGIN_CUSTOM_VIEW_ID
	}

	getDisplayText() {
		return "Pomodoro view"
	}

	async onClose() {
		// TODO:
	}
}
