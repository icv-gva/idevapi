var puntoZoomXY;
var bufferPuntoZoomXY;
var _callbackObtenerXY = null;

function abreVentanaZoomXY(id, mapa) {
	var $vZoomXY = $("#" + id).find("#vZoomXY");
	if ($vZoomXY.length === 0) {
		return;
	}
	if ($vZoomXY.dialog("isOpen")) {
		$vZoomXY.dialog("close");
	}
	$vZoomXY.dialog("open");
	$vZoomXY.data("mapaId", id);
	$vZoomXY.data("mapa", mapa);
}

//Función que crea el botón de zoomXY
function creaBotonZoomXY(id, mapa) {
	if ($('#divControles_' + id).length == 0) {
		creaDivControles(id);
	}
	var divAnadir = document.createElement("div");
	divAnadir.id = "botonZoomXY_" + id;
	var iconoAnadir = L.DomUtil.create('img');
	iconoAnadir.src = prot + urlAPI + "/images/h_zoomXY.svg";
	iconoAnadir.style.width = "75%";
	iconoAnadir.style.height = "auto";
	divAnadir.appendChild(iconoAnadir);
	$('#divControles_' + id).append(divAnadir);
	$('#botonZoomXY_' + id).addClass("classBoton").addClass("classBotonHome");
	$('#botonZoomXY_' + id).hover(
		function () { $(this).addClass("classBotonHover") },
		function () { $(this).removeClass("classBotonHover") }
	);

	//EVENTOS//
	$('#botonZoomXY_' + id).on('click', function (e) {
		e.stopPropagation();
		abreVentanaZoomXY(id, mapa);
	});
}

function eventoClicCapturarXY(evt) {
	lat = evt.latlng.lat;
	lon = evt.latlng.lng;
	var srs = $("#zZoomXYSRS").val();
	switch (srs) {
		case "25830":
			var coords4326 = proj4('EPSG:4326', 'EPSG:25830', [lon, lat]);
			$("#zoomX").val(Math.round(coords4326[0] * 1000) / 1000);
			$("#zoomY").val(Math.round(coords4326[1] * 1000) / 1000);
			break;
		case "25831":
			var coords4326 = proj4('EPSG:4326', 'EPSG:25831', [lon, lat]);
			$("#zoomX").val(Math.round(coords4326[0] * 1000) / 1000);
			$("#zoomY").val(Math.round(coords4326[1] * 1000) / 1000);
			break;
		case "23030":
			var coords4326 = proj4('EPSG:4326', 'EPSG:23030', [lon, lat]);
			$("#zoomX").val(Math.round(coords4326[0] * 1000) / 1000);
			$("#zoomY").val(Math.round(coords4326[1] * 1000) / 1000);
			break;
		case "23031":
			var coords4326 = proj4('EPSG:4326', 'EPSG:23031', [lon, lat]);
			$("#zoomX").val(Math.round(coords4326[0] * 1000) / 1000);
			$("#zoomY").val(Math.round(coords4326[1] * 1000) / 1000);
			break;
		case "4326D":
			$("#zoomLonDec").val(Math.round(lon * 1000000000) / 1000000000);
			$("#zoomLatDec").val(Math.round(lat * 1000000000) / 1000000000);
		case "4326S":
			var gLon = String(lon).split(".")[0];
			var gLat = String(lat).split(".")[0];
			var mLonN = (Math.abs(lon) - Math.abs(parseFloat(gLon))) * 60;
			var mLatN = (Math.abs(lat) - Math.abs(parseFloat(gLat))) * 60;
			var mLon = String(mLonN).split(".")[0];
			var mLat = String(mLatN).split(".")[0];
			var sLonN = (Math.abs(mLonN) - Math.abs(parseFloat(mLon))) * 60;
			var sLatN = (Math.abs(mLatN) - Math.abs(parseFloat(mLat))) * 60;

			$("#zoomLonSexG").val(gLon);
			$('#zoomLonSexMin').val(mLon);
			$('#zoomLonSexSeg').val(sLonN);
			$("#zoomLatSexG").val(gLat);
			$('#zoomLatSexMin').val(mLat);
			$('#zoomLatSexSeg').val(sLatN);
	}
	zoomXYBuffer(lon, lat, '4326', 19);
	$("#vZoomXYCapturaPunto").removeClass("idevapi-ventana-boton-activo");
	$('.leaflet-container').css('cursor', '');
	capturandoPuntoXY = false;
	// Si hay un callback registrado con IDEVAPI_obtenerXY, se invoca con las coordenadas capturadas
	if (_callbackObtenerXY !== null) {
		var cbX, cbY, cbEpsg;
		switch (srs) {
			case "25830":
			case "25831":
			case "23030":
			case "23031":
				var _c = proj4('EPSG:4326', 'EPSG:' + srs, [lon, lat]);
				cbX = Math.round(_c[0] * 1000) / 1000;
				cbY = Math.round(_c[1] * 1000) / 1000;
				cbEpsg = parseInt(srs);
				break;
			case "4326D":
			case "4326S":
				cbX = Math.round(lon * 1000000000) / 1000000000;
				cbY = Math.round(lat * 1000000000) / 1000000000;
				cbEpsg = 4326;
				break;
		}
		_callbackObtenerXY({x: cbX, y: cbY, epsg: cbEpsg});
	}
}

