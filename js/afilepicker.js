var initItems = {
	"name": "Root",
	"children": [{
		"name": "A1",
		"children": [{
			"name": "B1",
			"size": 30
		}, {
			"name": "B2",
			"size": 40
		}, {
			"name": "B3",
			"children": [{
				"name": "C1",
				"size": 10
			}, {
				"name": "C2",
				"size": 15
			}]
		}]
	}, {
		"name": "A2",
		"children": [{
			"name": "B4",
			"size": 40
		}, {
			"name": "B5",
			"size": 30
		}, {
			"name": "B6",
			"size": 10
		}]
	}, {
		"name": "A3",
		"children": [{
			"name": "B7",
			"size": 50
		}, {
			"name": "B8",
			"size": 15
		}

	]
}]
}

var newItems = {
	"name": "Root",
	"children": [{
		"name": "A2",
		"children": [{
			"name": "B4",
			"size": 40
		}, {
			"name": "B5",
			"size": 30
		}, {
			"name": "B6",
			"size": 10
		}]
	}, {
		"name": "A3",
		"children": [{
			"name": "B7",
			"size": 50
		}, {
			"name": "B8",
			"size": 15
		}

	]
}]
}

var width = 500,
height = 500,
radius = Math.min(width, height) / 2;

var x = d3.scale.linear()
.range([0, 2 * Math.PI]);

var y = d3.scale.sqrt()
.range([0, radius]);

var color = d3.scale.category10();

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height)
.append("g")
.attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ") rotate(-90 0 0)");

var partition = d3.layout.partition()
.value(function(d) {
	return d.size;
});

var arc = d3.svg.arc()
.startAngle(function(d) {
	return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
})
.endAngle(function(d) {
	return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
})
.innerRadius(function(d) {
	return Math.max(0, y(d.y));
})
.outerRadius(function(d) {
	return Math.max(0, y(d.y + d.dy));
});

function computeTextRotation(d) {
	var angle = x(d.x + d.dx / 2) - Math.PI / 2;
	return angle / Math.PI * 180;
}

// Word wrap!
var insertLinebreaks = function(t, d, width) {
	alert(0)
	var el = d3.select(t);
	var p = d3.select(t.parentNode);
	p.append("g")
	.attr("x", function(d) {
		return y(d.y);
	})
	//    .attr("dx", "6") // margin
	//.attr("dy", ".35em") // vertical-align
	.attr("transform", function(d) {
		return "rotate(" + computeTextRotation(d) + ")";
	})
	//p
	.append("foreignObject")
	.attr('x', -width / 2)
	.attr("width", width)
	.attr("height", 200)
	.append("xhtml:p")
	.attr('style', 'word-wrap: break-word; text-align:center;')
	.html(d.name);
	alert(1)
	el.remove();
	alert(2)
};

//g.selectAll("text")
//    .each(function(d,i){ insertLinebreaks(this, d, 50 ); });

// Interpolate the scales!
function arcTween(d) {
	var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
	yd = d3.interpolate(y.domain(), [d.y, 1]),
	yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
	return function(d, i) {
		return i ? function(t) {
			return arc(d);
		} : function(t) {
			x.domain(xd(t));
			y.domain(yd(t)).range(yr(t));
			return arc(d);
		};
	};
}

function arcTweenUpdate(a) {
	console.log(path);
	var _self = this;
	var i = d3.interpolate({ x: this.x0, dx: this.dx0 }, a);
	return function(t) {
		var b = i(t);
		console.log(window);
		_self.x0 = b.x;
		_self.dx0 = b.dx;
		return arc(b);
	};
}

var updateChart = function (items) {
	var root = items;
	// DATA JOIN - Join new data with old elements, if any.
	var gs = svg.selectAll("g").data(partition.nodes(root));

	// ENTER
	var g = gs.enter().append("g").on("click", click);

	// UPDATE
	var path = g.append("path")

	gs.select('path')
	.style("fill", d =>
		color((d.children ? d : d.parent).name)
	)
	//.on("click", click)
	.each(function(d) {
		this.x0 = d.x;
		this.dx0 = d.dx;
	})
	.transition().duration(500)
	.attr('d', arc)


	var text = g.append('text')

	gs.select('text')
		.attr('x', (d) => y(d.y))
		.attr('dx', '6') // margin
		.attr('dy', '.35em') // vertical-align
		.attr('transform', d => `rotate(${computeTextRotation(d)})`)
		.text(d => d.name)
		.style('fill', 'white')

	function click(d) {
		// fade out all text elements
		if (d.size !== undefined)
			d.size += 100

		text.transition().attr('opacity', 0)

		path.transition()
		.duration(750)
		.attrTween('d', arcTween(d))
		.each('end', (e, i) => {
			// check if the animated element's data e lies within the visible angle span given in d
			if (e.x >= d.x && e.x < (d.x + d.dx)) {
				// get a selection of the associated text element
				var arcText = d3.select(this.parentNode).select('text');
				// fade in the text element and recalculate positions
				arcText.transition().duration(750)
				.attr('opacity', 1)
				.attr('transform', () =>
					`rotate(${computeTextRotation(e)})`
				)
				.attr("x", d => y(d.y))
			}
		})
	}


	// EXIT - Remove old elements as needed.
	gs.exit().transition().duration(500).style("fill-opacity", 1e-6).remove()
}
alert(1)
updateChart(initItems);

setTimeout(function () { updateChart(newItems); }, 2000);
