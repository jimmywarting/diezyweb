!function(){

angular.module("aFilePicker", [])

.service("aFilePicker", ["$q", function($q) {

	var onlyPostMsgString = !function(a){try{postMessage({toString:function(){a=1}},"*")}catch(e){}return!a}(),
		origin = "https://afilepicker.eu01.aws.af.cm",
		win = window,
		doc = document,
		usingMsgChannel = !!win.MessageChannel,
		defered,
		emit,
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

	var curr, len, arr;

	function messageHandler(event) {

		if(event.data.eventName == "aFilePicker::close") {

			if(event.data.status == 200 || event.data.status == 204){
				enable_scroll();
				try{
					aFilePicker.close();
				} catch(e){
					aFilePicker.removeAttribute('open');
				}
				defered.resolve(event.data.detail);
			}

		};

	}

	function createChannel(){
		return channel;
	};

	function instace(option){
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
			mc.port1.onmessage = messageHandler;

			// Open the port
			mc.port1.start();

			emit = function (msg) {
				msg.version = "v1";
				mc.port1.postMessage(msg);
			}
		} else {
			var channel = "aFilePicker_" + (+new Date);
	    	// initialize the picker option

	    	emit = function (msg) {
	    		msg.version = "v1";
	    		msg.channel = channel;
	    		aFileDialog.contentWindow.postMessage(msg, origin);
	    	}

	    	emit(message);

			// Set up our event listener.
			window.addEventListener('message', function(event) {
				if(event.origin = origin && event.data.channel == message.channel){
					messageHandler(event);
				}
			});
		}

		// Show the filepicker dialog
		try{
			aFilePicker.showModal();
		} catch(e){
			aFilePicker.setAttribute('open', '');
		}
	}

	function open(option) {
		defered = $q.defer();

		if(!aFileDialog){
			aFileDialog = el("iframe", {
				id: "aFileDialog",
				src: origin + "/my-device",
				// allowTransparency: true,
				onload: function(){
					instace(option);
				}
			}, aFilePicker = el("dialog", {
				id: "aFilePicker"
			}, document.body));
		} else {
			instace(option);
		}

		disable_scroll();

		return defered.promise;
	}

	return {
		pick: open,
		save: function(option) {
			option.saveMode = true;
			open(option);
		}
	};
}])

.directive("aFilePicker", ["aFilePicker", function(aFilePicker) {
	return {
		restrict: "A",
		require: '^ngModel',
		link: function($scope, $element, $attr, $ctrl) {

			$element.on('click', function(){
				aFilePicker.pick($scope.$eval($attr.aFilePicker) || {}).then(function(files) {
					$ctrl.$setViewValue(files);
					$ctrl.$render();
				});
			});

		}
	}
}]);

}();