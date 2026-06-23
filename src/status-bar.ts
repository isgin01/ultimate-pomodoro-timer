import { Menu } from "obsidian"
import { type Timer } from "./timer"

export default class StatusBar {
	constructor(
		private element: HTMLElement,
		timer: Timer,
		show: boolean,
	) {
		// Make the status bar clickable
		element.className += " mod-clickable"

		element.addEventListener("click", () => {
			timer.toggle()
		})

		// Menu that will appear on auxclick

		let menu = new Menu()

		menu.addItem((i) => {
			i.setTitle("Reset").onClick(() => timer.reset())
		})
		menu.addItem((i) => {
			i.setTitle("Switch").onClick(() => timer.switch())
		})

		element.addEventListener("auxclick", (ev) => {
			menu.showAtMouseEvent(ev)
		})

		let timeUpdateHandler = (HFTime: string) => {
			element.innerText = HFTime
		}

		// Set initial value

		timeUpdateHandler(timer.HFTime)

		timer.registerEventHandler("tick", timeUpdateHandler)

		this.alterVisibility(show)
	}

	alterVisibility(show: boolean) {
		this.element.setCssProps({ display: show ? "block" : "none" })
	}
}
