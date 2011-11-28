/**
 * Javascript for the API testing utility
 *
 * @author jwa
 * @version 2011-11-11
 */

"use strict";

(function (window, $) {

var format, valueMap;

/**
 * String <> Object utility
 */
valueMap = (function() {
	var splitProperty = '\n',
		splitValue = '=';

	return {
		/**
		 * Create an object from a string
		 *
		 * @param {String} str
		 * @returns {Object}
		 */
		fromString: function(str) {
			var obj, properties, property, i;

			obj = {};
			properties = str.split(splitProperty);

			for (i in properties) {
				if (properties.hasOwnProperty(i)) {
					property = properties[i].split(splitValue);

					obj[property[0].trim()] = property[1].trim();
				}
			}

			return obj;
		},

		/**
		 * Create a string from an object
		 *
		 * @param {Object} obj
		 * @returns {String}
		 */
		fromObject: function(obj) {
			var strArr, property;

			strArr = [];
			for (property in obj) {
				if (obj.hasOwnProperty(property)) {
					strArr.push(property + splitValue + obj[property]);
				}
			}

			return strArr.join(splitProperty);
		}
	};
})();


/**
 * Formatter object
 * Currently supports pretty printing objects (json)
 */
format = (function() {
	var indentation = '  ',
		linebreak = '\n',
		array2string;

	/**
	 * Concatenate a nested array and keep indentation
	 *
	 * @param {Array} arr The array to reduce to a string
	 * @param {String} separator A separator to use between subsequent lines
	 * @param {Number} level Current indentation level, used with recursion
	 *
	 * @returns {String}
	 */
	array2string = function(arr, separator, level) {
		var string,
			currentIndentation;

		if (!separator) {
			separator = '';
		}
		if (!level) {
			level = 0;
		}

		currentIndentation = new Array(level+1).join(indentation);

		return arr.reduce(function(previousValue, currentValue, index, currentArray) {
			var val, type, endline, hasNext;
			endline = '';

			if (!!currentArray[index + 1]) {
				hasNext = true;
				type = currentArray[index + 1] === null ? null : currentArray[index + 1].constructor;
				if (type !== Array && type !== Object) {
					endline = separator;
				}
			} else {
				hasNext = false;
			}

			type = currentValue === null ? null : currentValue.constructor;
			if (type === Array || type === Object) {
				val = array2string(currentValue, separator, level + 1) + linebreak;
			} else {
				val = currentIndentation + currentValue + endline + (hasNext ? linebreak : '');
			}

			return previousValue + val;
		}, "");
	};

	return {
		/**
		 * Formats a JSON object and returns a string representation
		 *
		 * @param {Object} json
		 *
		 * @returns {String}
		 */
		json: function (json) {
			var format, value;

			format = function(json) {
				var values = [], line, type, i;
				for (i in json) {
					if (json.hasOwnProperty(i)) {
						type = json[i] === null ? 'null' : json[i].constructor.name.toLowerCase();

						if (json !== null && json.constructor === Array) {
							line = '<span class="array">' + i + ':</span> ';
						} else {
							line = i + ': ';
						}

						if (type === 'array' || type === 'object') {
							line += type === 'array' ? '[' : '{';
							values.push(line);
							values.push(format(json[i]));
							line = type === 'array' ? ']' : '}';
						} else {
							line += type === 'string' ? '<span class="' + type + '">\'' + json[i] + '\'</span>'
									: '<span class="' + type + '">' + json[i] + '</span>';
						}

						values.push(line);
					}
				}
				return values;
			};

			value = [];

			if (json.constructor === Object) {
				value.push('{');
			} else {
				value.push('[');
			}

			value.push(format(json));

			if (json.constructor === Object) {
				value.push('}');
			} else {
				value.push(']');
			}

			return array2string(value, ',');
		}
	};
})();


$(function() {
	var method, base, url, params, status, response, output, ignoreHeaders, additionalHeaders;

	method = $('#method');
	base = $('#base');
	url = $('#url');
	params = $('#params');

	status = $('#status');
	response = $('#response');
	output = $('#output').hide();

	ignoreHeaders = [];
	additionalHeaders = {};

	if (localStorage.getItem('ignoreHeaders')) {
		ignoreHeaders = localStorage.getItem('ignoreHeaders').split(',');
	}
	$('#ignoreheaders').change(function(event) {
		localStorage.setItem('ignoreHeaders', this.value);
		ignoreHeaders = this.value.split(',');
	}).val(ignoreHeaders.join(','));


	if (localStorage.getItem('additionalHeaders')) {
		additionalHeaders = valueMap.fromString(localStorage.getItem('additionalHeaders'));
	}
	$('#headers').change(function(event) {
		localStorage.setItem('additionalHeaders', this.value);
		additionalHeaders = valueMap.fromString(this.value);
	}).val(valueMap.fromObject(additionalHeaders));


	if (localStorage.getItem('baseURL')) {
		base.val(localStorage.getItem('baseURL'));
	}
	base.change(function(event) {
		localStorage.setItem('baseURL', this.value);
	});

	$('fieldset.showhide').each(function() {
		var fieldset, label, visible;

		fieldset = $(this);
		label = fieldset.find('legend').text();
		visible = false;

		fieldset.before($('<button />', {
			html: 'Show ' + label
		}).click(function(event) {
			event.preventDefault();
			fieldset.toggle();
			visible = !visible;
			this.innerHTML = (visible ? 'Hide ' : 'Show ') + label;
		}));
	});

	$('#show-output').click(function(event) {
		event.preventDefault();

		if (!response.val()) {
			return;
		}

		if (!output.is(':visible')) {
			this.innerHTML = 'Hide Output';
		} else {
			this.innerHTML = 'Show Output';
		}

		output.toggle();
	});

	response.change(function() {
		var headers, raw;

		raw = this.value.split('\n\n');
		headers = raw.shift();
		raw = raw.join('\n\n');

		output.removeClass('json');

		if(headers.match(/Content-Type: ([a-z\/]+?);?/)[1]) {
			try {
				output.html(format.json($.parseJSON(raw)));
				output.addClass('json');
			} catch(e) {}
		}

		if (!output.hasClass('json')) {
			output.html(raw);
		}
	});

	$('#api').submit(function(event) {
		var crossDomain, request;
		event.preventDefault();

		request = {
			cache: false,
			type: method.val(),
			url: base.val() + url.val(),
			crossDomain: crossDomain,
			data: params.val().split('\n').join('&'),
			headers: additionalHeaders
		};

		crossDomain = base.val().match(/^https?:\/\//) ? true : false;

		if (crossDomain) {
			request.dataType = 'jsonp';
		}

		$.ajax(request).always(function(data, unused, jqXHR) {
			var text, i, regex, headers;

			if (typeof data !== 'string' && 'getAllResponseHeaders' in data) {
				jqXHR = data;
				this.crossDomain = false;
			}

			headers = jqXHR.getAllResponseHeaders().split('\n');

			for (i in ignoreHeaders) {
				if (ignoreHeaders.hasOwnProperty(i)) {
					regex = new RegExp('^' + ignoreHeaders[i] + ':');
					headers = headers.filter(function(value) {
						return !regex.test(value);
					});
				}
			}

			text = 'HTTP/1.1 ' + jqXHR.status + ' ' + jqXHR.statusText + '\n';

			if (this.crossDomain) {
				text += 'Content-Type: ' + (this.dataTypes[1] === 'json' ? 'application/json' : 'text/plain') + '\n\n';
				text += this.dataTypes[1] === 'json' ? JSON.stringify(data) : data;
			} else {
				text += headers.join('\n') + '\n';
				text += jqXHR.responseText;
			}

			if (jqXHR.status >= 400) {
				status.attr('src', 'icons/status-busy.png');
			} else if (jqXHR.status >= 300) {
				status.attr('src', 'icons/status-away.png');
			} else if (jqXHR.status >= 200) {
				status.attr('src', 'icons/status.png');
			} else {
				status.attr('src', 'icons/status-offline.png');
			}

			response.val(text).change();
		});
	});
});

})(window, jQuery);
