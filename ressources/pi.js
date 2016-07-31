/*! Copyright (c) 2016 Plug-It <contact.wibla@gmail.com>
 * Licensed under the GNU License (LICENSE.txt).
 */

;(function(){
if (typeof pi !== 'undefined') pi.reload();
else {
	var startTime = new Date().getTime();
	var afkCD = startTime;
	var thisCommit;
	var ranks;
	var lang;
	var plugBG;

	// Status (can be used to debug)
	$('.app-header').after(
		$('<div id="pi-status">\
			<img height="" src="">\
			<span></span>\
		</div>').css({
			position: 'absolute',
			top: '65px', left: '15px',
			padding: '5px',
			color: '#DDD',
			background: '#181C21',
			borderRadius: '5px',
			boxShadow: '0 0 3px #000',
			transition: 'all .25s ease-in-out'
		})
	);
	function updateStatus(txt, status) {
		$('#pi-status span')[0].innerHTML = 'PI is loading..<br>'+txt+'<br>Status: '+status;
	};
	
	// Get last commit of any project, used to know if an update is available
	function getLastCommit(url, callback) {
		var xhr = new XMLHttpRequest;
		xhr.open('GET', url);
		xhr.onload = callback;
		xhr.send();
	}
	getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data){thisCommit = JSON.parse(data.currentTarget.responseText);});

	// Load user language
	updateStatus('Loading user language', 1);
	switch (API.getUser().language) {
		case 'fr': lang = 'fr'; break;
		case 'pt': lang = 'pt'; break;
		case 'en':
		default: lang = 'en'; break;
	}
	$.ajax({
		dataType: 'json',
		url: 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/lang/'+lang+'.json',
		success: function(data) {
			lang = data;

			updateStatus('Fetching script ranks', 2);
			$.ajax({
				dataType: 'json',
				url: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/ranks.json',
				success: function(data) {
					ranks = data;
				},
				error: function(e){
					console.log('[Plug-It] Unexpected error: '+e.responseText);
					API.chatLog('[Plug-It] Unexpected error: '+e.responseText);
				}
			});
		},
		error: function(e){
			console.log('[Plug-It] Unexpected error: '+e.responseText);
			API.chatLog('[Plug-It] Unexpected error: '+e.responseText);
		}
	});
	
	// Retrieve user settings if available
	updateStatus('Loading user settings', 3);
	var ls = localStorage.getItem('pi-settings');
	window.settings = {
		// General
		autoW: false,
		autoDJ: false,
		keyboardShortcuts: false,
		chatCommands: true,
		betterMeh: false,
		navWarn: false,
		afk: false,
		afkMessage: null,
		// Customisation
		showVideo: true,
		CSS: false,
		bg: null,
		oldChat: false,
		oldFooter: false,
		smallMedia: false,
		// Moderation
		userInfo: false,
		songLimit: false,
		songLength: 480,
		historyAlert: false,
		// Notifications
		boothAlert: false,
		boothPosition: 3,
		userMeh: false,
		userGrab: false,
		userJoin: false,
		userLeave: false,
		guestJoin: false,
		guestLeave: false,
		friendConnect: false,
		friendDisconnect: false,
		gainNotification: false
	};
	if (typeof ls == 'string') {
		// Making sure user settings are up to date
		var usrSettings = JSON.parse(ls);
		for (var obj in settings) {
			if (!usrSettings[obj]) {
				usrSettings[obj] = settings[obj];
			}
		}
		localStorage.setItem('pi-settings', JSON.stringify(usrSettings));
		settings = usrSettings;
	} else {
		localStorage.setItem('pi-settings', JSON.stringify(settings));
	}

	sessionStorage.setItem('modSkipWarn', false);
	sessionStorage.setItem('modQuitWarn', false);
	sessionStorage.setItem('trustWarn', false);
}

