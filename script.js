/**
 * Javascript for the API testing utility
 *
 * @author jwa
 * @version 2011-11-11
 */
(function (window, $) {

var formatJSON;

/**
 * Pretty print an array or object
 *
 * @param {Object} json
 * @return {String}
 */
formatJSON = function(json, l) {
	var tab, i, oCon, p1, v, pCon, s, p, cl;

	if (!l) {
		l = 0;
	}

	tab = '';
	for (i = 0; i < l; i++) {
		tab += '  ';
	}

	oCon = json.constructor;
	p1 = null;
	v = null;
	pCon = null;
	s = tab + (oCon === Object ? '{' : '[');

	for (p in json) {
		if (json.hasOwnProperty(p)) {
			pCon = json[p] ? json[p].constructor : null;
			if (oCon === Array && !/^\d+$/.test(p)) {
				continue;
			}
			p1 = /\s/.test(p) ? '<span class="maybe-string">\'' + p + '\'</span>' : p;
			if (oCon === Array) {
				s += '\n' + tab + '  ';
			} else {
				s += '\n' + tab + '  ' + p1 + ': ';
			}
			if (pCon === Object || pCon === Array) {
				s += '\n' + formatJSON(json[p], l + 2) + ',';
			} else if (pCon === Function) {
				s += '\n' + tab + '    ' + json[p].toString().replace(/\n/g, '\n    ' + tab) + ',';
			} else {
				cl = !pCon ? '' + pCon : pCon.name.toLowerCase();
				v = pCon === String ? '<span class="string">\'' + json[p] + '\'</span>' : '<span class="'+cl+'">' + json[p] + '</span>';
				s += v + ',';
			}
		}
	}
	s = s.substring(0, s.length - 1);
	s += '\n' + tab + (oCon === Object ? '}' : ']');
	return s;
};

$(function() {
	var method, url, params, status, response, output, ignoreHeaders;

	method = $('#method');
	url = $('#url');
	params = $('#params');

	status = $('#status');
	response = $('#response');
	output = $('#output').hide();

	ignoreHeaders = [];

	if (localStorage.getItem('ignoreHeaders')) {
		ignoreHeaders = localStorage.getItem('ignoreHeaders').split(',');
	}

	$('#ignoreheaders').change(function(event) {
		localStorage.setItem('ignoreHeaders', this.value);
		ignoreHeaders = this.value.split(',');
	}).val(ignoreHeaders.join(','));

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

		if(headers.match(/Content-Type: ([a-z\/]+?);/)[1]) {
			try {
				output.html(formatJSON($.parseJSON(raw)));
				output.addClass('json');
			} catch(e) {}
		}

		if (!output.hasClass('json')) {
			output.html(raw);
		}
	});

	$('#api').submit(function(event) {
		event.preventDefault();

		$.ajax({
			type: method.val(),
			url: url.val(),
			data: params.val().split('\n').join('&'),
			complete: function(jqXHR) {
				var text, i, regex, headers;

				headers = jqXHR.getAllResponseHeaders().split('\n');

				for (i in ignoreHeaders) {
					if (ignoreHeaders.hasOwnProperty(i)) {
						regex = new RegExp('^' + ignoreHeaders[i] + ':');
						headers = headers.filter(function(value) {
							return !regex.test(value);
						});
					}
				}

				text = 'HTTP/1.1 ' + jqXHR.status + ' ' + jqXHR.statusText;
				text += '\n' + headers.join('\n');
				text += '\n' + jqXHR.responseText;

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
			}
		});
	});
});

})(window, jQuery);
