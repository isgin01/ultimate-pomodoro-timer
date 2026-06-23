import { Menu } from 'obsidian'
import { type Timer } from './timer'
import { alterVisibility } from './utils'

export default function StatusBarItem(
	element: HTMLElement,
	timer: Timer,
	show: boolean,
) {
	// Make the status bar clickable
	element.className += ' mod-clickable'

	element.addEventListener('click', () => {
		timer.toggle()
	})

	// Menu that will appear on auxclick

	let menu = new Menu()

	menu.addItem((i) => {
		i.setTitle('Reset').onClick(() => timer.reset())
	})
	menu.addItem((i) => {
		i.setTitle('Switch').onClick(() => timer.switch())
	})

	element.addEventListener('auxclick', (ev) => {
		menu.showAtMouseEvent(ev)
	})

	let updateCb = (HFTime: string) => {
		element.innerText = HFTime
	}

	// Set initial value

	updateCb(timer.HFTime)

	timer.on(['tick', 'toggle', 'reset'], updateCb)

	alterVisibility(element, show)
}
