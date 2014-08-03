<?php 
class page_app_admin extends Page {
	
	public function getRequiredRights() { return array("manage_application"); }
	
	public function execute() {
		$this->requireJavascript("section.js");
		theme::css($this, "section.css");
		
		$sessions_path = ini_get("session.save_path");
		$sessions = array();
		$dir = opendir($sessions_path);
		while (($filename = readdir($dir)) <> null) {
			if (is_dir($filename)) continue;
			array_push($sessions, $filename);
		}
		closedir($dir);
?>
<div style='padding:10px'>
<div id='section_updates' icon='<?php echo theme::$icons_16["refresh"];?>' title='Software Update'>
	<div>
		<?php
		global $pn_app_version;
		echo "Current version: ".$pn_app_version."<br/>";
		echo "Latest version: <span id='latest_version'><img src='".theme::$icons_16["loading"]."'/></span><br/>";
		?>
	</div>
</div>
<div id='section_sessions' title='Open Sessions' collapsable='true' style='margin-top:10px'>
	<table>
		<tr><th>Session ID</th><th>Creation</th><th>Last modification</th><th>User</th></tr>
		<?php 
		$method = ini_get("session.serialize_handler");
		foreach ($sessions as $session) {
			$id = substr($session,5);
			echo "<tr>";
			echo "<td>".$id."</td>";
			$info = stat($sessions_path."/".$session);
			echo "<td>".date("Y-m-d h:i A", $info["ctime"])."</td>";
			echo "<td>".date("Y-m-d h:i A", $info["mtime"])."</td>";
			echo "<td>";
			if ($id == session_id()) {
				echo "<b>You</b>";
			} else {
				$content = file_get_contents($sessions_path."/".$session);
				if (strpos($content, "\"PNApplication\"") === false)
					echo "<i>Another application</i>";
				else {
					$data = self::decode_session($content);
					if ($data <> null) {
						echo @$data["app"]->user_management->username;
					}
				}
			}
			echo "</td>";
			echo "</tr>";
		}
		?>
	</table>		
</div>
</div>
<script type='text/javascript'>
section_updates = sectionFromHTML('section_updates');
section_sessions = sectionFromHTML('section_sessions');

service.json("administration","latest_version",null,function(res) {
	if (res && res.version) {
		document.getElementById('latest_version').innerHTML = res.version;
		var current = "<?php echo $pn_app_version?>";
		current = current.split(".");
		var latest = res.version.split(".");
		var need_update = false;
		for (var i = 0; i < current.length; ++i) {
			if (latest.length <= i) break;
			var c = parseInt(current[i]);
			var l = parseInt(latest[i]);
			if (l > c) { need_update = true; break; }
			if (l < c) break;
		}
		if (need_update) {
			section_updates.content.appendChild(document.createTextNode("A newer version is available ! "));
			var button = document.createElement("BUTTON");
			button.className = "action important";
			button.innerHTML = "Update Software";
			section_updates.content.appendChild(button);
			button.onclick = function() {
				alert("TODO");
			};
		} else {
			var s = document.createElement("SPAN");
			s.innerHTML = "<img src='"+theme.icons_16.ok+"' style='vertical-align:bottom'/> The version is up to date !";
			section_updates.content.appendChild(s);
		}
	}
});

section_sessions.addButton(null,"Remove all sessions except mine","action",function() {
	alert("TODO");
});
</script>
	<?php 
	}

	private static function decode_session($session_string){
	    $current_session = session_encode();
	    foreach ($_SESSION as $key => $value){
	        unset($_SESSION[$key]);
	    }
	    session_decode($session_string);
	    $restored_session = $_SESSION;
	    foreach ($_SESSION as $key => $value){
	        unset($_SESSION[$key]);
	    }
	    session_decode($current_session);
	    return $restored_session;
	}
}
?>