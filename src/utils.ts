import { Notice } from "obsidian"

export function notify(system: boolean, text: string) {
	if (system) {
		systemNotify(text)
	} else {
		obsidianNotify(text)
	}
}

/* eslint-disable */
function systemNotify(text: string) {
	var { Notification } = require("electron").remote

	new Notification({
		title: "Timer",
		body: text,
	}).show()
}
/* eslint-enable */

function obsidianNotify(text: string) {
	new Notice(text)
}
