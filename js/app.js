window.app = angular.module('wis', [])

app.controller('MainCtrl', ['$scope', function($scope){
	let Main = window.Main = this
	window.rootScope = $scope.$root

	Main.noFiles = true
	return
}])

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
	var path = []

	while (node.parent) {
		path.unshift(node)
		node = node.parent
	}

	return path
}


var filesize = size => {
	for(var i = 0, unit = 'Byte0KB0MB0GB0TB0PB0EB0ZB0YB'.split(0);
		1024 <= size; // While the size is smaller
		i++
	) size /= 1024;

	return size ? (size+.5|0) + ' ' + unit[i] : '--' // jshint ignore:line
}

// Returns human friendly file size
app.filter('filesize', () => filesize)

/*
class FindDups {
	constructor(root) {
		this.hexSet = Object.create(null)
		this.nameSet = Object.create(null)
		this.sizeSet = Object.create(null)

		// walk the tree
	}

	compareStreams() {
		var sameSizes = Object.values(set).filter(a => a.length > 1).map(entries => {
			// entries is set of files with same size
			for (let entry of entries) {
				let startingAB = new ArrayBuffer(15)

				entry.file(file => {
					let reader = file.stream().getReader({ mode: 'byob' })
					readInto(reader, startingAB)
					.then(buffer => console.log("The first 10 bytes:", new Uint8Array(buffer)))
					.catch(e => console.error("Something went wrong!", e))
				})
			}
		})
	}
}
*/

app.directive('wisDropzone', () => {
	let readFile = entry => new Promise(r =>
		requestIdleCallback(() =>
			entry.getMetadata(r)
		)
	)
	let readFolder = a => new Promise(r => {
		requestIdleCallback(() =>
			a.createReader().readEntries(r)
		)
	})

	return {
		controller: ['$scope', '$element', ($scope, $element) => {
			let elm = $element[0]
			let {$root, Main} = $scope

			async function recrusive(cwd, entries) {
				entries = entries.map(entry => {

					let child = entry.isFile
						? {name: entry.name}
						: {open: false, name: entry.name, children: []}

					cwd.children.push(child)
					return [entry, child]
				})

				await Promise.all(entries.map(([entry, child]) =>
					entry.isFile
						? readFile(entry).then(meta => child.size = meta.size)
						: readFolder(entry).then(entries => recrusive(child, entries))
				))

				cwd.done = true
				$root.$apply()
			}

			elm.ondragover = event => {
				event.preventDefault()
				return false
			}

			elm.ondrop = async event => {
				event.preventDefault()
				let entries = [...event.dataTransfer.items].map(item =>
					item.webkitGetAsEntry()
				)

				let root = {
					name: '/',
					children: [],
					entries
				}

				Main.root = root
				$root.$apply()



				function readInto(reader, buffer, offset = 0) {
					if (offset === buffer.byteLength) {
				    return Promise.resolve(buffer)
				  }

				  const view = new Uint8Array(buffer, offset, buffer.byteLength - offset)
				  return reader.read(view).then(({value, done}) => {
						if(done) return value.buffer
						return readInto(reader, value.buffer, offset + value.byteLength)
				  })
				}

				await recrusive(root, entries)
				init(root)
				$root.$apply()
			}
		}]
	}
})

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

	breadcrumb.innerHTML = ''

  for (let node of nodeArray) {
		let a = document.createElement('a')
		a.innerText = node.name
		a.style.backgroundColor = node.fill
		breadcrumb.appendChild(a)
	}

	let span = document.createElement('a')
	span.innerText = percentageString
	breadcrumb.appendChild(span)
}


