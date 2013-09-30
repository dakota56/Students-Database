/**
 * @class service
 */
service = {
	/**
	 * Call a service using JSON
	 * @param component the component containing the service
	 * @param service_name the name of the service to call
	 * @param input data to send to the service: an object, each attribute being a $_POST. If an attribute is a structure or array, it will be converted into a json string.
	 * @param handler callback that will receive the result, or null if an error occured
	 * @param foreground if true, the function will return only after completion of the ajax call, else it will return immediately.
	 */
	json: function(component, service_name, input, handler, foreground) {
		var data = "";
		if (input != null)
			data = service.generate_input(input);
		ajax.custom_post_parse_result("/dynamic/"+component+"/service/"+service_name, "text/json", data, 
			function(result){
				if (result && result.events) {
					for (var i = 0; i < result.events.length; ++i)
						window.top.pnapplication.raise_app_event(result.events[i].id, result.events[i].data);
				}
				handler(result ? result.result : null);
			},
			foreground,
			function(error){
				window.top.status_manager.add_status(new window.top.StatusMessageError(null,error,10000));
			}
		);
	},
	
	/**
	 * Call a service using XML output
	 * @param component the component containing the service
	 * @param service_name the name of the service to call
	 * @param input data to send to the service: an object, each attribute being a $_POST. If an attribute is a structure or array, it will be converted into a json string.
	 * @param handler callback that will receive the result, or null if an error occured
	 * @param foreground if true, the function will return only after completion of the ajax call, else it will return immediately.
	 */
	xml: function(component, service_name, input, handler, foreground) {
		var data = "";
		if (input != null) {
			if (typeof input == 'string') data = input;
			else for (var name in input) {
				if (data.length > 0) data += "&";
				data += encodeURIComponent(name)+"=";
				if (typeof input[name] == 'string')
					data += encodeURIComponent(input[name]);
				else
					data += encodeURIComponent(service.generate_input(input[name]));
			}
		}
		ajax.post_parse_result("/dynamic/"+component+"/service/"+service_name, data, 
			function(xml){
				handler(xml);
			},
			foreground,
			function(error){
				window.top.status_manager.add_status(new window.top.StatusMessageError(null,error,10000));
			}
		);
	},
	
	generate_input: function(input) {
		var s = "";
		if (input == null) return "null";
		if (input instanceof Array) {
			s += "[";
			for (var i = 0; i < input.length; ++i) {
				if (i>0) s += ",";
				s += service.generate_input(input[i]);
			}
			s += "]";
		} else if (typeof input == 'object') {
			s += "{";
			var first = true;
			for (var attr in input) {
				if (first) first = false; else s += ",";
				s += "\""+attr + "\":" + service.generate_input(input[attr]);
			}
			s += "}";
		} else if (typeof input == 'string')
			s += "\""+input.replace(/"/g, "\\\"")+"\"";
		else
			s += input;
		return s;
	}
};
if (typeof ajax != 'undefined')
	ajax.http_response_handlers.push(function(xhr){
		if (xhr.status == 403) {
			window.top.location = "/";
			return false;
		}
		return true;
	});