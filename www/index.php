<?php
if (!file_exists(dirname(__FILE__)."/install_config.inc")) {
	include("install.inc");
	die();
}
include("install_config.inc");
#DEV
function component_auto_loader($classname) {
	require_once("component/".$classname."/".$classname.".inc");
}
#END

if (!isset($_SERVER["PATH_INFO"]) || strlen($_SERVER["PATH_INFO"]) == 0) $_SERVER["PATH_INFO"] = "/";
$path = substr($_SERVER["PATH_INFO"],1);


// security: do not allow .. in the path, to avoid trying to access to files which are protected
if (strpos($path, "..") !== FALSE) die("Access denied");

// check last time the user came, it was the same version, in order to refresh its cache if the version changed
#DEV
$version = file_get_contents(dirname(__FILE__)."/version");
#PROD
#$version = "##VERSION##"; 
#END
if (!isset($_COOKIE["pnversion"]) || $_COOKIE["pnversion"] <> $version) {
	if (strpos($path, "/page/") || $path == "") {
		setcookie("pnversion",$version,time()+365*24*60*60,"/");
		session_set_cookie_params(24*60*60, "/dynamic/");
		session_start();
		session_destroy();
		echo "<script type='text/javascript'>window.top.location = '/reload';</script>";
	} else
		header("pn_version_changed: yes", true, 403);
	die();
}

if ($path == "reload") {
	header("Location: /");
	die();
}

if ($path == "favicon.ico") { 
	header("Content-Type: image/ico"); 
	header('Cache-Control: public', true);
	header('Pragma: public', true);
	$date = date("D, d M Y H:i:s",time());
	header('Date: '.$date, true);
	$expires = time()+365*24*60*60;
	header('Expires: '.date("D, d M Y H:i:s",$expires).' GMT', true);
	header('Vary: Cookie');
	readfile("favicon.ico");
	die(); 
}

if ($path == "maintenance/index.php") {
	include("maintenance/index.php");
	die();
}
if (file_exists("maintenance_in_progress")) {
	if ($path == "maintenance/maintenance.jpg") {
		header("Content-Type: image/jpeg");
		readfile("maintenance/maintenance.jpg");
		die();
	}
	if (strpos($path, "/service/")) {
		header("HTTP/1.0 403 Maintenance in progress");
		die();
	}
	include("maintenance/maintenance_page.php");
	die();
}

global $pn_app_version;
$pn_app_version = $version;

if ($path == "") {
	include("loading.inc");
	die();
}


set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__));

function invalid($message) {
	header("HTTP/1.1 404 ".$message);
	die($message);
}

// get type of resource
$i = strpos($path, "/");
if ($i === FALSE) invalid("Invalid request: no type of resource");
$type = substr($path, 0, $i);
$path = substr($path, $i+1);

// get the component name
$i = strpos($path, "/");
if ($i === FALSE) invalid("Invalid request: no component name");
$component_name = substr($path, 0, $i);
$path = substr($path, $i+1);


switch ($type) {
case "static":
	$i = strrpos($path, ".");
	if ($i === FALSE) invalid("Invalid resource type");
	$ext = substr($path, $i+1);
	header('Cache-Control: public', true);
	header('Pragma: public', true);
	$date = date("D, d M Y H:i:s",time());
	header('Date: '.$date, true);
	$expires = time()+365*24*60*60;
	header('Expires: '.date("D, d M Y H:i:s",$expires).' GMT', true);
	header('Vary: Cookie');
	switch ($ext) {
	case "gif": header("Content-Type: image/gif"); break;
	case "png": header("Content-Type: image/png"); break;
	case "jpg": case "jpeg": header("Content-Type: image/jpeg"); break;
	case "css": header("Content-Type: text/css"); break;
	case "js": header("Content-Type: text/javascript"); break;
	case "html": header("Content-Type: text/html;charset=UTF-8"); break;
	case "php": 
		if (!file_exists("component/".$component_name."/static/".$path)) invalid("Static resource not found");
		include "component/".$component_name."/static/".$path;
		die();
	default:
		if (substr($component_name,0,4) <> "lib_")
			invalid("Invalid static resource type");
	}
	if (!file_exists("component/".$component_name."/static/".$path)) invalid("Static resource not found");
	if ($ext == "css") {
		require_once("css_cross_browser.inc");
		parse_css("component/".$component_name."/static/".$path);
	} else
		readfile("component/".$component_name."/static/".$path);
	die();
case "dynamic":
	// get the type of request
	$i = strpos($path, "/");
	if ($i === FALSE) invalid("Invalid request: no dynamic type");
	$request_type = substr($path, 0, $i);
	$path = substr($path, $i+1);
#DEV	
	spl_autoload_register('component_auto_loader');
#END
	require_once("component/PNApplication.inc");
	session_set_cookie_params(24*60*60, "/dynamic/");
	session_start();
	require_once("SQLQuery.inc");
#DEV
	spl_autoload_unregister('component_auto_loader');
#END
	if (!isset($_SESSION["app"])) {
		PNApplication::$instance = new PNApplication();
		PNApplication::$instance->init();
		$_SESSION["app"] = &PNApplication::$instance;
		$_SESSION["version"] = $version;
	} else {
		if (!isset($_SESSION["version"]) || $_SESSION["version"] <> $version) {
			session_destroy();
			if ($request_type == "page") {
				echo "<script type='text/javascript'>window.top.location.href = '/';</script>";
			} else {
				header("Content-Type: application/json");
				echo "{errors:['The application has been updated to a new version.'],result:null}";
			}
			die();
		}
		PNApplication::$instance = &$_SESSION["app"];
		PNApplication::$instance->initRequest();
	}
#DEV
	$dev = new DevRequest();
	$dev->url = $_SERVER["PATH_INFO"];
	$dev->start_time = microtime(true);
	array_push(PNApplication::$instance->development->requests, $dev);
#END

	if (!isset(PNApplication::$instance->components[$component_name])) invalid("Invalid request: unknown component ".$component_name);

	require_once("SQLQuery.inc"); // avoid to put it everywhere
	switch ($request_type) {
	case "page":
		header("Content-Type: text/html;charset=UTF-8");
		PNApplication::$instance->components[$component_name]->page($path);
		break;
	case "service":
		PNApplication::$instance->components[$component_name]->service($path);
		break;
	default: invalid("Invalid request: unknown request type ".$request_type);
	}
#DEV
	$dev->end_time = microtime(true);
#END
	die();
default: invalid("Invalid request: unknown resource type ".$type);
}
	
?>
