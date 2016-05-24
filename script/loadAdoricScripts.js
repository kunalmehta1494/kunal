//static.parastorage.com/services/third-party/Adoric/loadAdoricScripts.js
(function(){
	var script = document.createElement('script');
	script.src = "//static.parastorage.com/services/third-party/Adoric/1.2.8/loadAdoric.js";
	script.onload = function () {		
		//console.log('loadAdoric.js loaded');
		window.Adoric.getPetriExperiments();			
		
	};
	script.onerror = function () {
		console.log('Error loading scripts');
	};
	document.body.appendChild(script);
})();