//Función que define las funciones a ejecutar cuando el diálogo de zoomXY está cargado
function inicializaZoomXY() {
	// Inicializar 'previous' con el valor del selector al abrir (por defecto '25830')
	var previous = $('#zZoomXYSRS').val() || '25830';
	var xZoom, yZoom;

	// Al hacer clic en el selector, guardamos el valor actual y las coordenadas visibles
	$("#zZoomXYSRS").on('click', function () {
		// Guardamos el sistema de referencia actual antes del cambio
		previous = this.value;
		switch (previous) {
			case '25830':
			case '25831':
			case '23030':
			case '23031':
				xZoom = parseFloat($('#zoomX').val());
				yZoom = parseFloat($('#zoomY').val());
				break;
			case '4326D':
				xZoom = parseFloat($('#zoomLonDec').val());
				yZoom = parseFloat($('#zoomLatDec').val());
				break;
			case '4326S':
				xZoom = Math.abs(parseFloat($('#zoomLonSexG').val())) + (parseFloat($('#zoomLonSexMin').val() / 60)) + (parseFloat($('#zoomLonSexSeg').val() / 3600));
				if ($('#zoomLonSexG').val().indexOf("-") > -1) {
					xZoom = -xZoom;
				}
				yZoom = parseFloat($('#zoomLatSexG').val()) + (parseFloat($('#zoomLatSexMin').val() / 60)) + (parseFloat($('#zoomLatSexSeg').val() / 3600));
				break;
		}
	}).change(function () {
		// Convertir el SRS destino (4326D/4326S → 4326)
		var valor = (this.value.indexOf("4326") > -1) ? "4326" : this.value;
		// Convertir el SRS origen (4326D/4326S → 4326)
		var valorPrev = (previous.indexOf("4326") > -1) ? "4326" : previous;

		// Validación: comprobar que las coordenadas son números finitos antes de proyectar
		// Evita el error "coordinates must be finite numbers" de proj4 cuando los campos están vacíos
		var coordsValidas = !isNaN(xZoom) && !isNaN(yZoom) &&
			isFinite(xZoom) && isFinite(yZoom);
		var coordsP = null;
		if (coordsValidas) {
			try {
				coordsP = proj4('EPSG:' + valorPrev, 'EPSG:' + valor, [xZoom, yZoom]);
			} catch (e) {
				// Si la proyección falla por coordenadas fuera de rango, no actualizamos campos
				coordsP = null;
			}
		}
		// Actualizar los campos de coordenadas según el SRS destino
		switch (this.value) {
			case '25830':
			case '25831':
			case '23030':
			case '23031':
				if (coordsP) {
					$("#zoomX").val(Math.round(coordsP[0] * 1000) / 1000);
					$("#zoomY").val(Math.round(coordsP[1] * 1000) / 1000);
				} else {
					$("#zoomX").val("");
					$("#zoomY").val("");
				}
				$("#vZoomXYCoordXY").css("display", "block");
				$("#vZoomXYCoordGeoDec").css("display", "none");
				$("#vZoomXYCoordGeoSex").css("display", "none");
				break;
			case '4326D':
				if (coordsP) {
					$("#zoomLonDec").val(Math.round(coordsP[0] * 1000000000) / 1000000000);
					$("#zoomLatDec").val(Math.round(coordsP[1] * 1000000000) / 1000000000);
				} else {
					$("#zoomLonDec").val("");
					$("#zoomLatDec").val("");
				}
				$("#vZoomXYCoordXY").css("display", "none");
				$("#vZoomXYCoordGeoDec").css("display", "block");
				$("#vZoomXYCoordGeoSex").css("display", "none");
				break;
			case '4326S':
				if (coordsP) {
					var gLon = String(coordsP[0]).split(".")[0];
					var gLat = String(coordsP[1]).split(".")[0];
					var mLonN = (Math.abs(coordsP[0]) - Math.abs(parseFloat(gLon))) * 60;
					var mLatN = (Math.abs(coordsP[1]) - Math.abs(parseFloat(gLat))) * 60;
					var mLon = String(mLonN).split(".")[0];
					var mLat = String(mLatN).split(".")[0];
					var sLonN = (Math.abs(mLonN) - Math.abs(parseFloat(mLon))) * 60;
					var sLatN = (Math.abs(mLatN) - Math.abs(parseFloat(mLat))) * 60;
					$("#zoomLonSexG").val(gLon);
					$('#zoomLonSexMin').val(mLon);
					$('#zoomLonSexSeg').val(sLonN);
					$("#zoomLatSexG").val(gLat);
					$('#zoomLatSexMin').val(mLat);
					$('#zoomLatSexSeg').val(sLatN);
				} else {
					$("#zoomLonSexG").val(""); $('#zoomLonSexMin').val(""); $('#zoomLonSexSeg').val("");
					$("#zoomLatSexG").val(""); $('#zoomLatSexMin').val(""); $('#zoomLatSexSeg').val("");
				}
				$("#vZoomXYCoordXY").css("display", "none");
				$("#vZoomXYCoordGeoDec").css("display", "none");
				$("#vZoomXYCoordGeoSex").css("display", "block");
				break;
		}
		// Actualizar el valor previo para la próxima interacción
		previous = this.value;
	});
	$("#checkBufferZoomXY").click(function () {
		if (this.checked) {
			$("#divValorZoomXY :input").attr("disabled", false);
			//$("#divValorZoomXY").removeAttr("disabled");
		} else {
			$("#divValorZoomXY :input").attr("disabled", true);
			//$("#divValorZoomXY").attr("disabled", true);
		}
	});
	//var evtCapturar;
	$("#vZoomXYCapturaPunto").click(function () {
		capturandoPuntoXY = true;
		//mapa.off('click.zoomXYCaptura');
		$("#vZoomXYCapturaPunto").addClass("idevapi-ventana-boton-activo");
		$('.leaflet-container').css('cursor', 'crosshair');
		mapa.once("click", function (evt) {
			eventoClicCapturarXY(evt);
		});
	});
	$("#zoomAPunto").on('click', function () {
		//on(dom.byId("zoomAPunto"), "click", function(){
		var srs = $("#zZoomXYSRS").val();
		var X, Y;
		switch (srs) {
			case "25830":
			case "25831":
			case "23030":
			case "23031":
				X = $('#zoomX').val();
				Y = $('#zoomY').val();
				//zoomXY(X, Y, srs, 19);
				break;
			case "4326D":
				X = $('#zoomLonDec').val();
				Y = $('#zoomLatDec').val();
				//zoomXY(X, Y, srs, 19);
				break;
			case "4326S":
				var posNegX = $('#zoomLonSexG').val().indexOf("-");
				X = Math.abs(parseFloat($('#zoomLonSexG').val())) + Math.abs(parseFloat($('#zoomLonSexMin').val() / 60)) + Math.abs(parseFloat($('#zoomLonSexSeg').val() / 3600));
				Y = parseFloat($('#zoomLatSexG').val()) + (parseFloat($('#zoomLatSexMin').val() / 60)) + (parseFloat($('#zoomLatSexSeg').val() / 3600));

				if (posNegX !== -1) {
					X = X * (-1);
				}
				//zoomXY(X, Y, srs, 19);
				break;
		}
		zoomXYBuffer(X, Y, srs, 19);

	});
	$("#borrarGraficosXY").on('click', function () {
		borraPuntoZoomXY();
	});
}

