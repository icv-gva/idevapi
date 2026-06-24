/**
 * Reemplazo local de iso8601-js-period (nezasa).
 * Solo implementa Period.parse, que es lo único que usa el plugin TimeDimension.
 * Mantiene la misma firma y formato de retorno que la librería original.
 */
(function () {
	var PERIOD_RE = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

	function parsePeriod(isoString /*, normalize */) {
		if (typeof isoString !== "string") { return null; }
		var m = PERIOD_RE.exec(isoString.trim());
		if (!m) { return null; }
		return [
			parseInt(m[1] || 0, 10), // years
			parseInt(m[2] || 0, 10), // months
			parseInt(m[3] || 0, 10), // weeks
			parseInt(m[4] || 0, 10), // days
			parseInt(m[5] || 0, 10), // hours
			parseInt(m[6] || 0, 10), // minutes
			parseInt(m[7] || 0, 10)  // seconds
		];
	}

	// Registrar en el mismo namespace que la librería original
	if (!window.nezasa) { window.nezasa = {}; }
	if (!window.nezasa.iso8601) { window.nezasa.iso8601 = {}; }
	window.nezasa.iso8601.Period = { parse: parsePeriod };
})();
