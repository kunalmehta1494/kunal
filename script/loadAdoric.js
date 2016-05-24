    var adoricInterface;

    window.Adoric = window.Adoric || (function () {
        var pagesMap = {
			homePage: '^wix\.com$',
            templatesPage: '^wix.com/website/templates$',
            MA_Dashboard: 	'^wix\.com\/my-account\/sites\/.+', //in the dashboard there must be additional chars after 'sites/...' (specifically if it's a - then it might be the one we use for MA_mySites_2 and in any case that couldn't be valid)
																	//https://www.wix.com/my-account/sites/noredirect?referralInfo=
			MA_mySites: 	'^wix\.com\/my-account\/sites\$', //the my-account page ends with 'sites' with no further params.
			MA_mySites_2: 	'^wix\.com\/my-account\/sites-this_is_MySitesFromTopLogoOnSiteDashboard$', //originally it ends with /sites/-uaToken?... but we replace it here. this is a special trick - when I want the same page to have multiple regexes, I place the other ones under pageName_2,3...
            templatesViewer:'^wix\.com\/website-template\/view',
            LP1: 			'^wix\.com\/eteamhtml\/templates-us$',
			LP10: 			'^wix\.com\/buildyourwebsite5\/stunning_sam_no'

			// adorictest: {
                // url: 'editor.wix.com'
            // },
            // LPTest: {
                // url: 'www.wix.com/arikwa/copy-of-stunning_sam'
            // },
            // packagePickerAnon: {
                // url : 'www.wix.com/upgrade/website'
            // },
            // templatesPageGlida: {
                // url : 'www.glida.wixpress.com/website/templates'
            // },
            // templatesPagePizza: {
                // url : 'www.pizza.wixpress.com/website/templates/'
            // },
        };
        var biMap = {
            close: {
                0: {type: 'closed by click link redirect', evid: 666},
                1: {type: 'closed [by submit form]', evid: 666},
                2: {type: 'closed [by autoclose timer]', evid: 37},
                4: {type: 'closed by user', evid: 36}
            },
            show: {
                0: {type: 'show default', evid: 35},
                1: {type: 'show [by timer]', evid: 35},
                4: {type: 'show by mouseout', evid: 35}
            },
            click: {
                0: {type: 'template click', evid: 38},
                1: {type: 'form click', evid: 666}
            },
            versionSelected: {
                0: {type: 'version selected', evid: 40}
            }
        };
        var FAKE_GUID = 'A1111111-11AA-11AA-A111-1AA11AAA1111';

		function getCurrentURL() { //this is for testing purposes. if loaded in a test environment, returns fake URLs. otherwise returns the real URL.
			var ret = typeof fakeLocation === 'string' ? fakeLocation : window.location.href;
			ret = ret.replace(/https*:\/\//,'').replace("http://",''); //remove any http[s] from the beginning
			ret = ret.replace(/\/$/,''); //remove any trailing slashes
			ret = ret.replace(/\/\?uaToken=.+/,''); //special treatment for my-account when the user reaches it right after login, when there are multiple sites (otherwise it opens the site dashboard)
			ret = ret.replace(/\/noredirect\?referralInfo=$/,'-this_is_MySitesFromTopLogoOnSiteDashboard'); //before removing params, there's one specific case where we need to identify based on the params
			ret = ret.replace(/\?.*$/,''); //if there are any ?params, we remove them.
			
			return ret;
		}

		function getURLbeforeCleaning(){
			return fakeLocation; //this function is only used by the testing scripts, so it's safe to call this variable although it doesn't exist on production
		}
		
        function isTemplateViewer() {
            return Adoric.getCurrentURL().indexOf('/view/') > -1;
        }

        // a specific site dashboard page
        function isSiteDashboard(url) {
			return url.match(/^wix.com\/my-account\/sites/) ? true : false; //so as not to return an array of matches
        }

        function shouldCallAdoric(petriResponse) {
            /* petriResponse = {
             "adoric2": "hidden",
             "templatesViewer": "hidden",
             "templatesPagePT": "hidden",
             "templatesPage": "visible",
             "templatesPageGlida": "visible",
             "templatesPageES": "visible",
             "adorictest": "visible",
             "templatesPagePizza": "visible"
             }*/

            return _.contains(_.keys(petriResponse), findPageNameFromUrl());
        }

		function getAndRemoveLocale(url) {
			var matches = url.match(/^(([^.]{2,3})\.)?(wix\.com.*)/); //the extra ()? are because on some LPs we are called with no subdomain
			var locale = matches[2] ? matches[2] : ''; //if there's no subdomain, we'll address it like it's EN, which means an empty string
			locale = locale.replace('www','').toUpperCase(); //www is a special case that we turn to none, and all others we switch to upper case (JP,FR...)
			return {
				locale: 	locale,
				cleanUrl: 	matches[3]
			}
		}
		
        function findPageNameFromUrl() {
			try {
				var url = Adoric.getCurrentURL();
				
				var locale, cleanUrl, ret;
				ret = getAndRemoveLocale(url);
				locale = ret.locale;
				cleanUrl = ret.cleanUrl;

				var pageName='';
				
				_.forOwn(_.keys(pagesMap), function(index) {
					if(cleanUrl.match(pagesMap[index])) {
						pageName = index;
						return false; //this is how to break the loop in this case
					}
				});
				return pageName ? pageName.replace(/_\d$/,'') + locale : ''; //this is a special trick - when I want the same page to have multiple regexes, I place the other ones under pageName_2,3...
			}
			catch(e) {
				return '';
			}
        }

        function extractPetriValue(petriResponse) {
            return _.first(_.values(_.pick(petriResponse, findPageNameFromUrl())));
        }

        function callAdoric() {
            var adoric = document.createElement('script');
            adoric.src = 'https://adoric.com/adoric.js?key=7d2e5d7f21df290e88ffd343d418dc25';
            adoric.setAttribute('type', 'text/javascript');
            adoric.setAttribute('class', '__ADORIC__');
            adoric.setAttribute('id', '__ADORIC__SCRIPT__');
            adoric.setAttribute('async', 'true');

            adoric.onload = function () {
                window.AdoricReady();
            };
            adoric.onerror = function () {
                new Image(0, 0).src = BIDomain + 'adoric?src=2&evid=42&is_visible=' + (window.Adoric.petriValue === 'visible');
            };
            document.body.appendChild(adoric);
        }

        function getAndSendUserProfile() {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var biReposnse = JSON.parse(xmlhttp.responseText);
                    var userData = biReposnse.payload && biReposnse.payload.fields;
                    var params = {};
                    if (userData) {
                        for (var i = 0; i < userData.length; i++) {
                            var user = userData[i];
                            var sendToAdoric = '';
                            var paramBoolean = 'no';
                            switch (user.name) {
                                case 'first_publish':
                                    params.publishedSite = !!user.value;
                                    break;
                                case 'first_premium_site_id':
                                    params.premium = !!user.value;
                                    break;
                                case 'first_saved_site_date':
                                    params.savedSite = !!user.value;

                                    break;
                                case 'first_dashboard_visit_date':
                                    params.secondTimeOnMA = !!user.value;
                                    break;
                            }
                        }
                    }
                    var info = document.cookie.split('; ');
                    var cookieData = {};
                    info.forEach(function (index) {
                        var arr = index.split('=');
                        if (arr[0] === '_wixUIDX') {
                            cookieData[arr[0]] = arr[1];
                        }
                    });

                    // registered === false when cookieData['_wixUIDX'] is null, or when cookieData['_wixUIDX'] === 'null-user-id'
                    if (!cookieData['_wixUIDX']) {
                        params.registered = false;
                    } else {
                        params.registered = !(cookieData['_wixUIDX'] === 'null-user-id');
                    }

                    // if registered === false send all other params as false to Adoric
                    if (!params.registered) {
                        params.publishedSite = false;
                        params.premium = false;
                        params.savedSite = false;
                    }

                    adoricInterface.trigger(this, 'userProfile', params);
                }
            };
            xmlhttp.open('GET', '/_api/wix-bi-profile-server/userprofile?fields=first_publish,first_premium_site_id,first_saved_site_date,first_dashboard_visit_date&accept=json', true);
            xmlhttp.send();
        }

        function getAdoricLabelCounter() {
            var counter = 0;
            if (localStorage.getItem('adoricLabelCalledByPageCounter')) {
                counter = parseInt((localStorage.getItem('adoricLabelCalledByPageCounter'))) + 1;
            }
            localStorage.setItem('adoricLabelCalledByPageCounter', counter);
            return localStorage.getItem('adoricLabelCalledByPageCounter');
        }

        function addLodash() {
            // transfer to requirejs
            var lodash = document.createElement('script');
            lodash.src = 'https://static.parastorage.com/services/third-party/lodash/3.10.1/lodash.min.js';
            lodash.onload = function () {
                //console.log('lodash loaded');
            };
            document.body.appendChild(lodash);
        }

        function getPetriExperiments() {
            if (typeof(_) !== 'function') {
                window.Adoric.addLodash();
            }
			setTimeout(function(){ //time to load lodash...
					if(findPageNameFromUrl()) {
						var xmlhttp = new XMLHttpRequest();

						xmlhttp.onreadystatechange = function() {
							if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
								window.Adoric.petriValue = xmlhttp.responseText;

								if(window.Adoric.petriValue !== 'donothing') {
									window.adoricLabelCalledByPage();
									window.Adoric.callAdoric();
								}
							}
							// 404 - Not found; 408 - Request Timeout; 500 - Internal Server Error
							if (xmlhttp.status == 404 || xmlhttp.status == 408 || xmlhttp.status == 500) {
								new Image(0, 0).src = BIDomain + '/trg?src=2&evid=10&cat=1&sev=30&iss=1&errc=11111&ver=1&did=' + FAKE_GUID + '&errn=Error_Getting_VIsibility_From_Petri&dsc=Error getting visibility experiment from petri ' + xmlhttp.status;
							}
						};
						xmlhttp.open('GET', '/_api/wix-laboratory-server/laboratory/conductExperiment?key=' + findPageNameFromUrl() + '&fallback=donothing', true);
						xmlhttp.send();
					}
				},
				2000
			);
        }

        return {
			getCurrentURL: getCurrentURL,
			getURLbeforeCleaning: getURLbeforeCleaning,
			isSiteDashboard: isSiteDashboard,
            getPetriExperiments: getPetriExperiments,
            callAdoric: callAdoric,
            addLodash: addLodash,
            findPageNameFromUrl: findPageNameFromUrl,
            getAdoricLabelCounter: getAdoricLabelCounter,
            getAndSendUserProfile: getAndSendUserProfile,
            isTemplateViewer: isTemplateViewer,
            biMap: biMap,
            pagesMap: pagesMap
        }
    })();

	var BIDomain = Adoric.getCurrentURL().indexOf('wixpress') != -1 ? 'http://frog.wixpress.com/' : 'http://frog.wix.com/';

    window.adoricLabelCalledByPage = function () {
        var isVisible = window.Adoric.petriValue === 'visible';
        var pageName = window.Adoric.findPageNameFromUrl();
        var adoricCounter = window.Adoric.getAdoricLabelCounter();

        new Image(0, 0).src = BIDomain + 'adoric?src=2&evid=4&is_visible=' + isVisible + '&event_counter=' + adoricCounter + '&page_name=' + pageName;
    };

    window.AdoricReady = function () {
        adoricInterface = window.adoric;
        adoricInterface.trigger(this, 'setConfig', {'isVisible': window.Adoric.petriValue === 'visible'});

        if (window.Adoric.isTemplateViewer()) {
            window.templateEditUrl ? adoricInterface.trigger(this, 'setDynamicLink', {'ident_url_any_text': window.templateEditUrl}): console.log('missing templateEditUrl');
        }

        function makeCallback(eventId) {
            return function (data) {
                var id;
                var reasonKey = data.reason || 0;
                switch (eventId) {
                    case 'lightbox:before:show':
                        id = 'show';
                        break;
                    case 'lightbox:before:close':
                        id = 'close';
                        break;
                    case 'lightbox:before:click':
                        id = 'click';
                        break;
                    case 'version:selected':
                        id = 'versionSelected';
                        break;
                }
                if (window.Adoric.biMap[id][reasonKey].evid === 666) {
                    return
                }
                var params = 'evid=' + window.Adoric.biMap[id][reasonKey].evid + '&lb_id=' + data.lightbox.id + '&adoric_uuid=' + data.userId;
                if (window.Adoric.biMap[id][reasonKey].evid === 38) {
                    params += '&value=' + data.track + '&action=click&type=link';
                }
                if (window.Adoric.biMap[id][reasonKey].evid === 35 || window.Adoric.biMap[id][reasonKey].evid === 40) {
                    params += '&is_visible=' + data.isVisible;
                }

                new Image(0, 0).src = BIDomain + 'adoric?src=2&' + params + '&_=' + new Date().getTime();
            }
        }

        window.Adoric.getAndSendUserProfile();
        if (adoricInterface) {
            adoricInterface.on('version:selected', makeCallback('version:selected'));
            adoricInterface.on('lightbox:before:show', makeCallback('lightbox:before:show'));
            adoricInterface.on('lightbox:before:click', makeCallback('lightbox:before:click'));
            adoricInterface.on('lightbox:before:close', makeCallback('lightbox:before:close'));
        }
    }