window.pi = {
	// ╔══════════════════╗
	// ║    VARIABLES     ║
	// ╚══════════════════╝
	version: '1.0.0 pre-19 Patch 2',
	url: {
		script: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js',
		menu_css: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/menu.css',
		old_chat: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/old-chat.css',
		old_footer: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/old-footer.css',
		small_media: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/small-media.css',
		blue_css: 'https://rawgit.com/Plug-It/pi/pre-release/ressources/blue.css'
		// Not sure if I'll keep this
		// notif: 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/ressources/notif.wav',
	},
	user: API.getUser(),
	// ╔══════════════════╗
	// ║    FUNCTIONS     ║
	// ╚══════════════════╝
	getRank: function(id) {
		var result = [], user;

		if (!id) {
			user = pi.user;
			id = user.id;
		}
		else user = API.getUser(id);
		
		for (var rank in ranks) {
			for (var users in ranks[rank]) {
				if (id == ranks[rank][users]) result.push(rank);
			}
		}
		
		return result;
	},
	isRank: function(rank, id) {
		if (!rank) return null;
		var result = pi.getRank(id);

		for (var ranks in result) {
			result[ranks] = result[ranks].toLowerCase();
			rank = rank.toLowerCase();
			if (result[ranks] == rank) return true;
		}
		return false;
	},
	complete: function(txt) {
		txt = txt.split(' ');
		for (var i = 0; i < txt.length; i++) {
			if (txt[i].charAt(0) == '$') {
				switch(txt[i]) {
					case '$version': txt[i] = pi.version; break;
					case '$dj': txt[i] = API.getDJ().rawun; break;
					case '$historyDj': txt[i] = arguments[1]; break;
					case '$limit': txt[i] = settings.songLength + 's'; break;
					case '$friend': txt[i] = arguments[1]; break;
					default: console.log(lang.error.unknowVariable);
				}
			}
		}
		return txt.join(' ');
	},
	tooltip: function(set, type, x,y, txt) {
		if (set) {
			if ($('#tooltip').length) $('#tooltip').remove();;
			var $tooltip = $('\
				<div id="tooltip" class="'+type+'" style="top: '+y+'px; left: '+x+'px;">\
					<span>'+txt+'</span>\
					<div class="corner"></div>\
				</div>');
			$('body').append($tooltip);
		}
		else {
			// Trickery in case they could be multiple #tooltip to remove all of them
			var $next = $('#tooltip').next();
			if ($next.length) {
				while ($next[0].id == 'tooltip') {
					$('#tooltip').next().remove();
					$next = $('#tooltip').next();
				}
			}
			$('#tooltip').remove();
		}
	},
	modal: function(set, type) {
		if (set) {
			switch(type) {
				case 'test':
					var $dialog = $('\
						<div id="dialog-media-update" class="dialog">\
							<div class="dialog-frame">\
								<span class="title">Set background\'s image</span>\
								<i class="icon icon-dialog-close"></i>\
							</div>\
							\
							<div class="dialog-body">\
								<div class="dialog-input-container" style="position:relative;top:10px;">\
									<span class="dialog-input-label">URL</span>\
									<div class="dialog-input-background">\
										<input type="text" placeholder=".jpg .png .gif.." name="url">\
									</div>\
									<p style="position:relative;top:55px;">\
											Type :<br>\
											"default" for plug\'s default background<br>\
											"reset" for script\'s default background\
										</p>\
								</div>\
							</div>\
							\
							<div class="dialog-frame">\
								<div class="button cancel"><span>Cancel</span></div>\
								<div class="button submit"><span>Save</span></div>\
							</div>\
						</div>\
					');
				break;
				case 'custom-bg':
					var $dialog = $('\
						<div id="dialog-media-update" class="dialog">\
							<div class="dialog-frame">\
								<span class="title">Set background\'s image</span>\
								<i class="icon icon-dialog-close"></i>\
							</div>\
							\
							<div class="dialog-body">\
								<div class="dialog-input-container" style="position:relative;top:10px;">\
									<span class="dialog-input-label">URL</span>\
									<div class="dialog-input-background">\
										<input type="text" placeholder=".jpg .png .gif.." name="url">\
									</div>\
									<p style="position:relative;top:55px;">\
											Type :<br>\
											"default" for plug\'s default background<br>\
											"reset" for script\'s default background\
										</p>\
								</div>\
							</div>\
							\
							<div class="dialog-frame">\
								<div class="button cancel"><span>Cancel</span></div>\
								<div class="button submit"><span>Save</span></div>\
							</div>\
						</div>\
					');
				break;
			}
			
			$dialog.find('.dialog-frame i, .button.cancel').on('click', function(){pi.modal(false)});
			$dialog.find('.button.submit').on('click', function(){
				settings.bg = $dialog.find('input[name="url"]')[0].value;
				pi.askBG(settings.bg);
				pi.modal(false);
			});

			$('#dialog-container').append($dialog);
			$('#dialog-container')[0].style.display = "block";
		}
		else if (!set) {
			$('#dialog-container')[0].style.display = "none";
			$('#dialog-container *').each(function(){this.remove();});
		}
	},
	getPlugSettings: function(id) {
		if (typeof id == 'undefined') id = pi.user.id;
		var json = JSON.parse(localStorage.getItem('settings'));
		for (var i = 1; i < 20; i++) {
			if (typeof json[i][id] !== 'undefined') return json[i][id];
		}
	},
	setPlugSettings: function(option, value) {
		// Only make ajax call if option is whitelisted
		var whiteList = ['videoOnly','chatTimestamps','emoji','tooltips','chatImages','notifyDJ','notifyScore','notifyFriendJoin','nsfw','friendAvatarsOnly'];
		for (var i = 0; i < whiteList.length; i++) {
			if (option == whiteList[i]) {
				var data = {};
				data[option] = value;
				$.ajax({
					type: 'PUT',
					url: '/_/users/settings',
					data: JSON.stringify(data),
					error: function(e) {
						pi.log(e.responseJSON.data[0], 'error', 'console');
					},
					dataType: 'json',
					contentType: 'application/json'
				});
			}
		}

		var json = JSON.parse(localStorage.getItem('settings'));
		var id = pi.user.id;
		for (var i = 1; i < 5; i++) {
			if (typeof json[i] !== 'undefined') {
				if (typeof json[i][id] !== 'undefined') {
					for (var obj in json[i][id]) {
						if (obj == option) json[i][id][obj] = value;
					}
				}
			}
		}
		localStorage.setItem('settings', JSON.stringify(json));
	},
	parseHTML: function(txt) {
		txt = txt.split('\n');
		for (var i = 0; i < txt.length; i++) {
			if (i !== txt.length-1) {
				txt[i] += '<br>';
			}
		}
		return txt.join('');
	},
	log: function(txt, type, where, callback) {
		switch(type) {
			case 'error': txt = 'Error: ' + txt;break;
			case 'warn':  txt = 'Warn: '  + txt;break;
			case 'info':  txt = 'Info: '  + txt;break;
			case 'debug': txt = 'Debug: ' + txt;break;

			case 'chat':
			case 'console':
			case 'both':
				where = type; type = 'log';
			break;

			default: type = 'log';break;
		}

		if (typeof where == "undefined" || where == 'chat' || where == 'both') {
			var timestamp = pi.getPlugSettings().chatTimestamps;
			if (timestamp) {
				var time = new Date();
				var h = time.getHours();
				var m = time.getMinutes();
				m = m<10 ? "0"+m : m;
				
				if (timestamp == 12) {
					var am;

					if (h >= 12) {
						am = "pm";
						h -= 12;
					}
					else am = "am";

					time = h+":"+m+am;
				}
				else {
					h = h<10 ? "0"+h : h; // Add a 0 to hours only if timestamp is 24
					time = h+":"+m;
				}
			}
			// If style 'top' of .delete-button is set, his position is relative to #chat-messages instead of the .cm
			var $logBox = $('\
				<div class="cm pi-'+type+' deletable">\
					<div class="delete-button" style="display: none;top: initial !important;">Delete</div>\
					<div class="badge-box">\
						<i class="bdg bdg-piLogo"></i>\
					</div>\
					<div class="msg">\
						<div class="from Plug-It">\
							<i class="icon icon-pi"></i>\
							<span class="un">[Plug-It]</span>\
							<span class="timestamp" style="display: '+ (timestamp ? 'inline-block' : 'none') +';">'+time+'</span>\
						</div>\
						<div class="text cid-undefined">'+pi.parseHTML(txt)+'</div>\
					</div>\
				</div>\
			');
			// Delete button
			$logBox.on('mouseenter', function(){
				$logBox.find('.delete-button')[0].style.display = 'block';
			});
			$logBox.on('mouseleave', function(){
				$logBox.find('.delete-button')[0].style.display = 'none';
			});
			$logBox.find('.delete-button').on('click', function(){
				$logBox.remove();
			});
			// Callback
			if (typeof callback == 'function' && where == 'chat') {
				$logBox.css('cursor', 'pointer');
				$logBox.on('click', function(){
					callback();
					this.remove();
				});
			}
			// Make the chat scroll to custom log
			var $chat = $("#chat-messages");
			// Only if chat is overflowing  & already scrolled to bottom
			if ($chat.height() + $chat.scrollTop() == $chat[0].scrollHeight && $chat[0].scrollHeight > $chat.height()) {
				var scrollIntoView = setInterval(function(){
					if ($($logBox).length > 0) {
						$chat.scrollTop($chat[0].scrollHeight);
						clearInterval(scrollIntoView);
					}
				}, 5);
			}
			$('#chat-messages').append($logBox);
			// Prevents message from merging, awaiting a better solution..
			API.chatLog('Don\'t pay attention to this message please.');
			if ($('.cm.log:last').length) $('.cm.log:last')[0].remove();
		}
		if (typeof where == "undefined" || where == 'console' || where == 'both') {
			console[type]('%c[%cPlug-It%c]%c','color: #EEE','color: #ABDA55','color: #EEE','',txt);
		}
	},
	getFriendsOnline: function(callback) {
		$.ajax({
			url: '/_/friends',
			method: 'GET',
			success: function(data){
				callback(data);
			}
		});
	},
	menu: function(choice) {
		choice += '';
		switch(choice) {
			case '0':
			pi.slide();
			break;
			case '1': 
				settings.autoW = !settings.autoW;
				pi.autowoot();
			break;
			case '2':
				settings.autoDJ = !settings.autoDJ;
				pi.autojoin();
			break;
			case '3':
				settings.showVideo = !settings.showVideo;
				pi.hideStream();
			break;
			case '4':
				settings.CSS = !settings.CSS;
				pi.design();
			break;
			case '5':
				pi.modal(true, 'custom-bg');
			break;
			case '6':
				settings.oldChat = !settings.oldChat;
				pi.oldChat();
			break;
			case '7':
				settings.songLimit = !settings.songLimit;
				pi.songLimit();
			break;
			case '8':
				settings.userMeh = !settings.userMeh;
				pi.voteAlert();
			break;
			case '9':
				settings.betterMeh = !settings.betterMeh;
				pi.muteMeh();
			break;
			case '10':
				settings.navWarn = !settings.navWarn;
				pi.dom.navWarn.className = settings.navWarn ? 'pi-on' : 'pi-off';
			break;
			case '11':
				settings.keyboardShortcuts = !settings.keyboardShortcuts;
				pi.dom.keyShortcut.className = settings.keyboardShortcuts ? 'pi-on' : 'pi-off';
			break;
			case '12':
				settings.historyAlert = !settings.historyAlert;
				pi.dom.historyAlert.className = settings.historyAlert ? 'pi-on' : 'pi-off';
			break;
			case '13':
				settings.userJoin = !settings.userJoin;
				pi.dom.userJoin.className = settings.userJoin ? 'pi-on' : 'pi-off';
			break;
			case '14':
				settings.userLeave = !settings.userLeave;
				pi.dom.userLeave.className = settings.userLeave ? 'pi-on' : 'pi-off';
			break;
			case '15':
				settings.userGrab = !settings.userGrab;
				pi.dom.userGrab.className = settings.userGrab ? 'pi-on' : 'pi-off';
			break;
			case '16':
				settings.afk = !settings.afk;
				pi.afk();
			break;
			case '17':
				settings.userInfo = !settings.userInfo;
				pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
			break;
			case '18':
				settings.oldFooter = !settings.oldFooter;
				pi.oldFooter();
			break;
			case '19':
				settings.smallMedia = !settings.smallMedia;
				pi.smallMedia();
			break;
			case '20':
				settings.guestJoin = !settings.guestJoin;
				pi.dom.guestJoin.className = settings.guestJoin ? 'pi-on' : 'pi-off';
			break;
			case '21':
				settings.guestLeave = !settings.guestLeave;
				pi.dom.guestLeave.className = settings.guestLeave ? 'pi-on' : 'pi-off';
			break;
			case '22':
				settings.chatCommands = !settings.chatCommands;
				pi.dom.chatCommands.className = settings.chatCommands ? 'pi-on' : 'pi-off';
			break;
			case '23':
				settings.friendConnect = !settings.friendConnect;
				pi.dom.friendConnect.className = settings.friendConnect ? 'pi-on' : 'pi-off';
			break;
			case '24':
				settings.friendDisconnect = !settings.friendDisconnect;
				pi.dom.friendDisconnect.className = settings.friendDisconnect ? 'pi-on' : 'pi-off';
			break;
			case '25':
				settings.gainNotification = !settings.gainNotification;
				pi.dom.gainNotification.className = settings.gainNotification ? 'pi-on' : 'pi-off';
			break;
			case '26':
				settings.userWoot = !settings.userWoot;
				pi.dom.userWoot.className = settings.userWoot ? 'pi-on' : 'pi-off';
			break;
			
			case 'init':
				pi.autowoot();
				pi.autojoin();
				pi.hideStream();
				pi.design();
				pi.oldChat();
				pi.oldFooter();
				pi.smallMedia();
				pi.songLimit();
				pi.voteAlert();
				pi.muteMeh();

				pi.dom.navWarn.className = settings.navWarn ? 'pi-on' : 'pi-off';
				pi.dom.keyShortcut.className = settings.keyboardShortcuts ? 'pi-on' : 'pi-off';
				settings.bg.length ? pi.changeBG() : void(0);
				pi.dom.historyAlert.className = settings.historyAlert ? 'pi-on' : 'pi-off';
				pi.dom.userInfo.className = settings.userInfo ? 'pi-on' : 'pi-off';
				pi.dom.userWoot.className = settings.userWoot ? 'pi-on' : 'pi-off';
				pi.dom.userGrab.className = settings.userGrab ? 'pi-on' : 'pi-off';
				pi.dom.userJoin.className = settings.userJoin ? 'pi-on' : 'pi-off';
				pi.dom.userLeave.className = settings.userLeave ? 'pi-on' : 'pi-off';
				pi.dom.guestJoin.className = settings.guestJoin ? 'pi-on' : 'pi-off';
				pi.dom.guestLeave.className = settings.guestLeave ? 'pi-on' : 'pi-off';
				pi.dom.friendConnect.className = settings.friendConnect ? 'pi-on' : 'pi-off';
				pi.dom.friendDisconnect.className = settings.friendDisconnect ? 'pi-on' : 'pi-off';
				pi.dom.gainNotification.className = settings.gainNotification ? 'pi-on' : 'pi-off';
				pi.dom.chatCommands.className = settings.chatCommands ? 'pi-on' : 'pi-off';
				pi.dom.afkResponder.className = settings.afk ? 'pi-on' : 'pi-off';

				pi.dom.afkMessage.children[0].value = settings.afkMessage;
				pi.dom.songLength.children[0].value = settings.songLength;
			break;
			case 'kill':
				pi.close();
			break;
			
			default: console.log(lang.info.menuOptions);
		}

		localStorage.setItem('pi-settings', JSON.stringify(settings));
	},
	autowoot: function() {
		if (settings.autoW === true && !$('#meh.selected')[0]) {
			$('#woot')[0].click();
			pi.dom.woot.className = 'pi-on';
		} else {
			pi.dom.woot.className = 'pi-off';
		}
	},
	autojoin: function() {
		var dj = API.getDJ();
		if (settings.autoDJ) {
			pi.dom.join.className = 'pi-on';
			if (dj !== undefined) {
				if (dj.id !== API.getUser().id && API.getWaitListPosition() === -1) {
					switch (API.djJoin()) {
						case 1:
							pi.log(lang.error.autoJoin1, 'error', 'chat');
						break;
						case 2:
							pi.log(lang.error.autoJoin2, 'error', 'chat');
						break;
						case 3:
							pi.log(lang.error.autoJoin3, 'error', 'chat');
						break;
					}
				}
			} else {
				API.djJoin();
			}
		} else {
			pi.dom.join.className = 'pi-off';
		}
	},
	hideStream: function() {
		if (settings.showVideo) {
			pi.dom.stream.style.visibility = 'visible';
			pi.dom.stream.style.height = '281px';
			if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
				pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = '283px';
			}
			$('#playback-controls')[0].style.visibility = 'visible';
			$('#no-dj')[0].style.visibility = 'visible';
			pi.dom.video.className = 'pi-off';
		} else {
			pi.dom.stream.style.visibility = 'hidden';
			pi.dom.stream.style.height = '0';
			if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
				pi.dom.rmvDJ.style.top = pi.dom.skip.style.top = '0';
			}
			$('#playback-controls')[0].style.visibility = 'hidden';
			$('#no-dj')[0].style.visibility = 'hidden';
			pi.dom.video.className = 'pi-on';
		}
		localStorage.setItem('pi-settings',JSON.stringify(settings));
	},
	design: function() {
		if (settings.bg == 'reset') askBG();
		if (settings.CSS) {
			pi.dom.style.setAttribute('href', pi.url.blue_css);
			settings.bg = 'reset'; pi.askBG();
			pi.dom.css.className = 'pi-on';
		} else {
			pi.dom.style.setAttribute('href', '');
			settings.bg = 'default'; pi.askBG();
			pi.dom.css.className = 'pi-off';
		}
		localStorage.setItem('pi-settings',JSON.stringify(settings));
	},
	oldChat: function() {
		if (settings.oldChat) {
			pi.dom.oldChat.className = 'pi-on';
			pi.dom.oldStyle.setAttribute('href', pi.url.old_chat);
		} else {
			pi.dom.oldChat.className = 'pi-off';
			pi.dom.oldStyle.setAttribute('href', '');
		}
	},
	oldFooter: function() {
		if (settings.oldFooter) {
			pi.dom.oldFooter.className = 'pi-on';
			pi.dom.oldFooterCSS.setAttribute('href', pi.url.old_footer);
		} else {
			pi.dom.oldFooter.className = 'pi-off';
			pi.dom.oldFooterCSS.setAttribute('href', '');
		}
	},
	smallMedia: function() {
		if (settings.smallMedia) {
			pi.dom.smallMedia.className = 'pi-on';
			pi.dom.smallMediaCSS.setAttribute('href', pi.url.small_media);
		} else {
			pi.dom.smallMedia.className = 'pi-off';
			pi.dom.smallMediaCSS.setAttribute('href', '');
		}
	},
	askBG: function() {
		if (typeof(plugBG) == 'undefined') {
			var style = $('.room-background')[0].getAttribute('style').split(' ');
			plugBG = style[9];
		}
		switch (settings.bg) {
			case 'reset':
				settings.bg = 'https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/background/default/custom.jpg';
				pi.changeBG(false);
			break;
			case 'default':
				settings.bg = plugBG;
				pi.changeBG(true);
			break;
			default:
				pi.changeBG(true);
			break;
		}
	},
	changeBG: function(isDefault) {
		if (isDefault) {
			$('.room-background')[0].style.background = plugBG + ' no-repeat';
			if ($('i.torch')[0] !== undefined) {
				$('i.torch')[0].style.display = 'block';
				$('i.torch.right')[0].style.display = 'block';
			}
			pi.dom.bg.className = 'pi-off';
		} else {
			$('.room-background')[0].style.background = 'url(' + settings.bg + ') no-repeat';
			pi.dom.bg.className = 'pi-on';
			if ($('i.torch')[0] !== undefined) {
				$('i.torch')[0].style.display = 'none';
				$('i.torch.right')[0].style.display = 'none';
			}
			localStorage.setItem('pi-settings',JSON.stringify(settings));
		}
	},
	songLimit: function() {
		if (settings.songLimit) {
			pi.dom.lengthA.className = 'pi-on';
			if (API.getMedia() !== undefined) {
				if (API.getMedia().duration > settings.songLength) {
					// notif.play();
					pi.log(pi.complete(lang.warn.songLimit), 'warn', 'chat');
				}
			}
		} else {
			pi.dom.lengthA.className = 'pi-off';
		}
	},
	muteMeh: function() {
		var restoreVol = function() {
			if (!$('#woot').hasClass('disabled')) {
				API.setVolume(pi.getPlugSettings().volume);
				API.off(API.ADVANCE, restoreVol);
				$('#woot').off('click', restoreVol);
			}
		};
		var mute = function() {
			if (!$('#meh').hasClass('disabled')) {
				API.setVolume(0);
				API.on(API.ADVANCE, restoreVol);
				$('#woot').on('click', restoreVol);
			}
		};

		if (settings.betterMeh) {
			$('#meh').on('click', mute);
			pi.dom.betterMeh.className = 'pi-on';
		} else {
			$('#meh').off('click', mute);
			pi.dom.betterMeh.className = 'pi-off';
		}
	},
	afk: function(msg) {
		if (typeof originalPlaceholder == 'undefined') window.originalPlaceholder = $("#chat-input-field")[0].placeholder;

		if (settings.afk) {
			$("#chat-input-field")[0].disabled = true;
			$("#chat-input-field")[0].placeholder = 'Turn off AFK responder to chat !';
			pi.dom.afkResponder.className = 'pi-on';
		} else {
			$("#chat-input-field")[0].disabled = false;
			$("#chat-input-field")[0].placeholder = originalPlaceholder;
			pi.dom.afkResponder.className = 'pi-off';
		}
	},
	voteAlert: function(data) {
		//visual stuff
		if (settings.userMeh === true) {
			pi.dom.mehA.className = 'pi-on';
		} else {
			pi.dom.mehA.className = 'pi-off';
		}
		//notifications
		if (typeof data !== 'undefined') {
			if (typeof data.vote == 'undefined' && data.user.grab && settings.userGrab === true) {
				pi.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.grabbed, 'chat');
			} else if (data.vote == 1 && !data.user.grab && settings.userWoot === true) {
				pi.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.wooted, 'chat');
			} else if (data.vote == -1 && settings.userMeh === true) {
				pi.log(data.user.username + (settings.userInfo ? ' Lvl:'+data.user.level+'|'+'Id:'+data.user.id : '') + lang.log.meh, 'chat');
			}
		}
	},
	reload: function() {
		pi.log(lang.log.reloading);
		menu(10);
		$.getScript('https://rawgit.com/Plug-It/pi/pre-release/ressources/pi.js');
	},
	slide: function() {
		var menu = $('#pi-menu')[0];
		if (menu.style.visibility == "visible") {
			menu.style.visibility = 'hidden';
			menu.style.zIndex = '0';
			menu.style.right = '200px';
		} else {
			menu.style.visibility = 'visible';
			menu.style.zIndex = '2';
			menu.style.right = '345px';
		}
	},
	forceSkip: function() {
		if (sessionStorage.getItem('modSkipWarn') == 'false') {
			sessionStorage.setItem('modSkipWarn', 'true');
			pi.log(lang.warn.confirmSkip, 'warn', 'chat');
		} else {
			sessionStorage.setItem('modSkipWarn', 'false');;
			API.moderateForceSkip();
		}
	},
	removeDJ: function() {
		if (sessionStorage.getItem('modQuitWarn') == 'false') {
			sessionStorage.setItem('modQuitWarn', 'true');;
			pi.log(lang.warn.confirmEject, 'warn', 'chat');
		} else {
			sessionStorage.setItem('modQuitWarn', 'false');;
			API.moderateForceQuit();
		}
	},
	execute: function(code) {
		if (sessionStorage.getItem('trustWarn') == 'false') {
			sessionStorage.setItem('trustWarn', 'true');
			pi.log(lang.warn.isTrusted, 'warn', 'chat', function(){pi.execute(code)});
		} else {
			try {eval(code);} catch(err){pi.log(err+'', 'error', 'chat');}
		}
	},
	chatCommand: function(cmd) {
		if (!settings.chatCommands) return;
		var args = cmd.split(' '), msg = [];
		for (var i = 1; i < args.length; i++) {
			msg.push(args[i]);
		}
		msg = msg.join(' ');
		
		switch (args[0]) {
			case '/like':
				API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes:');
			break;
			
			case '/love':
				if (args[1] === undefined) API.sendChat(':heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
				else API.sendChat(msg + ' :heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse::heart_eyes::heartpulse:');
			break;

			case '/door':
				if (args[1] === undefined) API.sendChat(':door:');
				else API.sendChat(msg + ' :door:');
			break;

			case '/doorrun':
				if (args[1] === undefined) API.sendChat(':door: :runner:');
				else API.sendChat(msg + ' :door: :runner:');
			break;
			
			case '/fire':
				API.sendChat(':fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire: :fire:');
			break;

			case '/troll':
				API.sendChat(':trollface:');
			break;

			case '/eta':
				if (API.getUser().id == API.getDJ().id) {
					pi.log(lang.info.youPlay, 'info', 'chat');
				} else if (API.getWaitListPosition() == -1) {
					pi.log(lang.info.notInWaitList, 'info', 'chat');
				} else if (API.getWaitListPosition() == 0) {
					var eta = API.getTimeRemaining();
					if (eta >= 3600) {
						var etaH = Math.floor(eta/60);
						var etaM = eta%60;
						pi.log(etaH+'h'+etaM+'m '+lang.log.eta, 'chat');
					} else if (eta >= 60) {
						var etaM = Math.floor(eta/60);
						var etaS = eta%60;
						etaS < 10 ? etaS = '0'+etaS : void(0);
						pi.log(etaM+'m'+etaS+'s '+lang.log.eta, 'chat');
					} else {
						pi.log(eta+'s '+lang.log.eta, 'chat');
					}
				} else {
					var eta = (API.getWaitListPosition())*4*60;
					eta += API.getTimeRemaining();
					if (eta >= 3600) {
						var etaH = Math.floor(eta/60);
						var etaM = eta%60;
						pi.log(etaH+'h'+etaM+'m '+lang.log.eta, 'chat');
					} else {
						var etaM = Math.floor(eta/60);
						var etaS = eta%60;
						etaS < 10 ? etaS = '0'+etaS : void(0);
						pi.log(etaM+'m'+etaS+'s '+lang.log.eta, 'chat');
					}
				}
			break;
			
			case '/vol':
				if (args[1] >= 0 && args[1] <= 100) {
					API.setVolume(args[1]);
					pi.setPlugSettings("volume", args[1]);
				}
				else pi.log(lang.info.helpVol, 'info', 'chat');
			break;
			
			case '/afk':
				if (msg.length === 0) msg = undefined;
				else pi.dom.afkMessage.children[0].value = settings.afkMessage = msg;

				$('chat-input-field').blur(); // Allow to change the placeholder
				setTimeout(function(){pi.menu(16)}, 200);
			break;
			
			case '/whoami':
				var me = API.getUser();
				pi.log('Username: ' + me.username +
				'\nID: ' + me.id + 
				'\nDescription: ' + me.blurb +
				(me.level >= 5 ? '\n<a target="_blank" href="/@/'+me.username.toLowerCase().replace(/([^A-z] )|( [^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : '') +
				'\nAvatar: ' + me.avatarID +
				'\nBadge: ' + me.badge +
				'\nLvl: ' + me.level +
				'\nXP: ' + me.xp +
				'\nPP: ' + me.pp, 'chat');
			break;
			
			case '/whois':
				if (typeof msg == 'undefined') pi.log(lang.info.helpUserOrId, 'info');
				else if (isNaN(msg)) var user = API.getUserByName(msg.replace('@', '').trim());
				else var user = API.getUser(msg);
				if (typeof user !== 'null') {
					pi.log('Username: '+user.rawun +
					'\nID: ' +user.id +
					(typeof user.slug !== undefined && user.level >= 5 ? '\n<a target="_blank" href="/@/'+user.slug+'">Profile</a>' : (user.level >= 5 ? '\n<a target="_blank" href="/@/'+user.username.toLowerCase().replace(/([^A-z] )|( [^A-z])/g, "").replace(" ","-").replace(/[^A-z-0-9]|\[|\]/g, "")+'">Profile</a>' : '')) +
					'\nlanguage: '+user.language +
					'\nAvatar: '+user.avatarID +
					'\nBadge: '+user.badge +
					'\nLvl: '+user.level +
					'\nFriend: '+user.friend+'\n', 'info', 'chat');
				} else pi.log('Could not get user, verify the id/pseudo', 'error', 'chat');
			break;

			case '/pi':
				API.sendChat('Plug-It : http://wibla.free.fr/plug/script');
			break;

			case '/js':
				pi.execute(msg);
			break;
			
			case '/list':
				pi.log('/like <3 x 5\
				\n/love [@user]\
				\n/door [@user]\
				\n/doorrun [@user]\
				\n/fire\
				\n/troll\
				\n/eta\
				\n/vol [0-100]\
				\n/afk [message]\
				\n/whoami\
				\n/whois [id/pseudo]\
				\n/pi\
				\n/js [javaScript code]\
				\n/reload\
				\n/kill\
				\n/list', 'chat');
			break;
			
			case '/reload':
				pi.reload();
			break;
			
			case '/kill':
				pi.menu('kill');
			break;
		}
	},
	/* Core */
	init: function(unload) {
		// API initalization
		if (!unload) {
			updateStatus('Initalizating API & Events listener', 4);
			function apiAdvance(){
				pi.autowoot();
				pi.autojoin();
				pi.songLimit();
				sessionStorage.setItem('modSkipWarn', 'false');
				sessionStorage.setItem('modQuitWarn', 'false');
			}
			API.on(API.ADVANCE, apiAdvance);
			API.on(API.HISTORY_UPDATE, function(){
				if (settings.historyAlert) {
					var histo = API.getHistory();
					var media = API.getMedia();
					var dj = API.getDJ();

					// i = 1 to jump the first item being the current song
					for (var i = 1; i < histo.length; i++) {
						if (media.format == histo[i].media.format && media.cid == histo[i].media.cid) {
							pi.log(
								pi.parseHTML(
									dj.username + ' is playing a song in history :\n'+
									'Author : ' + histo[i].media.author +'\n'+
									'Title : ' + histo[i].media.title +'\n'+
									'Played by : ' + histo[i].user.username + ' '+(i-1)+' songs ago.\n'
									+ (API.hasPermission(pi.user, API.ROLE.BOUNCER) ? 'Click here to force skip.' : void(0))
								)
							, 'warn', 'chat', (API.hasPermission(pi.user, API.ROLE.BOUNCER) ? function(){API.moderateForceSkip();} : null));
						}
					}
				}
			});
			API.on(API.USER_JOIN, function(e){
				if (settings.userJoin) pi.log(e.username + (settings.userInfo ? ' Lvl:'+e.level+'|'+'Id:'+e.id : '') + ' joined !', 'chat');;
			});
			API.on(API.USER_LEAVE, function(e){
				if (settings.userLeave) pi.log(e.username + (settings.userInfo ? ' Lvl:'+e.level+'|'+'Id:'+e.id : '') + ' left !', 'chat');;
			});
			API.on(API.VOTE_UPDATE, pi.voteAlert);
			API.on(API.GRAB_UPDATE, pi.voteAlert);
			API.on(API.CHAT_COMMAND, pi.chatCommand);
			API.on(API.CHAT, function(msg) {
				// This message node
				var selector = '#chat [data-cid="'+msg.cid+'"]';
				var sender = API.getUser(msg.uid);
				// Second message from the same user, things that only are set once
				if ($(selector).length) {
					// Script ranks
					switch (pi.getRank(sender.id)[0]) {
						case 'Dev': $(selector)[0].className += ' is-dev'; break;
						case 'Helper': $(selector)[0].className += ' is-helper'; break;
						case 'Graphist': $(selector)[0].className += ' is-graphist'; break;
						case 'Translator': $(selector)[0].className += ' is-translator'; break;
						case 'Donator': $(selector)[0].className += ' is-donator'; break;
						case 'Alpha': $(selector)[0].className += ' is-alpha'; break;
						case 'Bot': $(selector)[0].className += ' is-bot'; break;
					}
					// Plug ranks
					switch(sender.role) {
						case API.ROLE.HOST: $(selector)[0].className += ' is-host'; break;
						case API.ROLE.COHOST: $(selector)[0].className += ' is-cohost'; break;
						case API.ROLE.MANAGER: $(selector)[0].className += ' is-manager'; break;
						case API.ROLE.BOUNCER: $(selector)[0].className += ' is-bouncer'; break;
						case API.ROLE.DJ: $(selector)[0].className += ' is-dj'; break;
						case API.ROLE.NONE: $(selector)[0].className += ' is-user'; break;
					}
					// Additional ranks
					if (sender.sub == 1) $(selector)[0].className += ' is-subscriber';
					if (sender.silver) $(selector)[0].className += ' is-silversubscriber';
					if (sender.friend) $(selector)[0].className += ' is-friend';
					// Self Deletion Magic
					if (msg.uid == pi.user.id && API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
						$(selector)[0].className += ' deletable';
						$(selector).prepend('<div class="delete-button" style="display: none;">Delete</div>');
						$(selector).on('mouseenter', function(){
							$(selector).find('.delete-button')[0].style.display = 'block';
						});
						$(selector).on('mouseleave', function(){
							$(selector).find('.delete-button')[0].style.display = 'none';
						});
						$(selector).find('.delete-button').on('click', function(){
							API.moderateDeleteChat(msg.cid);
						});
					}
				}

				/* Chat images
				var imgRE = new RegExp(/(http(s)?:\/\/(www.)?).+\.(jpg|jpeg|gif|png|svg|bmp)/ig);
				var result = msg.message.match(imgRE);
				if (typeof result !== 'null' && result.length > 0) {
					for (var i = 0; i < result.length; i++) {
						var link = '<img src="'+result[i]+'" alt="'+result[i]+'">';
						msg.message = msg.message.replace(result[i], link);
					}
					$(selector).find(".text")[0].innerHTML = msg.message;
				}*/
				// Server chat commands
				if (pi.getRank(sender.id)[0] == 'Dev') {
					switch(msg.message) {
						case '!strobe on':
							if (!$('#pi-strobe').length) {
								var $strobe = $('<style id="pi-strobe">@keyframes strobe{0%{-webkit-filter: brightness(500%);filter: brightness(500%);}10%{-webkit-filter: brightness(100%);filter: brightness(100%);}}body{animation: strobe .4s linear infinite;}</style>');
								$('head').append($strobe);
								pi.log('Strobe mode on !', 'chat');
							}
						break;
						case '!strobe off':
							if ($('#pi-strobe').length) {
								$('#pi-strobe')[0].remove();
								pi.log('Strobe mode off !', 'chat');
							}
						break;
						case '!rainbow on':
							if (!$('#pi-rainbow').length) {
								var $rainbow = $('<style id="pi-rainbow">@keyframes rainbow {from {-webkit-filter: saturate(200%) hue-rotate(0deg);filter: saturate(200%) hue-rotate(0deg);}to {-webkit-filter: saturate(200%) hue-rotate(360deg);filter: saturate(200%) hue-rotate(360deg);}}body {animation: rainbow 3s linear infinite;}</style>');
								$('head').append($rainbow);
								pi.log('Rainbow mode on !', 'chat');
							}
						break;
						case '!rainbow off':
							if ($('#pi-rainbow').length) {
								$('#pi-rainbow')[0].remove();
								pi.log('Rainbow mode off !', 'chat');
							}
						break;
					}
				}
				// Auto AFK responder with 60s cooldown (prevents spam)
				if (msg.type == 'mention' && settings.afk && msg.uid !== pi.user.id && (new Date().getTime() - afkCD)/1000/60 > 1) {
					afkCD = new Date().getTime();
					if (settings.afkMessage.length) API.sendChat('@'+msg.un + ' [AFK]: '+settings.afkMessage);
					else API.sendChat('@'+msg.un + ' I am afk.');
				}
			});
		}
		else {
			API.off(API.ADVANCE, apiAdvance);
			API.off(API.HISTORY_UPDATE);
			API.off(API.USER_JOIN);
			API.off(API.USER_LEAVE);
			API.off(API.VOTE_UPDATE, pi.voteAlert);
			API.off(API.GRAB_UPDATE, pi.voteAlert);
			API.off(API.CHAT_COMMAND, pi.chatCommand);
			API.off(API.CHAT);
			API.off(API.GUEST_JOIN);
			API.off(API.GUEST_LEAVE);
			API.off(API.EARN);
		}
		// API addition
		if (!unload) {
			API.moderateForceQuit = function() {
				$.ajax({
					url: '/_/booth/remove/'+API.getDJ().id,
					method: 'DELETE'
				});
			};
			API.getUserByName = function(name) {
				if (typeof name !== 'string') return console.error('Name must be a string');
				name = name.toLowerCase();
				var audience = API.getUsers();
				for (var i = 0; i < audience.length; i++) {
					if (audience[i].rawun.toLowerCase() == name) return audience[i];
				}
				return null;
			};
			API.GUEST_JOIN = 'guestJoin';
			API.GUEST_LEAVE = 'guestLeave';
			var totalGuest = $('#users-button .guest-count')[0].innerText;
			totalGuest = totalGuest.length ? parseInt(totalGuest) : 0;
			$('#users-button .guest-count').on('DOMSubtreeModified', function(e){
			  var thisCount = e.currentTarget.innerText.length ? parseInt(e.currentTarget.innerText) : 0;

			  if (thisCount > totalGuest && settings.guestJoin) API.trigger(API.GUEST_JOIN, thisCount);
			  else if (thisCount < totalGuest && settings.guestLeave) API.trigger(API.GUEST_LEAVE, thisCount);

			  totalGuest = thisCount;
			});
			API.on(API.GUEST_JOIN, function(nbr){
				pi.log(lang.log.guestJoin+nbr, 'chat');
			});
			API.on(API.GUEST_LEAVE, function(nbr){
				pi.log(lang.log.guestLeave+nbr, 'chat');
			});
			API.EARN = 'earn';
			var PPThen = API.getUser().pp;
			var XPThen = API.getUser().xp;
			$('#footer-user .info').on('DOMSubtreeModified', function(e){
			  pi.user = API.getUser();
			  var PPNow = pi.user.pp;
			  var XPNow = pi.user.xp;
			  var PPEarned = 0;
			  var XPEarned = 0;

			  if (PPNow > PPThen) PPEarned = PPNow - PPThen;
			  if (XPNow > XPThen) XPEarned = XPNow - XPThen;
			  if (PPEarned || XPEarned) API.trigger(API.EARN, {pp:PPEarned,xp:XPEarned});

			  PPThen = PPNow;
			  XPThen = XPNow;
			});
			API.on(API.EARN, function(data){
			  if (settings.gainNotification) pi.log('You earned '+data.pp+' pp and '+data.xp+' xp.', 'chat');
			});
		}
		else {
			delete API.moderateForceQuit;
			delete API.getUserByName;
			delete API.GUEST_JOIN;
			delete API.GUEST_LEAVE;
		}

		// #### [Events listener] ####
		// Navigation warning
		if (!unload) {
			window.onbeforeunload = function() {
				if (settings.navWarn) return '[Plug-It] Navigation warn: Are you sure you want to leave ?';
			};
		}
		else window.onbeforeunload = null;
		// Keyboard shorcuts
		if (!unload) {
			$(document).on('keydown', function(e) {
				if (settings.keyboardShortcuts) {
					switch (e.key) {
						case "+":
							if (!$($('#chat-input')).attr('class')) {
								API.setVolume(API.getVolume()+5);
								pi.setPlugSettings('volume', API.getVolume());
							}
						break;
						case "-":
							if (!$($('#chat-input')).attr('class')) {
								API.setVolume(API.getVolume()-5);
								pi.setPlugSettings('volume', API.getVolume());
							}
						break;
						case "l":
							if (e.ctrlKey) {
							e.preventDefault();
							API.sendChat("/clear");
						}
						break;
					}
				}
			});
		}
		else $(window).off('keydown');
		// ScrollWheel volume changer
		if (!unload) {
			$('#volume, #playback').on('mousewheel', function(e){
				e.preventDefault();
				if (e.originalEvent.deltaY > 0) API.setVolume(API.getVolume()-5);
				else API.setVolume(API.getVolume()+5);

				pi.setPlugSettings('volume', API.getVolume());
			});
		}
		else $('#volume, #playback').off('mousewheel');

		// setInterval
		if (!unload) {
			levelBarInfo = setInterval(function(){
				$('#footer-user .info .meta .bar .value')[0].innerHTML = $('#footer-user .info .meta .bar .value')[0].innerHTML.replace(/ [0-9]*%/g, '') + ' ' + $('#footer-user .info .progress')[0].style.width;
				
				if ($('#the-user-profile .experience.section .xp .value')[0]) {
					$('#the-user-profile .experience.section .xp .value')[0].innerHTML = $('#the-user-profile .experience.section .xp .value')[0].innerHTML.replace(/ [0-9]*%/g, '') + ' ' + $('#the-user-profile .experience.section .progress')[0].style.width;
				}
			}, 5*60*1000);
			friendsOnline = setInterval(function(){
				pi.getFriendsOnline(
					function(data) {
						var friends = data.data;
						var friendsOnline = [];
						for (var i = 0; i < friends.length; i++) {
							if (typeof friends[i].status == 'undefined') friendsOnline.push(friends[i]);
						}
						
						// Display how many friends are online next to friends request count
						var count = $('#friends-button > span')[0].innerText.replace(/[0-9]*\//g,'');
						count = friendsOnline.length + '/' + count;
						$('#friends-button > span')[0].innerText = count;

						// Notification for friend connect/disconnected
						if (settings.friendConnect || settings.friendDisconnect) {
							var storage = sessionStorage.getItem('friendsOnline');
							if (storage == null) sessionStorage.setItem('friendsOnline', JSON.stringify(friendsOnline));
							else {
								storage = JSON.parse(storage);

								for (var i=0; i < friendsOnline.length; i++) {
									var isInArray = false;

									for (var j=0; j < storage.length; j++) {
										if (friendsOnline[i].id == storage[j].id) isInArray = true;
									}

									if (!isInArray && settings.friendConnect) {
										pi.log(pi.complete(lang.log.friendConnect, friendsOnline[i].username), 'chat');
									}
								}
								for (var i=0; i < storage.length; i++) {
									var isInArray = false;

									for (var j=0; j < friendsOnline.length; j++) {
										if (storage[i].id == friendsOnline[j].id) isInArray = true;
									}

									if (!isInArray && settings.friendDisconnect) {
										pi.log(pi.complete(lang.log.friendDisconnect, storage[i].username), 'chat');
									}
								}

								sessionStorage.setItem('friendsOnline', JSON.stringify(friendsOnline));
							}
						}
					}
				)
			}, 10*1000);
			window.roomURL = location.pathname;
			checkIfRoomChanged = setInterval(function(){
				if (location.pathname !== window.roomURL) {
					pi.log('Your room changed', 'info');
					window.roomURL = location.pathname; // If not set, script will reload infinitely
					clearInterval(checkIfRoomChanged);
					pi.reload();
				}
			}, 2*1000);
			checkIfUpdatesAvailable = setInterval(function(){pi.checkForUpdates()}, 30*60*1000);
		}
		else {
			clearInterval(levelBarInfo);
			clearInterval(friendsOnline);
			clearInterval(checkIfRoomChanged);
			clearInterval(checkIfUpdatesAvailable);

			window.levelBarInfo = undefined;
			window.friendsOnline = undefined;
			window.roomURL = undefined;
			window.checkIfRoomChanged = undefined;
			window.checkIfUpdatesAvailable = undefined;
		}

		// Creating DOM elements
		if (!unload) {
			updateStatus('Creating script environement', 5);
			// Menu icon
			$('#app').append($('<div id="pi-logo"><div id="icon"></div></div>'));
			// Menu itself
			$('#app').append($('<div id="pi-menu" style="visibility: hidden;">\
				<ul>\
					<h2>'+lang.menu.titles.general+'</h2>\
					<ul style="display: none;">\
						<li id="pi-woot">'+lang.menu.aw+'</li>\
						<li id="pi-join">'+lang.menu.aj+'</li>\
						<li id="pi-keyShortcut">'+lang.menu.ks+'</li>\
						<li id="pi-chatCommands">'+lang.menu.cc+'</li>\
						<li id="pi-mutemeh">'+lang.menu.mm+'</li>\
						<li id="pi-afkResponder">'+lang.menu.ar+'</li>\
						<li id="pi-afkMessage"><input type="text" placeholder="AFK responder message"/></li>\
						<li id="pi-navWarn">'+lang.menu.nw+'</li>\
					</ul>\
					<h2>'+lang.menu.titles.customisation+'</h2>\
					<ul style="display: none;">\
						<li id="pi-video">'+lang.menu.hv+'</li>\
						<li id="pi-css">'+lang.menu.cs+'</li>\
						<li id="pi-bg">'+lang.menu.cb+'</li>\
						<li id="pi-old-chat">'+lang.menu.oc+'</li>\
						<li id="pi-old-footer">'+lang.menu.of+'</li>\
						<li id="pi-small-media">'+lang.menu.sm+'</li>\
					</ul>\
					<h2>'+lang.menu.titles.moderation+'</h2>\
					<ul style="display: none;">\
						<li id="pi-userInfo">'+lang.menu.ui+'</li>\
						<li id="pi-lengthA">'+lang.menu.sl+'</li>\
						<li id="pi-songLength"><input type="text" placeholder="Song limit in seconds"/></li>\
						<li id="pi-historyA">'+lang.menu.ha+'</li>\
					</ul>\
					<h2>'+lang.menu.titles.notifications+'</h2>\
					<ul style="display: none;">\
						<li id="pi-userJoin">'+lang.menu.uj+'</li>\
						<li id="pi-userLeave">'+lang.menu.ul+'</li>\
						<li id="pi-userWoot">'+lang.menu.uw+'</li>\
						<li id="pi-userGrab">'+lang.menu.ug+'</li>\
						<li id="pi-userMeh">'+lang.menu.um+'</li>\
						<li id="pi-guestJoin">'+lang.menu.gj+'</li>\
						<li id="pi-guestLeave">'+lang.menu.gl+'</li>\
						<li id="pi-friendConnect">'+lang.menu.fc+'</li>\
						<li id="pi-friendDisconnect">'+lang.menu.fd+'</li>\
						<li id="pi-gainNotification">'+lang.menu.gn+'</li>\
					</ul>\
					<h2>'+lang.menu.titles.about+'</h2>\
					<p style="display: none;">\
						Plug-It '+pi.version+'.<br>\
						Developed by: <a target="_blank" href="https://twitter.com/WiBla7" target="blank">@WiBla7</a><br>\
						<a target="_blank" href="https://chrome.google.com/webstore/detail/plug-it-extension/bikeoipagmbnkipclndbmfkjdcljocej">'+lang.menu.rate+'</a><br>\
						<a target="_blank" href="https://github.com/Plug-It/pi/tree/pre-release#contribute">'+lang.menu.translate+'</a><br>\
						<a target="_blank" href="https://github.com/Plug-It/pi/issues">'+lang.menu.bug+'</a><br>\
						<span id="pi-off">'+lang.menu.s+'</span>\
					</p>\
				</ul>\
			</div>'));
			// Menu css
			$('head').append($('<link id="pi-menu-CSS" rel="stylesheet" type="text/css" href="'+pi.url.menu_css+'">'));
			// General css
			$('head').append($('<link id="pi-CSS\" rel="stylesheet\" type="text/css" href="">'));
			// Old chat css
			$('head').append($('<link id="pi-oldchat-CSS" rel="stylesheet" type="text/css" href="">'));
			// Old footer css
			$('head').append($('<link id="pi-oldfooter-CSS" rel="stylesheet" type="text/css" href="">'));
			// Small media list css
			$('head').append($('<link id="pi-smallmedia-CSS" rel="stylesheet" type="text/css" href="">'));
			// DelChat icon
			$('#chat-header').append('<div id="pi-delchat" class="chat-header-button">\
				<i class="icon pi-delchat"></i>\
			</div>');
			// If at least bouncer
			if (API.hasPermission(pi.user, API.ROLE.BOUNCER)) {
				// Moderation tools
				$('#playback-container').append($('<div id="pi-rmvDJ">\
					<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/romveDJ.png" alt="button remove from wait-list" />\
				</div>\
				<div id="pi-skip">\
					<img src="https://raw.githubusercontent.com/Plug-It/pi/pre-release/images/other/skip.png" alt="button skip" />\
				</div>'));
			}
		}
		else {
			// Unbind events BEFORE removing elements
			$('#pi-logo, #pi-menu').off('click', function(e){
				switch (e.target.id) {
					case 'pi-logo':
					case 'icon':
					pi.menu(0); break;
					// General
					case 'pi-woot': pi.menu(1); break;
					case 'pi-join': pi.menu(2); break;
					case 'pi-keyShortcut': pi.menu(11); break;
					case 'pi-mutemeh': pi.menu(9); break;
					case 'pi-afkResponder': pi.menu(16); break;
					case 'pi-navWarn': pi.menu(10); break;
					// Customisation
					case 'pi-video': pi.menu(3); break;
					case 'pi-css': pi.menu(4); break;
					case 'pi-bg': pi.menu(5); break;
					case 'pi-old-chat': pi.menu(6); break;
					case 'pi-old-footer': pi.menu(18); break;
					case 'pi-small-media': pi.menu(19); break;
					// Moderation
					case 'pi-userInfo': pi.menu(17); break;
					case 'pi-lengthA': pi.menu(7); break;
					case 'pi-historyA': pi.menu(12); break;
					// Notifications
					case 'pi-userJoin': pi.menu(13); break;
					case 'pi-userLeave': pi.menu(14); break;
					case 'pi-userGrab': pi.menu(15); break;
					case 'pi-userMeh': pi.menu(8); break;
					// About
					case 'pi-off': pi.menu('kill'); break;
				}
			});
			$('#pi-menu h2').off('click', function(){
				$(this).next().slideToggle();
			});
			$('#pi-delchat').off('click', function(){API.sendChat('/clear');});

			$('*[id*="pi-"]').each(function(){
				this.remove();
			});
		}
		// Click Event Binding
		if (!unload) {
			$('#pi-logo, #pi-menu').on('click', function(e){
				switch (e.target.id) {
					case 'pi-logo':
					case 'icon':
					pi.menu(0); break;
					// General
					case 'pi-woot': pi.menu(1); break;
					case 'pi-join': pi.menu(2); break;
					case 'pi-keyShortcut': pi.menu(11); break;
					case 'pi-chatCommands': pi.menu(22); break;
					case 'pi-mutemeh': pi.menu(9); break;
					case 'pi-afkResponder': pi.menu(16); break;
					case 'pi-navWarn': pi.menu(10); break;
					// Customisation
					case 'pi-video': pi.menu(3); break;
					case 'pi-css': pi.menu(4); break;
					case 'pi-bg': pi.menu(5); break;
					case 'pi-old-chat': pi.menu(6); break;
					case 'pi-old-footer': pi.menu(18); break;
					case 'pi-small-media': pi.menu(19); break;
					// Moderation
					case 'pi-userInfo': pi.menu(17); break;
					case 'pi-lengthA': pi.menu(7); break;
					case 'pi-historyA': pi.menu(12); break;
					// Notifications
					case 'pi-userJoin': pi.menu(13); break;
					case 'pi-userLeave': pi.menu(14); break;
					case 'pi-userWoot': pi.menu(26); break;
					case 'pi-userGrab': pi.menu(15); break;
					case 'pi-userMeh': pi.menu(8); break;
					case 'pi-guestJoin': pi.menu(20); break;
					case 'pi-guestLeave': pi.menu(21); break;
					case 'pi-friendConnect': pi.menu(23); break;
					case 'pi-friendDisconnect': pi.menu(24); break;
					case 'pi-gainNotification': pi.menu(25); break;
					// About
					case 'pi-off': pi.menu('kill'); break;
				}
			});
			$('#pi-menu h2').on('click', function(){
				$(this).next().slideToggle();
			});
			$('#pi-afkMessage input').on('change', function(){
				settings.afkMessage = this.value;
			});
			$('#pi-songLength input').on('change', function(){
				settings.songLength = parseInt(this.value);
			});

			$('#pi-rmvDJ').on('click', function(){pi.removeDJ();});
			$('#pi-skip').on('click', function(){pi.forceSkip();});
			$('#pi-delchat').on('click', function(){API.sendChat('/clear');});
		}
		// Tooltips
		if (!unload) {
			$('#now-playing-media').on('mouseenter', function(){
				if (pi.getPlugSettings().tooltips) {
					pi.tooltip(true, 'left', $(this).offset().left+47,0, this.innerText);
				}
			});
			$('#pi-rmvDJ').on('mouseenter', function(){
				if (pi.getPlugSettings().tooltips) {
					var x = $(this).offset().left + ($(this).width()/2);
					var y = $(this).offset().top - ($(this).height()/2);
					pi.tooltip(true, 'left', x,y, lang.tooltips.rmvDJ);
				}
			});
			$('#pi-skip').on('mouseenter', function(){
				if (pi.getPlugSettings().tooltips) {
					var x = $(this).offset().left + ($(this).width()/2);
					var y = $(this).offset().top - ($(this).height()/2);
					pi.tooltip(true, 'left', x,y, lang.tooltips.skip);
				}
			});
			$('#pi-delchat').on('mouseenter', function(){
				if (pi.getPlugSettings().tooltips) {
					var x = $(this).offset().left + ($(this).width()/2);
					var y = $(this).offset().top - ($(this).height()/2);
					pi.tooltip(true, 'left', x,y, lang.tooltips.clearChat);
				}
			});
			$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').on('mouseleave', function(){pi.tooltip();});
		}
		else {
			$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').off('mouseenter');
			$('#now-playing-media, #pi-rmvDJ, #pi-skip, #pi-delchat').off('mouseleave');
		}

		// Fully loaded
		if (!unload) {
			pi.dom = {
				// Menu
				// General
				woot: $('#pi-woot')[0],
				join: $('#pi-join')[0],
				keyShortcut: $('#pi-keyShortcut')[0],
				chatCommands: $('#pi-chatCommands')[0],
				betterMeh: $('#pi-mutemeh')[0],
				afkResponder: $('#pi-afkResponder')[0],
				afkMessage: $('#pi-afkMessage')[0],
				navWarn: $('#pi-navWarn')[0],
				// Customisation
				video: $('#pi-video')[0],
				css: $('#pi-css')[0],
				bg: $('#pi-bg')[0],
				oldChat: $('#pi-old-chat')[0],
				oldFooter: $('#pi-old-footer')[0],
				smallMedia: $('#pi-small-media')[0],
				// Moderation
				userInfo: $('#pi-userInfo')[0],
				lengthA: $('#pi-lengthA')[0],
				songLength: $('#pi-songLength')[0],
				historyAlert: $('#pi-historyA')[0],
				// Notifications
				userJoin: $('#pi-userJoin')[0],
				userLeave: $('#pi-userLeave')[0],
				userWoot: $('#pi-userWoot')[0],
				userGrab: $('#pi-userGrab')[0],
				mehA: $('#pi-userMeh')[0],
				guestJoin: $('#pi-guestJoin')[0],
				guestLeave: $('#pi-guestLeave')[0],
				friendConnect: $('#pi-friendConnect')[0],
				friendDisconnect: $('#pi-friendDisconnect')[0],
				gainNotification: $('#pi-gainNotification')[0],
				// About
				off: $('#pi-off')[0],
				// Mod Bar
				rmvDJ: $('#pi-rmvDJ')[0],
				skip: $('#pi-skip')[0],
				// Other
				DelChat: $('#pi-delchat')[0],
				style: $('#pi-CSS')[0],
				oldStyle: $('#pi-oldchat-CSS')[0],
				oldFooterCSS: $('#pi-oldfooter-CSS')[0],
				smallMediaCSS: $('#pi-smallmedia-CSS')[0],
				// Plug
				stream: $('#playback-container')[0]
			};
			pi.menu('init');

			pi.log(pi.complete(lang.log.loaded + ' ' + (new Date().getTime() - startTime)+'ms'));
			pi.log(lang.log.help, 'info', 'chat');
			pi.log(lang.log.preRelease, 'warn', 'chat');
			$('#pi-status').css({opacity:'0'});
			setTimeout(function(){$('#pi-status').remove();}, 250);
		}
		
		// Preventing making the video definitly desapear
		if (unload && !settings.showVideo) {
			pi.menu(3);
			settings.showVideo = false;
			localStorage.setItem('pi-settings', JSON.stringify(settings));
			return 'unloaded';
		}
		if (unload) {
			sessionStorage.removeItem('modQuitWarn');
			sessionStorage.removeItem('modSkipWarn');
			sessionStorage.removeItem('trustWarn');
			return 'unloaded';
		}
	},
	reload: function() {
		pi.log(lang.log.reloading);
		if (pi.close() == 'killed') $.getScript(scriptURL);
		else pi.log('Unexpected error, couldn\'t kill script', 'error');
	},
	close: function() {
		if (pi.init(true) == 'unloaded') {
			window.scriptURL = pi.url.script; // Allow to reload
			pi = undefined;
			return 'killed';
		}
		else pi.log('Unexpected error, couldn\'t unload script', 'error');
	},
	checkForUpdates: function(isForced) {
		getLastCommit('https://api.github.com/repos/Plug-It/pi/commits/pre-release', function(data){
			var lastCommit = JSON.parse(data.currentTarget.responseText);
			if (thisCommit.sha !== lastCommit.sha) {
				if (isForced) {
					pi.log(lang.log.forcingReload);
					pi.reload();
				}
				else pi.log('An update is available:\n'+lastCommit.commit.message+'\n\nClick here to reload.', 'info', 'chat', function(){pi.reload();});
			}
		});
	}
};
function wait(){
	if (typeof lang !== 'object' || typeof ranks !== 'object') {setTimeout(wait, 100);}
	else pi.init();
}
wait();
})();
