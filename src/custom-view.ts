import { ItemView, type WorkspaceLeaf, setIcon, type HexString } from 'obsidian'
import { type Timer } from './timer'

export const CUSTOM_VIEW_ID = 'isgin-pomodoro-timer-view'

export type CvColors = { remaining: HexString; elapsed: HexString }

export class CustomView extends ItemView {
	private toggleBtn: HTMLButtonElement
	private elapsedTimeCircle: SVGCircleElement

	constructor(
		leaf: WorkspaceLeaf,
		private timer: Timer,
		colors: CvColors,
	) {
		super(leaf)
		this.containerEl.empty()

		// Set view icon
		this.icon = 'timer'

		// Parent container
		var container = this.containerEl.createDiv({
			cls: 'pomodoro-timer-view-container',
		})

		// Clock face

		var svg = container
			.createDiv({
				cls: 'animation-container',
			})
			.createSvg('svg')
		svg.createSvg('circle', {
			attr: {
				class: 'remaining',
				cx: 70,
				cy: 70,
				r: 70,
				'stroke-width': 2,
			},
		})
		this.setRemainingCircleColor(colors.remaining)

		this.elapsedTimeCircle = svg.createSvg('circle', {
			attr: {
				class: 'elapsed',
				cx: 70,
				cy: 70,
				r: 60,
				'stroke-width': 20,
			},
		})
		this.setElapsedCircleReach()
		this.setElapsedCircleColor(colors.elapsed)
		svg.createSvg('circle', {
			attr: { class: 'bg', cx: 70, cy: 70, r: 60, 'stroke-width': 8 },
		})

		// TODO: work/break text

		var modeContainer = container.createSpan({ cls: 'mode-container' })
		modeContainer.innerText = timer.currentMode.name

		this.timer.on(['reset'], () => {
			modeContainer.innerText = timer.currentMode.name
		})

		var timeContainer = container.createSpan({ cls: 'time-container' })
		timeContainer.innerText = timer.HFTime
		this.timer.on(['tick', 'reset'], () => {
			timeContainer.innerText = timer.HFTime
			this.setElapsedCircleReach()
		})

		// Buttons

		var btnContainer = container.createDiv({ cls: 'btn-container' })

		this.toggleBtn = btnContainer.createEl('button', {
			text: 'Toggle',
			cls: 'toggle',
		})
		this.setToggleBtnIcon()
		this.toggleBtn.addEventListener('click', () => {
			this.timer.toggle()
		})
		this.timer.on(['toggle', 'reset'], () => {
			this.setToggleBtnIcon()
		})

		let resetBtn = btnContainer.createEl('button', {
			text: 'Reset',
			cls: 'reset',
		})
		setIcon(resetBtn, 'reset')
		resetBtn.addEventListener('click', () => {
			this.timer.reset()
		})

		let switchBtn = btnContainer.createEl('button', {
			text: 'Switch',
			cls: 'switch',
		})
		setIcon(switchBtn, 'switch')
		switchBtn.addEventListener('click', () => {
			this.timer.switch()
		})
	}

	private setToggleBtnIcon() {
		setIcon(this.toggleBtn, this.timer.running ? 'pause' : 'play')
	}

	private setElapsedCircleReach() {
		this.elapsedTimeCircle.style.strokeDashoffset = String(
			(this.timer.remaining / this.timer.unmodified) * 440,
		)
	}

	setRemainingCircleColor(color: HexString) {
		let el = this.containerEl.getElementsByClassName('remaining')[0] as
			| SVGCircleElement
			| undefined

		if (el) {
			el.style.fill = color
		}
	}

	setElapsedCircleColor(color: HexString) {
		let el = this.containerEl.getElementsByClassName('elapsed')[0] as
			| SVGCircleElement
			| undefined

		if (el) {
			el.style.stroke = color
		}
	}

	getViewType() {
		return CUSTOM_VIEW_ID
	}

	getDisplayText() {
		return 'Pomodoro timer view'
	}
}
