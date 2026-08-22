/*
	macros defined for office space setup
*/

export const officeSceneConfig = {
	Network: {
		emit_every_n_frames: 3,
	},
	Movement: {
		keyboard_speed: 5,
		click_speed: 0.04,
	},
	Player: {
		radius: 1,
		segments: 24,
	},
	World: {
		width: 120,
		height: 50,
		border: 10, // *0.2
	},
	Color: {
		startHue: 0,
		endHue: 210,
		themes: {
			golden: [
					'hsl(240, 50%, 75%)',	// purple
					'hsl(67, 90%, 80%)',	// yellow
					'hsl(29, 25%, 65%)',	// brown
					'hsl(193, 35%, 65%)',	// blue
			],
			fresh: [
					'#5F6B6C',
					'#D1DF83',
					'#524436',
					'#90B8BC',
			],
		}
	}
}
