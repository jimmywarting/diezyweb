Diezyweb
========

> "Take a different look at your hard drive"


![Screenshot](https://raw.github.com/jimmywarting/diezyweb/gh-pages/screenshot.png "Screenshot")


I wanted to learn some of d3.js to see what's like but didn't know what i would do. So I got inspired by [DaisyDisk](http://daisydiskapp.com/ "DaisyDisk") which analyzes you hard disk and tells you what's taking up all the space. And its WAY better then this

Browsers are now capitable of reading folders! (chrome at least) So it sould be possible to make the same kind of app in the browser without haveing to download anything.

### How to feed the graph with data:

This will let you select a folder and read all the files in it

	<input type=file webkitDirectory>

*Note: it's might be possible to use [drag-n-drop](http://updates.html5rocks.com/2012/07/Drag-and-drop-a-folder-onto-Chrome-now-available) to tarket more browsers like firefox and maybe even IE but I will stick to chromes simple webkitDirectory attribute for the simplisity of this demo*

After that we need to create a hierarchy from the Filelist-array to get something d3js [wants](https://github.com/mbostock/d3/wiki/Hierarchy-Layout#wiki-children) and understands.


	files = [
		{path: "public/robots.txt", name: "robots.txt", size: 84},
		{path: "public/js/.", name: ".", size:0},
		{path: "public/js/app.js", name: "app.js", size: 50212},
		{path: "public/js/app.js.map", name: "app.js.map", size: 24026},
		{path: "public/js/bootstrap.js", name: "bootstrap.js", size: 2328},
	]

	preview( toHierarchy(files) ); // boom done!
