import { Menu } from "obsidian"
import { type Timer } from "./timer"

export function buildStatusBar(el: HTMLElement, timer: Timer) {
	// Make the status bar clickable
	el.className += " mod-clickable"

	el.addEventListener("click", () => {
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

	el.addEventListener("auxclick", (ev) => {
		menu.showAtMouseEvent(ev)
	})

	let timeUpdateHandler = (HFTime: string) => {
		el.innerHTML = `<span>${HFTime}</span>`
	}

	// Set initial value

	timeUpdateHandler(timer.getTimeLeft().HFTime)

	timer.registerUpdateCallback("tick", timeUpdateHandler)
}

export function alterVisibility(show: boolean, el: HTMLElement) {
	if (show) {
		el.style.display = "block"
	} else {
		el.style.display = "none"
	}
}
