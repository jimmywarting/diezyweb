var app = angular.module('wis', ['aFilePicker'])


function ListCtrl($scope) {
	var List = this
	window.List = List

	// Animate the transition in/out from cirkle
	List.click = function (d) {
		zoomIn(d)
		List.data = d;
	}

	// Returns the path by travling upwords from the current node
	List.path = root => {
		if (!root) return []

		let path = []
		let depth = root

		do {
			path.unshift(depth)
		} while (depth = depth.parent)

		path.unshift()

		return path
	}

	List.oninput = () => {
		let
		files = List.files || [],
		json = files.map(file => ({
			path: file.relativePath,
			name: file.name,
			size: file.name == '.' ? 0 : file.size,
			type: file.type
		}))

		// clear cache
		List.files = []
		files = null

		init()
	}
}
