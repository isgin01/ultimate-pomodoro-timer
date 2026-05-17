import { createDefaultPreset } from "ts-jest"

const tsJestTransformCfg = createDefaultPreset().transform

/** @type {import("jest").Config} **/
export default {
	// NOTE: jest uses node by default, use jsdom to emulate
	// environment of an electron app
	testEnvironment: "jsdom",
	transform: {
		...tsJestTransformCfg,
	},
}
