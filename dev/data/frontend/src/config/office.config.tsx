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
					'hsl(185, 7%, 65%)',	// gray
					'hsl(67, 90%, 80%)',	// yellow
					'hsl(165, 60%, 80%)',	// green
					'hsl(185, 35%, 80%)',	// blue
			],
		}
	}
}
