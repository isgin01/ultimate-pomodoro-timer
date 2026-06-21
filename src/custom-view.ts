import { ItemView, type WorkspaceLeaf, setIcon } from "obsidian"
import { type PluginSettings } from "./settings"
import { type Timer } from "./timer"

// TODO: does it have to be unique across all plugins?
export const PLUGIN_CUSTOM_VIEW_ID = "isgin-pomodoro-timer-view"

export class CustomView extends ItemView {
	private toggleBtn: HTMLButtonElement

	private elapsedTimeCircle: SVGCircleElement

	constructor(
		leaf: WorkspaceLeaf,
		private timer: Timer,
		private settings: PluginSettings,
	) {
		super(leaf)
		this.containerEl.empty()

		// Set view icon
		this.icon = "timer"

		// Parent container
		var container = this.containerEl.createDiv({
			cls: "pomodoro-timer-view-container",
		})

		// Clock face

		var svg = container
			.createDiv({
				cls: "animation-container",
			})
			.createSvg("svg")
		let remainingTimeCircle = svg.createSvg("circle", {
			attr: { cx: 70, cy: 70, r: 70, "stroke-width": 2 },
		})
		remainingTimeCircle.style.fill =
			this.settings.customViewColors.remaining

		this.elapsedTimeCircle = svg.createSvg("circle", {
			attr: { id: "elapsed", cx: 70, cy: 70, r: 60, "stroke-width": 20 },
		})
		this.setElapsedCircleReach()
		svg.createSvg("circle", {
			attr: { id: "bg", cx: 70, cy: 70, r: 60, "stroke-width": 8 },
		})

		this.elapsedTimeCircle.style.stroke =
			this.settings.customViewColors.elapsed

		// TODO: work/break text

		var timeContainer = container.createSpan({ cls: "time-container" })
		timeContainer.innerText = timer.HFTime
		this.timer.registerEventHandler("tick", (HFTime: string) => {
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
		this.timer.registerEventHandler("toggle", () => {
			this.setToggleBtnIcon()
		})

		let resetBtn = btnContainer.createEl("button", {
			text: "Reset",
			cls: "reset",
		})
		setIcon(resetBtn, "reset")
		resetBtn.addEventListener("click", () => {
			this.timer.reset()
		})

		let switchBtn = btnContainer.createEl("button", {
			text: "Switch",
			cls: "switch",
		})
		setIcon(switchBtn, "switch")
		switchBtn.addEventListener("click", () => {
			this.timer.switch()
		})
	}

	private setToggleBtnIcon() {
		setIcon(this.toggleBtn, this.timer.running ? "pause" : "play")
	}

	private setElapsedCircleReach() {
		this.elapsedTimeCircle.style.strokeDashoffset = String(
			(this.timer.remaining / this.timer.unmodified) * 440,
		)
	}

	getViewType() {
		return PLUGIN_CUSTOM_VIEW_ID
	}

	getDisplayText() {
		return "Pomodoro timer view"
	}
}
