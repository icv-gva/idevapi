/**
 * Adapter fetch() para IDEVAPI.
 * Proporciona idevapiFetch(options) como alternativa interna a $.ajax().
 * No reemplaza $.ajax existente; es un puente para uso futuro.
 *
 * Opciones compatibles:
 *   url, method (GET|POST), data (object|string), dataType (json|text|xml),
 *   headers (object), success (fn), error (fn), timeout (ms)
 */
(function () {
	function idevapiFetch(opts) {
		if (!opts || !opts.url) { throw new Error("idevapiFetch: url requerida"); }

		var method = (opts.method || "GET").toUpperCase();
		var headers = opts.headers || {};
		var timeout = opts.timeout || 0;
		var controller = timeout > 0 ? new AbortController() : null;
		var timerId = null;

		var fetchOpts = {
			method: method,
			headers: headers
		};

		if (controller) { fetchOpts.signal = controller.signal; }

		// Cuerpo para POST/PUT
		if (opts.data && method !== "GET") {
			if (typeof opts.data === "object") {
				fetchOpts.body = JSON.stringify(opts.data);
				if (!headers["Content-Type"]) {
					headers["Content-Type"] = "application/json";
				}
			} else {
				fetchOpts.body = opts.data;
			}
		}

		// Query string para GET
		var url = opts.url;
		if (opts.data && method === "GET") {
			var params = typeof opts.data === "string"
				? opts.data
				: new URLSearchParams(opts.data).toString();
			url += (url.indexOf("?") === -1 ? "?" : "&") + params;
		}

		if (timeout > 0) {
			timerId = setTimeout(function () { controller.abort(); }, timeout);
		}

		return fetch(url, fetchOpts)
			.then(function (response) {
				if (timerId) { clearTimeout(timerId); }
				if (!response.ok) {
					throw new Error("HTTP " + response.status + " " + response.statusText);
				}
				var dataType = (opts.dataType || "").toLowerCase();
				if (dataType === "json") { return response.json(); }
				if (dataType === "xml") {
					return response.text().then(function (txt) {
						return new DOMParser().parseFromString(txt, "text/xml");
					});
				}
				return response.text();
			})
			.then(function (data) {
				if (typeof opts.success === "function") { opts.success(data); }
				return data;
			})
			.catch(function (err) {
				if (timerId) { clearTimeout(timerId); }
				if (typeof opts.error === "function") { opts.error(err); }
				throw err;
			});
	}

	window.idevapiFetch = idevapiFetch;
})();