function init(root) {
	$$svg.innerHTML = ''

	var circles = 6
	var color = d3.scale.category20c()
	var margin = {top: 350, right: 480, bottom: 350, left: 480}
		radius = 270

	var svg = d3.select($$svg).append("svg")
		.attr("width", margin.left + margin.right)
		.attr("height", margin.top + margin.bottom)
		.append("g")
		.attr("transform", `translate(${margin.left}, ${margin.top})`)

	var partition = d3.layout.partition()
		.sort((a, b) => d3.ascending(a.name, b.name))
		.size([2 * Math.PI, radius])

	var arc = d3.svg.arc()
		.startAngle(d => d.x)
		.endAngle(d => d.x + d.dx)
		.padAngle(.01)
		.padRadius(radius / circles)
		.innerRadius(d => radius / circles * d.depth)
		.outerRadius(d => radius / circles * (d.depth + 1) - 1)

	var zoomOut = p => {
		if (!p.parent) return
		zoom(p.parent, p)
	}

	var center = svg.append("circle")
		.attr("r", radius / circles)
		.on("click", zoomOut)

	var text = svg.append("text")
		.style('fill', 'white')
		.style('pointer-events', 'none')
		.attr({
			dy: 5,
			dx: 2,
			"text-anchor": "middle",
		})

	var outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

	var updateArc = d => ({depth: d.depth, x: d.x, dx: d.dx})

	var outsideArc = d => ({
		depth: d.depth + 1,
		x: outsideAngle(d.x),
		dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)
	})

	var zoomIn = p => {
		if (p.depth > 1) p = p.parent
		if (!p.children) return
		zoom(p, p)
	}

	var key = d => {
		var k = [], p = d
		while (p.depth) k.push(p.name), p = p.parent
		return k.reverse().join('.')
	}

	var fill = d => {
		return d.children ? color(d.depth) : 'gray'
	}

	function arcTween(b) {
		let i = d3.interpolate(this._current, b)
		this._current = i(0)
		return t => arc(i(t))
	}

	// Fade all but the current sequence, and show it in the breadcrumb trail.
	function mouseover(d) {

		var percentage = (100 * d.value / totalSize).toPrecision(3)
		var percentageString = percentage + "%"
		if (percentage < 0.1) {
			percentageString = "< 0.1%"
		}

		d3.select("#percentage")
			.text(percentageString)

		d3.select("#explanation")
			.style("visibility", "")

		var sequenceArray = getAncestors(d)
		updateBreadcrumbs(sequenceArray, percentageString)

		// Fade all the segments.
		d3.selectAll('path')
			.style('opacity', 0.7)
			// Then highlight only those that are an ancestor of the current segment.
			.filter(node => sequenceArray.includes(node))
			.style('opacity', 1)
	}

	// Zoom to the specified new root.
	function zoom(root, p) {
		if (document.documentElement.__transition__) return

		// Rescale outside angles to match the new layout.
		var enterArc, exitArc

		function insideArc(d) {
			return p.key > d.key
				? {depth: d.depth - 1, x: 0, dx: 0}
				: p.key < d.key
					? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
					: {depth: 0, x: 0, dx: 2 * Math.PI}
		}

		center.datum(root)

		// When zooming in, arcs enter from the outside and exit to the inside.
		// Entering outside arcs start from the old layout.
		if (root === p) {
			enterArc = outsideArc
			exitArc = insideArc
			outsideAngle.range([p.x, p.x + p.dx])
			Main.data = p
			text.text(filesize(p.sum))
			p.open = true
			rootScope.$apply()
		}

		path = path.data(
			partition
			.nodes(root)
			.slice(1)
			.filter(d => d.dx > 0.005), d => d.key
		)

		// When zooming out, arcs enter from the inside and exit to the outside.
		// Exiting outside arcs transition to the new layout.
		if (root !== p) {
			enterArc = insideArc
			exitArc = outsideArc
			outsideAngle.range([p.x, p.x + p.dx])

			Main.data = root
			text.text(filesize(root.sum))
			root.open = true
			rootScope.$apply()
		}

		d3.transition().duration(750).each(() => {
			path.exit().classed('transition-remove', true).transition()
				.attrTween('d', function(d) { return arcTween.call(this, exitArc(d)) })
				.remove()

			path.enter().append('path')
				.style('fill', d => d.fill)
				.on('click', zoomIn)
				.on('mouseover', mouseover)
				.each(function(d) { this._current = enterArc(d) })

			path.transition()
				.attrTween('d', function(d) { return arcTween.call(this, updateArc(d)) })
		})
	}


	// Compute the initial layout on the entire tree to sum sizes.
	// Also compute the full name and fill color for each node,
	// and stash the children so they can be restored as we descend.
	partition
		.value(d => d.size)
		.nodes(root)
		.forEach(d => {
			d._children = d.children
			d.sum = d.value
			d.key = key(d)
			d.fill = fill(d)
		})

	// Now redefine the value function to use the previously-computed sum.
	partition
		.children((d, depth) => depth < circles-1 ? d._children : null)
		.value(d => d.sum)

	window.path = svg.selectAll('path')
		.data(partition.nodes(root).slice(1).filter(d => d.dx > 0.005))
		.enter().append('path')
		.attr('d', arc)
		.style('fill', d => d.fill)
		.each(function(d) {
			this._current = updateArc(d)
		})
		.on('click', p => zoomIn(p))
		.on('mouseover', mouseover)

	window.totalSize = window.path.node().__data__.value
	text.text(filesize(root.sum))

	var nav = document.createElement('nav')
	nav.id = 'breadcrumb'
	$$svg.appendChild(nav)
}
