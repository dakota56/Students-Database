<?php 
theme::css($this, "application.css");

// mandatory part
$this->requireJavascript("calendar.js");
?><script type='text/javascript'>
window.top.username = <?php echo json_encode(PNApplication::$instance->user_management->username); ?>;
window.top.user_id = <?php echo PNApplication::$instance->user_management->user_id; ?>;
window.top.default_country_code = <?php $d = PNApplication::$instance->getDomainDescriptor(); echo json_encode($d["geography"]["country_code"]).";"; ?>
window.top.default_country_id = <?php $c = PNApplication::$instance->geography->getLocalCountry(); echo $c["id"]; ?>;
window.top.default_country_name = <?php $c = PNApplication::$instance->geography->getLocalCountry(); echo json_encode($c["name"]); ?>;
window.top.default_country_bounds = <?php
$c = PNApplication::$instance->geography->getLocalCountry();
if (isset($c["north"]) && !empty($c["north"]))
	echo "{north:".$c["north"].",south:".$c["south"].",east:".$c["east"].",west:".$c["west"]."}";
else
	echo "null";
?>;

// load geographic information about local country
setTimeout(function() {
	window.top.require("geography.js", function() {
		window.top.geography.getCountryData(window.top.default_country_id,function(){});
	});
}, 1000);

// calendars
function init_top_calendar_manager() {
	if (!window.top.CalendarsProviders || !window.top.pnapplication) {
		setTimeout(init_top_calendar_manager,25);
		return;
	}
	window.top.calendar_manager = new CalendarManager();
	window.top.CalendarsProviders.get(function(provider) {
		if (!window.top.calendar_manager) return;
		for (var i = 0; i < provider.calendars.length; ++i)
			window.top.calendar_manager.addCalendar(provider.calendars[i]);
		provider.on_calendar_added.add_listener(function(cal){
			if (!window.top.calendar_manager) return;
			window.top.calendar_manager.addCalendar(cal);
		});
		provider.on_calendar_removed.add_listener(function(cal){
			if (!window.top.calendar_manager) return;
			window.top.calendar_manager.removeCalendar(cal);
		});
		provider._refresh_interval = setInterval(function() {
			provider.refreshCalendars();
		},5*60*1000);
		provider.refreshCalendars();
	});
	if (!window.top._logout_remove_calendars) {
		window.top._logout_remove_calendars = function() {
			if (!window.top.calendar_manager) return;
			while (window.top.calendar_manager.calendars.length > 0) window.top.calendar_manager.removeCalendar(window.top.calendar_manager.calendars[0]);
			window.top.CalendarsProviders.get(function(provider) {
				clearInterval(provider._refresh_interval);
			});
			window.top.calendar_manager = null;
		};
		window.top.pnapplication.onlogout.add_listener(window.top._logout_remove_calendars);
	}
}
init_top_calendar_manager();
document.body.style.overflow = "hidden";
// connect to Google
<?php 
$google_account = PNApplication::$instance->google->getConnectedAccount();
if ($google_account <> null)
	echo "window.top.require('google.js',function(){window.top.google.connect(".json_encode($google_account["google_login"]).");});";
?>
// ping
if (!window.top.pingInterval) {
	window.top._ping_pending = 0;
	window.top.ping_time = -1;
	window.top.ping_event = new Custom_Event();
	window.top.ping = function() {
		if (window.top._ping_pending > 10) window.top._ping_pending = 0;
		if (window.top._ping_pending++ > 0 && window.top._ping_pending != 5) return; // avoid queuing pings when connection problems
		var sent = new Date().getTime();
		service.json("application","ping",null,function(res) {
			window.top._ping_pending = 0;
			if (!res) return;
			window.top.ping_time = new Date().getTime()-sent;
			window.top.ping_event.fire(res);
			if (res.maintenance_coming && !window.top.maintenance_coming_msg) {
				var content = document.createElement("DIV");
				content.innerHTML = "The software will be updated soon, and will be unavailable for few minutes.<br/>Please save your current work.<br/>You will be disconnected <span id='maintenance_timing'></span><br/>";
				var link_ask = document.createElement("A");
				link_ask.innerHTML = "Please, re-schedule it because I really need to work on it right now";
				link_ask.href = "#";
				link_ask.style.color = "#0000FF";
				content.appendChild(link_ask);
				link_ask.onclick = function() {
					service.json("administration","ask_cancel_maintenance",null,function(res) {
						if (!res) return;
						content.removeChild(link_ask);
						content.appendChild(document.createTextNode(res.origin+" has been informed you would like to cancel it."));
					});
					return false;
				};
				window.top.maintenance_coming_msg = new window.top.StatusMessage(window.top.Status_TYPE_WARNING,content,[{action:"close"}],10*60*1000);
				window.top.status_manager.add_status(window.top.maintenance_coming_msg);
				var update_timing = function() {
					var span = window.top.document.getElementById('maintenance_timing');
					if (!span) {
						window.top.maintenance_coming_msg = null;
						return;
					}
					var now = new Date().getTime()/1000;
					var remaining_seconds = res.maintenance_coming-now;
					if (remaining_seconds > 10) {
						if (remaining_seconds >= 120) span.innerHTML = "in around "+(Math.floor(remaining_seconds/60))+" minutes";
						else if (remaining_seconds >= 60) span.innerHTML = "in around 1 minute";
						else span.innerHTML = "in around "+(Math.floor(remaining_seconds/10)*10)+" seconds";
						setTimeout(update_timing,5000);
						return;
					}
					span.innerHTML = "in few seconds...";
				};
				update_timing();
			} else if (!res.maintenance_coming && window.top.maintenance_coming_msg) {
				window.top.status_manager.remove_status(window.top.maintenance_coming_msg);
				window.top.maintenance_coming_msg = null;
				window.top.status_manager.add_status(new window.top.StatusMessage(window.top.Status_TYPE_INFO,"The maintenance has been cancelled. You won't be disconnected so you can continue to work...",[{action:"close"}],15*1000));
			}
		}, false, null, function() {
			window.top.ping_time = -2;
			window.top._ping_pending = 0;
			window.top.ping_event.fire(null);
		}, true);
	};
	window.top.pingInterval = window.top.setInterval(window.top.ping,30000);
}
</script><?php
if (isset($_GET["page"]) && !isset($_GET["section"])) {
	// only the frame
	echo "<iframe id='application_frame' name='application_frame' src='".$_GET["page"]."' style='width:100%;height:100%;border:none;'></iframe>";
	return;
}
global $theme;
include "component/theme/page/".$theme."/main_screen.inc";