function zoomXYBuffer(X, Y, srs, nivel) {
	if ($("#checkBufferZoomXY").is(":checked")) {
		var valorBuffer = Number($("#valorBufferZoomXY").val());
		var min = Number($("#valorBufferZoomXY").attr("min"));
		var max = Number($("#valorBufferZoomXY").attr("max"));
		if (valorBuffer < min) {
			valorBuffer = -1;
		} else if (valorBuffer > max) {
			valorBuffer = max;
			$("#valorBufferZoomXY").val(max);
		}
	}
	zoomXY(X, Y, srs, nivel, valorBuffer);
}

//Función que dibuja y hace zoom al punto buscado
function zoomXY(X, Y, srs, nivel, buffer) {
	// Convertir X y Y a valores numéricos
	X = Number(X);
	Y = Number(Y);
	switch (srs) {
		case "25830":

			var coords4326 = proj4('EPSG:25830', 'EPSG:4326', [X, Y]);
			break;
		case "25831":
			var coords4326 = proj4('EPSG:25831', 'EPSG:4326', [X, Y]);
			break;
		case "23030":
			var coords4326 = proj4('EPSG:23030', 'EPSG:4326', [X, Y]);
			break;
		case "23031":
			var coords4326 = proj4('EPSG:23031', 'EPSG:4326', [X, Y]);
			break;
		case "4326D":
		case "4326S":
		case "4326":
			var coords4326 = [X, Y];
			break;
	}
	var lon = coords4326[0];
	var lat = coords4326[1];
	borraPuntoZoomXY();
	mapa.getPane("capaAnalisis").style.display = 'none';
	if (buffer > 0) {
		//Añade el buffer
		bufferPuntoZoomXY = L.circle([lat, lon], buffer, estiloPtoBufferZoomXY).addTo(mapa);
		var bboxBuffer = bufferPuntoZoomXY.getBounds();
		mapa.flyToBounds(bboxBuffer, {
			maxZoom: 16
		});
	} else {
		mapa.flyTo([lat, lon], nivel, {
			animate: true,
			duration: 1
		});
	}
	//No se visualiza el punto y buffer (pane "capaAnalisis") hasta que la animación del zoom se pare
	mapa.once('moveend', function () {
		mapa.getPane("capaAnalisis").style.display = 'block';
	});
	//Añade el punto
	puntoZoomXY = L.circleMarker([lat, lon], estiloPtoZoomXY).addTo(mapa);
}

function borraPuntoZoomXY() {
	if (puntoZoomXY !== undefined) {
		mapa.removeLayer(puntoZoomXY);
	}
	if (bufferPuntoZoomXY !== undefined) {
		mapa.removeLayer(bufferPuntoZoomXY);
	}
}

function IDEVAPI_obtenerXY(callback) {
	_callbackObtenerXY = callback;
}