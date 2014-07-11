!function(){

angular.module("aFilePicker", [])

.service("aFilePicker", ["$q", function($q) {

	var onlyPostMsgString = !function(a){try{postMessage({toString:function(){a=1}},"*")}catch(e){}return!a}(),
		origin = "https://afilepicker.eu01.aws.af.cm",
		win = window,
		doc = document,
		usingMsgChannel = !!win.MessageChannel,
		defered,
		aFilePicker,
		aFileDialog;

	function el(tagName, attr, parent) {
		var el = doc.createElement(tagName);
		angular.extend(el, attr);
		parent.appendChild(el);
		return el;
	}

	function className(el,name){
		el.className = name || "";
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function keydown(event, key) {
		// TODO: can we move focus to the iframe and prevent everything
		// still want to be able to use cmd+l or ctrl+l win+d
		key = event.keyCode;
		key > 36 && key < 41 && preventDefault(event);
	}

	function disable_scroll() {
		// angular.element(document.documentElement).addClass('disable-scroll')
		angular.element([win, doc]).on('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).on('keydown', keydown);
		window.onmousewheel = document.onmousewheel = preventDefault;
	}

	function enable_scroll() {
		angular.element([win, doc]).off('DOMMouseScroll, mousewheel, touchstart', preventDefault);
		angular.element(doc).off('keydown', keydown);
	    window.onmousewheel = document.onmousewheel = null;
	}


	function messageHandler(event) {
		if(event.data.status == 200 || event.data.status == 204){
			enable_scroll();
			className(aFilePicker, 'picker-hide');
			defered.resolve(event.data.detail);
			event.target.removeEventListener(messageHandler);
		}
	}

	function createChannel(){
		return channel;
	};

	function open(option) {
		defered = $q.defer();

		if(!aFileDialog){
			aFileDialog = el("iframe", {
				id: "aFileDialog",
				src: origin + "/my-device",
				onload: function(){
					delete option.progress;

					var message = {
						detail: option,
						eventName: "aFilePicker::init",
						version: "v1"
					}

					// Try using MessageChannel first of all
					if(win.MessageChannel){
				    	var mc = new MessageChannel();

				    	// initialize the picker option
						aFileDialog.contentWindow.postMessage(message, origin, [mc.port2]);

						// Set up our port event listener.
						mc.port1.addEventListener('message', messageHandler, false);

						// Open the port
						mc.port1.start();
					} else {
						message.channel = "aFilePicker_" + (+new Date);

				    	// initialize the picker option
						aFileDialog.contentWindow.postMessage(message, origin);

						// Set up our event listener.
						window.addEventListener('message', function(event) {
							if(event.origin = origin && event.data.channel == message.channel){
								messageHandler(event);
							}
						});
					}

					// Show the filepicker dialog
					className(aFileDialog, "loaded");
				}
			}, aFilePicker = el("div", {
				id: "aFilePicker",
				onclick: function() {
					// remove the last pulse so we can do it again
					className(aFilePicker);

					// make one pulse
					// className() only takes 2 params so The third parameter won't realy do anything... but calculate the offsetWidth
					// That will trigger a reflow so we don't have to make a timeout
					className(aFilePicker, "pulse", aFilePicker.offsetWidth);
				}
			}, document.body));


			// aFileDialog.webkitRequestFullscreen();

		} else {
			className(aFilePicker);
		}

		disable_scroll();

		return defered.promise;
	}

	return {
		pick: open,
		saveAs: function(file, name) {

		}
	};
}])

.directive("aFilePicker", ["aFilePicker", function(aFilePicker) {
	return {
		restrict: "A",
		require: '^ngModel',
		link: function($scope, $element, $attr, $ctrl) {
			window.onresize = function(){
				var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
				var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

				$scope.$root.w = w;
				$scope.$root.h = h;
				$scope.$root.$apply();
			}

			$element.on('click', function(){

				aFilePicker.pick({
					responseType: "meta", //["image", "video", "audio", "blob", "file", "meta", "base64", "dataURL", "arrayBuffer", "text", "binary", "binary-utf8", "json", "document"]
					mimeType: "*/*",
					zipIt: false,
					extension: undefined,
					container: "window", // "window" or "popup" or "css selector" or "element" (popup if third party cookie blocking is enabled)
					maxWidth: Infinity,
					maxHeight: Infinity,
					language: "sv",
					services: ["device", "facebook"],
					maxFiles: Infinity,
					max: Infinity,
					min: 0,
					totalMax: Infinity,
					totalMin: 0,
					directory: false,
					progress: function(){

					}
				}).then(function(files) {
					$ctrl.$setViewValue(files);
					$ctrl.$render();
					// $ctrl.$modelValue = files;
					// $element.triggerHandler('input');
				}, function(error){
					console.log(error);
				});

			});

		}
	}
}]);

}();