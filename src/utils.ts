import { Notice } from 'obsidian'

export function notify(system: boolean, text: string) {
	if (system) {
		systemNotify(text)
	} else {
		obsidianNotify(text)
	}
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- suppress errors about calls to electron api*/
function systemNotify(text: string) {
	var { Notification } = window.require('electron').remote

	new Notification({
		title: 'Timer',
		body: text,
	}).show()
}
/* eslint-enable*/

function obsidianNotify(text: string) {
	new Notice(text)
}

export function alterVisibility(el: HTMLElement, show: boolean) {
	el.setCssProps({ display: show ? 'block' : 'none' })
}

export function isProperNumber(i: string): false | number {
	let num = Number(i)
	if (isNaN(num)) {
		return false
	}
	return num
}
