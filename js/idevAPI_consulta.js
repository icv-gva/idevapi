//Variables necesarias para devolver los filtros a su valor por defecto
//Al existir la posibilidad de multiples mapas, cada variable debe contener un valor para cada mapa id
var dataAGSByMap = {};
var dataMsJsonByMap = {};
var selectAGSByMap = {};
var selectMSJsonByMap = {};
var selectSecundarioByMap = {};
var camposAGSByMap = {};
var reinicio = {};

// Normaliza valores leidos de XML/DOM para comparaciones robustas
function normalizaValorConsulta(valor) {
	if (valor === undefined || valor === null) {
		return "";
	}
	return String(valor).normalize('NFC').replace(/\s+$/g, '');
}

function escapaValorLikeWFS(valor) {
	return String(valor).replace(/!/g, '!!').replace(/\*/g, '!*').replace(/\./g, '!.');
}

//Añade valores alias de los campos en el objeto data.features
function añadeAliasCampos(data, aliasCampos, url) {
	if ((aliasCampos !== undefined) && (aliasCampos !== "")) {
		for (var i in data.features) {
			var feat = data.features[i];
			var objAlias = {}
			for (var j in aliasCampos) {
				var aliasCamposV = aliasCampos[j].split(";");
				var alias = "";
				if (aliasCamposV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { alias = aliasCamposV[1]; } else if (IDEVAPI_global.idioma == "es") { alias = aliasCamposV[0]; } else { if (aliasCamposV[2] !== undefined) { alias = aliasCamposV[2]; } }
				} else {
					alias = aliasCampos[j];
				}
				var nombreA = alias;
				//El campo cabecraPopup define el titulo a mostrar en el Popup
				if (j == "tituloCapa") {
					feat.tituloCapa = nombreA;
				} else {
					var valor = feat.properties[j];
					objAlias[nombreA] = valor;
				}
			}
			feat.urlCapa = url;
			feat.propertiesAlias = objAlias;
		}
	} else {
		for (var i in data.features) {
			var feat = data.features[i];
			feat.urlCapa = url;
		}
	}
}

//Añade valores alias de los campos en el resultado de las consultas geoJSON y json
function añadeAliasCamposJSON(data, aliasCampos) {
	if ((aliasCampos !== undefined) && (aliasCampos !== "")) {
		for (i = 0; i < data.length; i++) {
			var feat = data[i];
			var objAlias = {}
			for (var j in aliasCampos) {
				var aliasCamposV = aliasCampos[j].split(";");
				var alias = "";
				if (aliasCamposV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { alias = aliasCamposV[1]; } else if (IDEVAPI_global.idioma == "es") { alias = aliasCamposV[0]; } else { if (aliasCamposV[2] !== undefined) { alias = aliasCamposV[2]; } }
				} else {
					alias = aliasCampos[j];
				}
				var nombreA = alias;
				var valor = feat.properties[j];
				objAlias[nombreA] = valor;
			}
			feat.propertiesAlias = objAlias;
		}
	}
}

//Función que inicializa las variables del objeto "consulta"
function preparaParamsConsultas(consulta) {

	//Inicializa el objeto servicio (url y origen)
	if (typeof consulta.servicio === 'object' && consulta.servicio !== null) {
		if (consulta.servicio.url == undefined || consulta.servicio.url == null || consulta.servicio.url == "" || consulta.servicio.url == "null") {
			alert(MENSAJES.ErrorURLCapa);
			return;
		}
		if (consulta.servicio.origen == undefined || consulta.servicio.origen == null || consulta.servicio.origen == "" || consulta.servicio.origen == "null") {
			if (consulta.servicio.url.indexOf("terramapas.icv.gva.es") !== -1) {
				consulta.servicio.origen = "MS";
			} else if (consulta.servicio.url.indexOf("carto.icv.gva.es") !== -1) {
				consulta.servicio.origen = "AGS";
			} else if (consulta.servicio.url.indexOf("geojson") !== -1) {
				consulta.servicio.origen = "GeoJSON";
			} else {
				consulta.servicio.origen = "BD";
			}
		}
		/*if (capa.servicio.id == undefined || capa.servicio.id == null || capa.servicio.id == "" || capa.servicio.id == "null"){
			capa.servicio.id = capa.servicio.origen + randomNumberFromRange(0,10000);
		}
		if (capa.servicio.formato == undefined || capa.servicio.formato == null || capa.servicio.formato == "" || capa.servicio.formato == "null"){
			if (capa.servicio.origen == "MS" || capa.servicio.origen == "AGS" || capa.servicio.origen == "GS") {
				capa.servicio.formato = "image/png";
			}
		}*/
		//capa.servicioOrigen = capa.servicio.origen;
		//Si se trata de un servicio definido en idevAPI_config.js
	} else {
		//console.log(consulta);
		//Cuando en servicio se hace referencia al identificador definido en idevAPI_config.js
		var servicioConfig = consulta.servicio;
		delete consulta.servicio;
		servicioConfig = servicioConfig.replace(/\s+/g, ''); //Guarda los datos relativos al servicio y elimina los espacios en blanco (2)
		if (capasIDEV[servicioConfig] == undefined) {
			capasIDEV[servicioConfig] = ["GeoJSON", "local", null];
		}
		consulta.servicio = {};
		//consulta.servicio.id = servicioConfig;
		consulta.servicio.url = capasIDEV[servicioConfig][1].split("|")[0];
		//consulta.servicio.formato = capasIDEV[servicioConfig][2];
		consulta.servicio.origen = capasIDEV[servicioConfig][0];
	}
	if (consulta.servicio.datos == undefined || consulta.servicio.datos == null || consulta.servicio.datos == "" || consulta.servicio.datos == "null") {
		consulta.servicio.datos = "";
	}

	///// Inicializa variable TABLA INFO de la consulta /////
	if (consulta.tablaInfo == undefined || consulta.tablaInfo == null || consulta.tablaInfo == "" || consulta.tablaInfo == "null") {
		consulta.tablaInfo = {};
		consulta.tablaInfo.activo = false;
	}
	///////////// Habilitar/deshabilitar INFO //////////////////
	if (consulta.tablaInfo.activo != false && (consulta.tablaInfo.activo == undefined || consulta.tablaInfo.activo == null || consulta.tablaInfo.activo == "" || consulta.tablaInfo.activo == "null")) {
		consulta.tablaInfo.activo = true;
	}
	// Abrir popup tras la consulta si hay solo 1 elemento seleccionado
	if (consulta.tablaInfo.abrir1Elem != false && (consulta.tablaInfo.abrir1Elem == undefined || consulta.tablaInfo.abrir1Elem == null || consulta.tablaInfo.abrir1Elem == "" || consulta.tablaInfo.abrir1Elem == "null")) {
		consulta.tablaInfo.abrir1Elem = true;
	}
	// Estilo
	if (consulta.tablaInfo.estilo == undefined || consulta.tablaInfo.estilo == null || consulta.tablaInfo.estilo == "" || consulta.tablaInfo.estilo == "null") {
		consulta.tablaInfo.estilo = "ICV";
	}
	// Mostrar NombreCampos
	if (consulta.tablaInfo.mostrarNombreCampos != false && (consulta.tablaInfo.mostrarNombreCampos == undefined || consulta.tablaInfo.mostrarNombreCampos == null || consulta.tablaInfo.mostrarNombreCampos == "" || consulta.tablaInfo.mostrarNombreCampos == "null")) {
		consulta.tablaInfo.mostrarNombreCampos = true;
	}
	// Titulo
	if (consulta.tablaInfo.titulo == undefined || consulta.tablaInfo.titulo == null || consulta.tablaInfo.titulo == "" || consulta.tablaInfo.titulo == "null") {
		consulta.tablaInfo.titulo = "";
	}
	if (consulta.tablaInfo.template == undefined || consulta.tablaInfo.template == null || consulta.tablaInfo.template == "" || consulta.tablaInfo.template == "null") {
		consulta.tablaInfo.template = null;
	}
	// ALIAS. Deja solo los campos y valores del idioma del visor
	if ((consulta.tablaInfo.alias !== undefined) && (consulta.tablaInfo.alias !== "")) {
		var aliasAux = {};
		for (var prop in consulta.tablaInfo.alias) {
			//Cambia Propiedad (campo) según idioma
			var idiomaProp = "";
			if (prop.split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") { idiomaProp = prop.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { idiomaProp = prop.split(";")[1]; } else { idiomaProp = prop.split(";")[1]; }
			} else {
				//Si no hay definido varios campos
				idiomaProp = prop;
			}
			//Cambia el alias definido según idioma
			var aliasCamposV = consulta.tablaInfo.alias[prop].split(";");
			var alias = "";
			if (aliasCamposV.length > 1) {
				if (IDEVAPI_global.idioma == "va") { alias = aliasCamposV[1]; } else if (IDEVAPI_global.idioma == "es") { alias = aliasCamposV[0]; } else { if (aliasCamposV[2] !== undefined) { alias = aliasCamposV[2]; } }
			} else {
				alias = consulta.tablaInfo.alias[prop];
			}
			//Se rellenan valores nuevos en aliasAux
			aliasAux[idiomaProp] = alias;
		}
		//Se machaca la propiedad "alias" que tenía todos los campos por idiomas, con el nombre del campo que toca (solo el idioma actual del visor)
		consulta.tablaInfo.alias = aliasAux;
	}

	///// CAMPOS /////
	if (consulta.campos == undefined || consulta.campos == null || consulta.campos == "" || consulta.campos == "null") {
		consulta.campos = [];
	} else {
		//consulta.campos.forEach(function(cam){
		for (k = 0; k < consulta.campos.length; k++) {
			//Cambia valores según idioma
			if (consulta.campos[0].split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") { consulta.campos[0] = consulta.campos[0].split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { consulta.campos[0] = consulta.campos[0].split(";")[1]; } else { consulta.campos[0] = consulta.campos[0].split(";")[1]; }
			}
		}
	}

	///// MARCADOR /////
	if (consulta.marcador == undefined || consulta.marcador == null || consulta.marcador == "" || consulta.marcador == "null") {
		consulta.marcador = { activo: false };
	}
	if (consulta.marcador.activo != false && (consulta.marcador.activo == undefined || consulta.marcador.activo == null || consulta.marcador.activo == "" || consulta.marcador.activo == "null")) {
		consulta.marcador.activo = true;
	}
	if (consulta.marcador.prioridad != 0 && (consulta.marcador.prioridad == undefined || consulta.marcador.prioridad == null || consulta.marcador.prioridad == "" || consulta.marcador.prioridad == "null")) {
		consulta.marcador.prioridad = 1;
	}
	// ICONO URL
	if (consulta.marcador.icono === undefined || consulta.marcador.icono === null || consulta.marcador.icono === "" || consulta.marcador.icono === "null") {
		consulta.marcador.icono = "localizador_tipo1_negro";
	}
	// ICONO Tamaño
	if (consulta.marcador.tamaño === undefined || consulta.marcador.tamaño === null || consulta.marcador.tamaño === "" || consulta.marcador.tamaño === "null") {
		consulta.marcador.tamaño = [30, 30];
	}

	/*if (consulta.zoom == undefined || consulta.zoom == null || consulta.zoom == "" || consulta.zoom == "null"){
		consulta.zoom = true;
	}
	if (consulta.animacion != false && (consulta.animacion == undefined || consulta.animacion == null || consulta.animacion == "" || consulta.animacion == "null")){
		consulta.animacion = true;
	}
	if (consulta.duracionAnimacion == undefined || consulta.duracionAnimacion == null || consulta.duracionAnimacion == "" || consulta.duracionAnimacion == "null"){
		consulta.duracionAnimacion = 3;
	}*/

	///// ZOOM a la consulta /////
	if (consulta.zoom == undefined || consulta.zoom == null || consulta.zoom == "" || consulta.zoom == "null") {
		consulta.zoom = {};
		consulta.zoom.activo = true;
	}
	///////////// Activo/Desactivo //////////////////
	if (consulta.zoom.activo != false && (consulta.zoom.activo == undefined || consulta.zoom.activo == null || consulta.zoom.activo == "" || consulta.zoom.activo == "null")) {
		consulta.zoom.activo = true;
	}
	//Animación en el zoom
	if (consulta.zoom.animacion != 0 && (consulta.zoom.animacion == undefined || consulta.zoom.animacion == null || consulta.zoom.animacion == "" || consulta.zoom.animacion == "null")) {
		consulta.zoom.animacion = 3;
	}

	return (consulta);
}

// Rellena los Select de las consultas al inicio //////////////////////
function rellenaConsultas(id, mapa, consultas) {

	consultas.forEach(function (consulta) {
		//Comprueba que el servicio está bien definido
		//consulta.servicioId = consulta.servicioId.replace(/\s+/g, '');
		var consultaR = preparaParamsConsultas(consulta);
		if (consultaR.servicio.origen !== undefined) {	//HAY servicio definido para realizar la consulta

			//var consultaR = preparaParamsConsultas(consulta);

			var selectsSecundarios = [];
			var selects = consultaR.selects;
			var numSelects = consultaR.selects.length;
			if (numSelects > 3) {
				alert(MENSAJES.NivelConsultas)
			}
			var IDEVAPISelect1 = $('#' + selects[0]);
			if (IDEVAPISelect1.length < 1) {
				alert(MENSAJES.SelectDesconocido + selects[0]);
				return true;
			}
			IDEVAPISelect1 = IDEVAPISelect1[0];
			if (numSelects > 1) {
				if (numSelects >= 2) {
					var IDEVAPISelect2 = $('#' + selects[1]);
					if (IDEVAPISelect2.length < 1) {
						alert(MENSAJES.SelectDesconocido + selects[1]);
						return true;
					}
					IDEVAPISelect2 = IDEVAPISelect2[0];
					selectsSecundarios.push(IDEVAPISelect2);
				}
				if (numSelects == 3) {
					var IDEVAPISelect3 = $('#' + selects[2]);
					if (IDEVAPISelect3.length < 1) {
						alert(MENSAJES.SelectDesconocido + selects[2]);
						return true;
					}
					IDEVAPISelect3 = IDEVAPISelect3[0];
					selectsSecundarios.push(IDEVAPISelect3);
				}
			}

			if (numSelects == 1) {
				preparaConsultaSelect(IDEVAPISelect1, mapa, consultaR);
			} else {
				preparaConsultaMultiSelect(IDEVAPISelect1, mapa, selectsSecundarios, numSelects, consultaR);
			}
		} else {
			alert(MENSAJES.SelectSimpleDesconocido);
		}
	});
}

//Añade la capa de consulta a partir de un geoJSON que recibe en "data".
//Muestra info del elemento si es "true" y es un sólo elemento.
//function añadeCapaConsulta (data,tablaInfo,anyadeCapa,urlIcono,mapa,animacion,activarZoom) {
function añadeCapaConsulta(data, mapa, consulta) {
	if (data[0] !== undefined) {
		var datos = data[0];
	} else if (data.features[0] !== undefined) {
		var datos = data.features[0];
	} else {
		var datos = "";
	}
	capaPopup = data;

	//Crea los Panes
	if (consulta.marcador.activo) {
		if (consulta.marcador.prioridad == 1) {
			var ordenConsulta = paneZIndexCapaConsultaArriba;
		} else {
			var ordenConsulta = paneZIndexCapaConsultaAbajo;
		}
		if (map.getPane("capaConsulta_" + ordenConsulta) == undefined) {
			map.createPane("capaConsulta_" + ordenConsulta);
			map.getPane("capaConsulta_" + ordenConsulta).style.zIndex = ordenConsulta;
		}
	}
	//////// CAPAS PUNTOS  /////////////////////
	if (datos !== "" && (datos.geometry.type == "Point" || datos.geometry.type == "MultiPoint")) {
		//Se usa un svg cualquiera y se le da un tamaño 0. El info sale 10 pixeles más arriba
		var miIcono;
		//Si el marcador se añade
		if (consulta.marcador.activo) {
			var tamIcono = consulta.marcador.tamaño;
			var desX = (tamIcono[0] / 2) + 1;
			var desY = (tamIcono[1] / 2) + 1;
			//Si el icono es de tipo localizador, se desplaza hacia arriba para que marque el centro
			if (consulta.marcador.icono.indexOf("localizador") !== -1) {
				desY = desY + (tamIcono[1] / 2);
			}
			miIcono = L.icon({
				iconUrl: URLFicherosWeb + "geoidevapi/1.2/images/cons_" + consulta.marcador.icono + ".svg",
				iconSize: tamIcono,
				//shadowSize: [0,0],
				iconAnchor: [desX, desY],
				popupAnchor: [0, 0]
			});
			//Si no se añade marcador, solo se realizará zoom
		} else {
			miIcono = L.icon({
				iconUrl: URLFicherosWeb + "geoidevapi/1.2/images/cons_puntero_tipo1_negro.svg",
				iconSize: [0, 0]
			});
		}

		var opcionesMaker = {};
		opcionesMaker.icon = miIcono;
		if (consulta.marcador.activo) {
			opcionesMaker.pane = "capaConsulta_" + ordenConsulta;
		}
		if (!consulta.tablaInfo.activo) {
			opcionesMaker.interactive = false;
		}

		//Limpia la capa de consulta y cierra PopUps
		limpiaConsulta(mapa);
		if ($(".leaflet-popup-close-button").length > 0) {
			$(".leaflet-popup-close-button")[0].click();
		}
		//Crea la capa de consulta y la añade al mapa
		capaConsulta = new L.geoJson(data, {
			style: estiloConsulta,
			pointToLayer: function (feature, latlng) {
				return L.marker(latlng, opcionesMaker);
			},
			onEachFeature: function (feature, layer) {
				popupGeoJSON(feature, layer, consulta.tablaInfo);
			}
		});
		capaConsulta.addTo(mapa);

		///////////Mostrar los puntos con cluster/////////////////////
		var colorCluster = 'rgb(0,128,255)';
		var colorClusterE = colorCluster.replace("rgb(", "rgba(").replace(")", ",0.6)");
		var colorClusterI = colorCluster.replace("rgb(", "rgba(").replace(")", ",1)");
		var idCSS = "capaConsulta"
		$('head').append('<style id="capaConsulta;" type="text/css">.marker-micluster-' + idCSS + ' {background-color: ' + colorClusterE + ';width:60px;height:60px;}.marker-micluster-' + idCSS + ' div {background-color: ' + colorClusterI + ';}</style>');
		var markerCluster = L.markerClusterGroup.layerSupport({
			showCoverageOnHover: false,
			maxClusterRadius: 40,
			iconCreateFunction: function (cluster) {
				var childCount = cluster.getChildCount();
				return new L.DivIcon({ html: '<div id="capaConsulta;"><span>' + childCount + '</span></div>', className: 'marker-cluster marker-micluster-' + idCSS, iconSize: new L.Point(40, 40) });
			}
		});
		markerCluster.addTo(mapa);
		markerCluster.checkIn(capaConsulta);
		capaConsulta.addTo(mapa);
		mapa.addLayer(markerCluster);
		//////// CAPAS LINEAS y POLÍGONOS  /////////////////////
	} else {
		limpiaConsulta(mapa);
		if (consulta.marcador.activo) {
			/*if (map.getPane("capaConsultas") == undefined) {
				map.createPane("capaConsultas");
				map.getPane("capaConsultas").style.zIndex = 250;
			}*/
			capaConsulta = new L.geoJson(data, {
				//pane:"capaConsultas",
				style: estiloConsulta,
				onEachFeature: function (feature, layer) {
					popupGeoJSON(feature, layer, consulta.tablaInfo);
				},
				interactive: false,
				pane: "capaConsulta_" + ordenConsulta
			});
		} else {
			capaConsulta = new L.geoJson(data, {
				style: estiloVacio,
				onEachFeature: function (feature, layer) {
					popupGeoJSON(feature, layer, consulta.tablaInfo);
				},
				interactive: false
			});
		}
		capaConsulta.id = "capaConsulta;";
		capaConsulta.addTo(mapa);
	}
	//Realiza el zoom
	if (consulta.zoom.animacion == 0) {
		var animacionActiva = false;
	} else {
		var animacionActiva = true;
	}
	if (Object.keys(capaConsulta._layers).length < 1000) {
		if (consulta.zoom.activo) {
			mapa.flyToBounds(capaConsulta.getBounds(), {
				maxZoom: 16,
				animate: animacionActiva,
				duration: consulta.zoom.animacion
			});
		} else {
			if (!(mapa.getBounds().contains(capaConsulta.getBounds()))) {
				mapa.flyToBounds(capaConsulta.getBounds(), {
					maxZoom: mapa.getZoom(),
					animate: animacionActiva,
					duration: consulta.zoom.animacion
				});
			}
		}
	} else {
		map.fitBounds(capaConsulta.getBounds(), {
			maxZoom: 16,
			animate: animacionActiva,
			duration: consulta.zoom.animacion
		});
	}
	///// Abre ventana de INFO si está activo, abrir1Elem es true y sólo hay un elemento como resultado /////
	//Comprueba si es capa en local o no
	if (data.features == undefined) {
		var datos = data;
	} else {
		var datos = data.features;
	}
	if (consulta.tablaInfo.activo && consulta.tablaInfo.abrir1Elem && datos.length == 1) {
		if (animacionActiva) {
			mapa.once('moveend', function () {
				capaConsulta.eachLayer(function (layer) {
					modificaAnchoInfo(consulta.tablaInfo.ancho);
					if (layer._latlng == undefined) {
						Object.keys(layer._layers).forEach(lay => {
							layer.popupPers.setLatLng(layer._layers[lay]._latlng).addTo(map).openOn(map);
						});
					} else {
						layer.popupPers.setLatLng(layer._latlng).addTo(map).openOn(map);
					}
				});
			});
		} else {
			capaConsulta.eachLayer(function (layer) {
				modificaAnchoInfo(consulta.tablaInfo.ancho);
				layer.popupPers.setLatLng(layer._latlng).addTo(map).openOn(map);
			});
		}
	}
}

//Parece que no se usa esta función. Se usa la de idevAPI_filtro.js?
function limpiaConsulta(mapa) {
	if (capaConsulta !== null) {
		mapa.removeLayer(capaConsulta);
	}
}

///////////////// DEVUELVE LAS CONSULTAS A LOS VALORES POR DEFECTO /////////////////////////////////

function reiniciaConsulta(id, selectExcepcion) {
	reinicio[id] = true;
	//mapa = mapas_id.find(function(x){ return x.id === id}).mapa;
	mapa = mapas_id.filter(function (x) {
		return x.id === id
	})[0].mapa;
	if (capaConsulta !== null) {
		for (i = 0; i < selectAGSByMap[id].length; i++) {
			if (selectAGSByMap[id][i] !== selectExcepcion) {
				selectAGSByMap[id][i].options.length = 0;
				if ($(selectAGSByMap[id][i]).attr("data-select2-id") !== undefined) { $(selectAGSByMap[id][i]).attr("placeholder", MENSAJES.Seleccionar); selectAGSByMap[id][i].appendChild(new Option("", "")); } else { selectAGSByMap[id][i].appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
				var data = dataAGSByMap[id][i];
				for (var j = 0; j < data.features.length; j++) {
					var valor = data.features[j].attributes[camposAGSByMap[mapa.id][i]];
					selectAGSByMap[id][i].appendChild(new Option(valor, valor));
				}
				selectAGSByMap[id][i].value = MENSAJES.Seleccionar;
			}
		}
		for (i = 0; i < selectMSJsonByMap[id].length; i++) {
			if (selectMSJsonByMap[id][i] !== selectExcepcion) {
				selectMSJsonByMap[id][i].options.length = 0;
				if ($(selectMSJsonByMap[id][i]).attr("data-select2-id") !== undefined) { $(selectMSJsonByMap[id][i]).attr("placeholder", MENSAJES.Seleccionar); selectMSJsonByMap[id][i].appendChild(new Option("", "")); } else { selectMSJsonByMap[id][i].appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
				var data = dataMsJsonByMap[id][i];
				for (var j = 0; j < data.length; j++) {
					var valor = data[j];
					selectMSJsonByMap[id][i].appendChild(new Option(valor, valor));
				}
				selectMSJsonByMap[id][i].value = MENSAJES.Seleccionar;
			}
		}
		for (i = 0; i < selectSecundarioByMap[id].length; i++) {
			if (selectSecundarioByMap[id][i] !== undefined) { selectSecundarioByMap[id][i].options.length = 0; selectSecundarioByMap[id][i].appendChild(new Option(MENSAJES.Esperando, "")); selectSecundarioByMap[id][i].disabled = true; }
		}
		mapa.removeLayer(capaConsulta);
	}
	if (selectExcepcion == undefined) {
		mapa.flyTo(mapa.coordInicio, mapa.zoomInicio);
	}
}

function muestraInfoElemento(capa, mapa) {
	mapa.once('moveend', function () {
		capa.openPopup();
	});
}

//////////////////////// zoomConsulta(servicio,campo,valor) /////////////////////////////////////////////////
//Realiza una consulta al Rest (AGS) o al WFS (MS) y dibuja los elementos seleccionados
//function zoomConsulta(id,servicio,capa,campo,valor,muestraInfo,aliasCampos,anyadeCapa) {
//paramsConsulta = {tablaInfo,anyadirAMapa,urlIcon,zoom,duracionAnimacion}

//function zoomConsulta(idMapa,servicioId,capaNombre,campo,valor,paramsConsulta) {
function IDEVAPI_zoomConsulta(consulta) {
	//Prepara los parámetros de la consulta
	var paramsConsulta = preparaParamsConsultas(consulta);

	var mapa = mapas_id.filter(function (x) { return x.id === consulta.mapa })[0].mapa;
	var campo = consulta.campos[0];
	var valor = consulta.valor.replace(/'/g, "\'");
	var urlServicio = consulta.servicio.url;
	var capaNombre = consulta.capa;
	// Para servicios con origen AGS
	if (consulta.servicio.origen == "AGS") {
		urlServicio = urlServicio.replace("/arcgis/services/", "/arcgis/rest/services/").replace("/MapServer/WMSServer", "/MapServer/");
		var consulta = "where=" + campo + " LIKE '" + valor + "'&outFields=*&returnGeometry=true&f=geojson";
		var urlServicio = urlServicio + capaNombre;
		var consultaRest2 = urlServicio + "/query?" + consulta;
		var request2 = $.ajax({
			url: encodeURI(consultaRest2),
			type: "GET"
		});
		request2.done(function (data) {
			añadeAliasCampos(data, paramsConsulta.tablaInfo.alias, consulta.servicio.url);
			añadeCapaConsulta(data, mapa, paramsConsulta);
		});
		request2.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + capaNombre + ", " + campo + ". Error:" + textStatus);
		});
		// Para servicios con origen MS
	} else if (consulta.servicio.origen == "MS") {
		var filtro = "<Filter><PropertyIsEqualTo><PropertyName>" + campo + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo></Filter>";
		var request3 = $.ajax({
			url: urlServicio,
			type: "GET",
			data: {
				'service': 'WFS',
				'request': 'GetFeature',
				'version': '2.0.0',
				'typeName': capaNombre,
				'outputFormat': 'geojsonstream',
				'srsName': 'EPSG:4326',
				'filter': filtro
			}, //campo donde realizar la búsqueda : valor de búsqueda
			dataType: "json"
		});
		request3.done(function (data) {
			añadeAliasCampos(data, paramsConsulta.tablaInfo.alias, consulta.servicio.url);
			añadeCapaConsulta(data, mapa, paramsConsulta);
		});
		request3.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + capaNombre + ", " + campo + ". Error:" + textStatus);
		});
		// Para servicios con origen GeoJSON
	} else if (consulta.servicio.origen == "GeoJSON") {
		var capa;
		//Es una capa GeoJSON en http
		if (urlServicio !== "IDEVAPI_Local") {


			//Es una capa definida en local con variable
		} else {
			capa = window[servicio];
		}
		//valor = valor.replace(/'/g,"''");
		var resultados = filtroGeoJSON(capa, campo, valor);
		if (resultados.length > 0) {
			//var consulta = {tablaInfo:{activo:false},anyadirAMapa:anyadeCapa,urlIcono:undefined,animacion:true,zoom:true};
			añadeCapaConsulta(resultados, mapa, paramsConsulta);
			//añadeCapaConsulta(resultados,tablaInfo,anyadeCapa,undefined,mapa,true,true);
		} else {
			limpiaConsulta(mapa);
		}
	}
}

////////////////////////////////////////////// FUNCIONES CONSULTA JSON DIRECTO //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Preparan los selects: rellena con datos y crea la función al seleccionar elemento y hacer consulta
//function preparaConsultaSelect (select,mapa,servicio,capa,campo,tablaInfo,anyadeCapa,urlIcono,animacion,activarZoom){
function preparaConsultaSelect(select, mapa, consulta) {
	consulta.campo = consulta.campos[0];
	//En caso de ser el primer select de un mapa, inicializar las varibles
	if (selectAGSByMap[mapa.id] == undefined) { selectAGSByMap[mapa.id] = [] }
	if (selectMSJsonByMap[mapa.id] == undefined) { selectMSJsonByMap[mapa.id] = [] }
	if (selectSecundarioByMap[mapa.id] == undefined) { selectSecundarioByMap[mapa.id] = [] }
	if (dataAGSByMap[mapa.id] == undefined) { dataAGSByMap[mapa.id] = [] }
	if (camposAGSByMap[mapa.id] == undefined) { camposAGSByMap[mapa.id] = [] }
	if (dataMsJsonByMap[mapa.id] == undefined) { dataMsJsonByMap[mapa.id] = [] }
	if (reinicio[mapa.id] == undefined) { reinicio[mapa.id] = false }

	var urlServicio = consulta.servicio.url;
	var tipoServicio = consulta.servicio.origen;

	var urlInfoPopup = urlServicio;
	if (tipoServicio == "AGS") {
		urlServicio = urlServicio.replace("/arcgis/services/", "/arcgis/rest/services/").replace("/MapServer/WMSServer", "/MapServer/");
		popupUrl = urlServicio;
		urlServicio = urlServicio + consulta.capa;
		var consultaRestGET = "where=1=1&outFields=" + consulta.campos[0] + "&returnGeometry=false&returnDistinctValues=true&orderByFields=" + consulta.campos[0] + "&f=json";
		var consultaRest = urlServicio + "/query?" + consultaRestGET;
		var request = $.ajax({
			url: encodeURI(consultaRest),
			type: "GET"
		});
		request.done(function (data) {
			select.options.length = 0;
			if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); select.appendChild(new Option("", "")); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
			for (var j = 0; j < data.features.length; j++) {
				var valor = data.features[j].attributes[consulta.campos[0]];
				select.appendChild(new Option(valor, valor));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if (!reinicio[mapa.id]) {
				selectAGSByMap[mapa.id].push(select);
				dataAGSByMap[mapa.id].push(data);
				camposAGSByMap[mapa.id].push(consulta.campos[0]);
			}
			$(select).on('change.idevapiConsulta', function () {
				reiniciaConsulta(mapa.id, select);
				var valor = $(this).val();
				if (valor !== null) {//No se limpia la selección del Select
					valor = valor.replace(/'/g, "''");
					var consultaRest2GET = "where=" + consulta.campos[0] + "='" + valor + "'&outFields=*&returnGeometry=true&f=geojson";
					var consultaRest2 = urlServicio + "/query?" + consultaRest2GET;
					var request2 = $.ajax({
						url: encodeURI(consultaRest2),
						type: "GET"
					});
					request2.done(function (data2) {
						if (data2.features.length > 0) {
							añadeAliasCampos(data2, consulta.tablaInfo.alias, urlInfoPopup);
							añadeCapaConsulta(data2, mapa, consulta);
						} else {
							limpiaConsulta(mapa);
						}
					});
					request2.fail(function (jqXHR, textStatus) {
						alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
					});
				};
			});
		});
		request.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
		});
	} else if (tipoServicio == "MS") {
		popupUrl = urlServicio;
		var requestMS = $.ajax({
			url: urlServicio,
			type: "GET",
			data: {
				'service': 'WFS',
				'request': 'GetPropertyValue',
				'version': '2.0.0',
				'typeNames': consulta.capa,
				'valueReference': consulta.campos[0],
				'sortBy': consulta.campos[0]
			},
			dataType: "xml"
		});

		requestMS.done(function (data) {
			var dataFiltrada = [];
			//////////Tratamiento de respuesta XML/////////////
			var elementos = data.getElementsByTagName('ms:' + consulta.campos[0]);
			for (i = 0; i < elementos.length; i++) {
				var textoElem = normalizaValorConsulta(elementos[i].textContent);
				if (textoElem && dataFiltrada.indexOf(textoElem) == -1) {
					dataFiltrada.push(textoElem);
				}
			}

			//////////Tratamiento de respuesta JSON///////////
			select.options.length = 0;
			if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); select.appendChild(new Option("", "")); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
			//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < dataFiltrada.length; j++) {
				var valor = dataFiltrada[j];
				select.appendChild(new Option(valor, valor));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if (!reinicio[mapa.id]) {
				selectMSJsonByMap[mapa.id].push(select);
				dataMsJsonByMap[mapa.id].push(dataFiltrada);
			}
			$(select).on('change.idevapiConsulta', function () {
				reiniciaConsulta(mapa.id, select);
				var valor = $(this).val();
				if (valor !== null && valor !== "") {//No se limpia la selección del Select
					valor = valor.replace(/'/g, "'");
					/*if(valor.length > 120){
						valor =  valor.substring(0,120)
						var filtro = "<Filter><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsLike></Filter>";
					} else {
						var filtro = "<Filter><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo></Filter>";
					}*/
					var filtro = "<Filter><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo></Filter>";
					//var filtro = "<Filter><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsLike></Filter>";
					var request2 = $.ajax({
						url: urlServicio,
						type: "GET",
						data: {
							'service': 'WFS',
							'request': 'GetFeature',
							'version': '2.0.0',
							'typeName': consulta.capa,
							'outputFormat': 'geojsonstream',
							'srsName': 'EPSG:4326',
							'filter': filtro
						},
						dataType: "json"
					});
					request2.done(function (data) {
						if (data.features.length > 0) {
							if (valor !== MENSAJES.Seleccionar) {
								añadeAliasCampos(data, consulta.tablaInfo.alias, urlInfoPopup);
								añadeCapaConsulta(data, mapa, consulta);
							}
						} else {
							//Si no hay resultados, hacer la petición con "PropertyIsLike"
							var filtro = "<Filter><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsLike></Filter>";
							var request3 = $.ajax({
								url: urlServicio,
								type: "GET",
								data: {
									'service': 'WFS',
									'request': 'GetFeature',
									'version': '2.0.0',
									'typeName': consulta.capa,
									'outputFormat': 'geojsonstream',
									'srsName': 'EPSG:4326',
									'filter': filtro
								},
								dataType: "json"
							});
							request3.done(function (data) {
								if (data.features.length > 0) {
									if (valor !== MENSAJES.Seleccionar) {
										añadeAliasCampos(data, consulta.tablaInfo.alias, urlInfoPopup);
										añadeCapaConsulta(data, mapa, consulta);
									}
								} else {
									limpiaConsulta(mapa);
								}
							});
							request3.fail(function (jqXHR, textStatus) {
								alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
							});
						}
					});
					//En caso de fallo, se prueba "PropertyIsLike"
					request2.fail(function (jqXHR, textStatus) {
						//alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
						//Si no hay resultados, hacer la petición con PropertyIsLike
						var filtro = "<Filter><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsLike></Filter>";
						var request3 = $.ajax({
							url: urlServicio,
							type: "GET",
							data: {
								'service': 'WFS',
								'request': 'GetFeature',
								'version': '2.0.0',
								'typeName': consulta.capa,
								'outputFormat': 'geojsonstream',
								'srsName': 'EPSG:4326',
								'filter': filtro
							},
							dataType: "json"
						});
						request3.done(function (data) {
							if (data.features.length > 0) {
								if (valor !== MENSAJES.Seleccionar) {
									añadeAliasCampos(data, consulta.tablaInfo.alias, urlInfoPopup);
									añadeCapaConsulta(data, mapa, consulta);
								}
							} else {
								limpiaConsulta(mapa);
							}
						});
						request3.fail(function (jqXHR, textStatus) {
							alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
						});
					});
				}
			});
		});
		requestMS.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
		});
	} else if (tipoServicio == "GeoJSON") {
		var capa;
		//Es una capa GeoJSON definida en el código como variable
		//En consulta.datos se define el GeoJSON
		if (consulta.servicio.url == "IDEVAPI_Local") {
			if (consulta.servicio.datos !== "") {
				if (window[consulta.servicio.datos] !== undefined) {
					capa = window[servicio];
				} else {
					alert(MENSAJES.GeoJSONNoDefinido);
				}
			}
			//Capa GeoJSON ya añadida al mapa (consulta.servicio.url == "IDEVAPI_CapaExistente")
			//En consulta.datos se define el id. de la capa GeoJSON
		} else {
			$.each(GCapasGeoJSON, function (i) {
				if (GCapasGeoJSON[i].id.split(";")[0] == consulta.servicio.datos) {
					capa = GCapasGeoJSON[i].toGeoJSON();
				}
			});
		}
		//Es una capa GeoJSON en http
		/*if (urlServicio !== "local") {
			$.each(GCapasGeoJSON, function (i) {
				if (GCapasGeoJSON[i].id.split(";")[0] == servicio) {
					capa = GCapasGeoJSON[i].toGeoJSON();
				}
			});
		//Es una capa definida en local con variable
		} else {
			capa = eval(servicio);
		}*/

		//Extrae valores únicos del campo definido en el select
		var valoresUnicos = $.unique(capa.features.map(function (d) {
			return d.properties[consulta.campo];
		}));
		select.options.length = 0;
		if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
		//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;
		/////Almacenamos los valores para guardar el estado inicial de los filtros
		if (!reinicio[mapa.id]) {
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		$(select).on('change.idevapiConsulta', function () {
			var valor = $(this).val();
			reiniciaConsulta(mapa.id, select);
			if (valor != null) {
				//valor = valor.replace(/'/g,"''");
				var resultados = filtroGeoJSON(capa, consulta.campos[0], valor);
				if (resultados.length > 0) {
					añadeCapaConsulta(resultados, mapa, consulta);
				} else {
					limpiaConsulta(mapa);
				}
			}
		});
	} else if (tipoServicio == 'JSON') {

		var scriptFirst = document.createElement('script');
		scriptFirst.type = 'text/javascript';
		scriptFirst.src = './' + urlServicio;
		$('head').append(scriptFirst);
		/*
		var valoresUnicos= $.unique(window[capa].features.map(function (d) {
			return d.properties[campo];
		}));
		*/
		var capa = window[capa];
		function uniq(a) {
			var seen = {};
			return a.filter(function (item) {
				return seen.hasOwnProperty(item) ? false : (seen[item] = true);
			});
		}
		var valoresUnicos = uniq(capa.features.map(function (d) {
			return d.properties[campo];
		}))
		select.options.length = 0;
		if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
		//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;
		/////Almacenamos los valores para guardar el estado inicial de los filtros
		if (!reinicio[mapa.id]) {
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		$(select).on('change.idevapiConsulta', function () {
			var valor = $(this).val();
			reiniciaConsulta(mapa.id, select);
			if (valor != null) {
				var resultados = filtroGeoJSON(capa, consulta.campos[0], valor);
				if (resultados.length > 0) {
					añadeAliasCamposJSON(resultados, tablaInfo.alias);
					añadeCapaConsulta(resultados, mapa, consulta);
				} else {
					limpiaConsulta(mapa);
				}
			}
		});
	}
}
/*  CONSULTA ANIDADA *****************************************************************/
//Preparan los selects: rellena con datos y crea la función al seleccionar elemento y hacer consulta
//function preparaConsultaMultiSelect (select,mapa,selectsSecundarios,numSelects,servicio,capa,campos,tablaInfo,anyadeCapa,urlIcono,animacion,activarZoom){
function preparaConsultaMultiSelect(select, mapa, selectsSecundarios, numSelects, consulta) {
	//En caso de ser el primer select de un mapa, inicializar las varibles
	if (selectAGSByMap[mapa.id] == undefined) { selectAGSByMap[mapa.id] = [] }
	if (selectMSJsonByMap[mapa.id] == undefined) { selectMSJsonByMap[mapa.id] = [] }
	if (selectSecundarioByMap[mapa.id] == undefined) { selectSecundarioByMap[mapa.id] = [] }
	if (dataAGSByMap[mapa.id] == undefined) { dataAGSByMap[mapa.id] = [] }
	if (camposAGSByMap[mapa.id] == undefined) { camposAGSByMap[mapa.id] = [] }
	if (dataMsJsonByMap[mapa.id] == undefined) { dataMsJsonByMap[mapa.id] = [] }
	if (reinicio[mapa.id] == undefined) { reinicio[mapa.id] = false }

	var urlServicio = consulta.servicio.url;
	var tipoServicio = consulta.servicio.origen;
	consulta.urlInfoPopup = urlServicio;
	//var urlInfoPopup = urlServicio;
	if (numSelects >= 2) {
		var IDEVAPISelect2 = selectsSecundarios[0];
	}
	if (numSelects == 3) {
		var IDEVAPISelect3 = selectsSecundarios[1];
	}
	/////////////////////////////////////////// CAPAS ARCGIS SERVER //////////////////////////////////////////////////////
	if (tipoServicio == "AGS") {
		urlServicio = urlServicio.replace("/arcgis/services/", "/arcgis/rest/services/").replace("/MapServer/WMSServer", "/MapServer/");
		urlServicio = urlServicio + consulta.capa;
		var consultaRestGET = "where=1=1&outFields=" + consulta.campos[0] + "&returnGeometry=false&retu" + "rnDistinctValues=true&orderByFields=" + consulta.campos[0] + "&f=json";
		var consultaRest = urlServicio + "/query?" + consultaRestGET;
		var requestAGS = $.ajax({ url: encodeURI(consultaRest), type: "GET" });
		requestAGS.done(function (data) {
			select.options.length = 0;
			if ($(select).attr("data-select2-id") !== undefined) {
				$(select).attr("placeholder", MENSAJES.Seleccionar);
			} else {
				select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			}
			//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < data.features.length; j++) {
				var valor0 = data.features[j].attributes[consulta.campos[0]];
				select.appendChild(new Option(valor0, valor0));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if (!reinicio[mapa.id]) {
				selectAGSByMap[mapa.id].push(select);
				dataAGSByMap[mapa.id].push(data);
				camposAGSByMap[mapa.id].push(consulta.campos[0]);
			}
			if (IDEVAPISelect2 !== undefined) {
				IDEVAPISelect2.options.length = 0;
				IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, ""));
				IDEVAPISelect2.disabled = true;
			}
			if (IDEVAPISelect3 !== undefined) {
				IDEVAPISelect3.options.length = 0;
				IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
				IDEVAPISelect3.disabled = true;
			}
			if (!reinicio[mapa.id]) {
				selectSecundarioByMap[mapa.id].push(IDEVAPISelect2);
				selectSecundarioByMap[mapa.id].push(IDEVAPISelect3);
			}
			$(select).on('change.idevapiConsulta', function () {
				if (IDEVAPISelect2 !== undefined) {
					IDEVAPISelect2.options.length = 0;
				}
				if (IDEVAPISelect3 !== undefined) {
					IDEVAPISelect3.options.length = 0;
					IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
					IDEVAPISelect3.disabled = true;
				}
				reiniciaConsulta(mapa.id, select);
				var valor0 = $(this).val();
				if (valor0 !== null) {
					valor0 = valor0.replace(/'/g, "''");
					var consultaRest2GET = "where=" + consulta.campos[0] + "='" + valor0 + "'&outFields=" + consulta.campos[1] + "&returnGeometry=false&returnDistinctValues=true&orderByFields=" + consulta.campos[1] + "&f=geojson";
					var consultaRest2 = urlServicio + "/query?" + consultaRest2GET;
					var request2 = $.ajax({ url: encodeURI(consultaRest2), type: "GET" });
					request2.done(function (data2) {
						//RELLENA 2º SELECT (CON 1 WHERE)
						IDEVAPISelect2.options.length = 0;
						if ($(IDEVAPISelect2).attr("data-select2-id") !== undefined) {
							$(IDEVAPISelect2).attr("placeholder", MENSAJES.Seleccionar);
							IDEVAPISelect2.appendChild(new Option("", ""));
						} else {
							IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
						}
						for (var j = 0; j < data2.features.length; j++) {
							var valor1 = data2.features[j].properties[consulta.campos[1]];
							IDEVAPISelect2.appendChild(new Option(valor1, valor1));
						}
						IDEVAPISelect2.value = MENSAJES.Seleccionar;
						IDEVAPISelect2.disabled = false;
						//Cambio del Select 2
						$(IDEVAPISelect2).off('change.idevapiConsulta');
						$(IDEVAPISelect2).on('change.idevapiConsulta', function () {
							var valor1 = $(this).val();
							if (valor1 !== null) {
								valor1 = valor1.replace(/'/g, "''");
								// ///////////////////////////////////// 2 SELECTS ///////////////////////////////////////////////
								if (numSelects == 2) {
									var consultaRest_2SGET = "where=" + consulta.campos[0] + "='" + valor0 + "' AND " + consulta.campos[1] + "='" + valor1 + "'&outFields=*&returnGeometry=true&orderByFields=" + consulta.campos[1] + "&f=geojson";
									var consultaRest_2S = urlServicio + "/query?" + consultaRest_2SGET;
									var request1_2S = $.ajax({ url: encodeURI(consultaRest_2S), type: "GET" });
									request1_2S.done(function (data1_2S) {
										if (data1_2S.features.length > 0) {
											añadeAliasCampos(data1_2S, consulta.tablaInfo.alias, consulta.urlInfoPopup);
											añadeCapaConsulta(data1_2S, mapa, consulta);
										} else {
											limpiaConsulta(mapa);
										}
									});
									request1_2S.fail(function (jqXHR, textStatus) {
										alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
									});
									/////////////////////////////////////// 3 SELECTS ///////////////////////////////////////////////
								} else if (numSelects == 3) {
									if (IDEVAPISelect3 !== undefined) {
										IDEVAPISelect3.options.length = 0;
									}
									var consulta2_3S = "where=" + consulta.campos[0] + "='" + valor0 + "' AND " + consulta.campos[1] + "='" + valor1 + "'&outFields=" + consulta.campos[2] + "&returnDistinctValues=true&orderByFields=" + consulta.campos[2] + "&returnGeometry=false&f=geojson";
									var consultaRest_3S = urlServicio + "/query?" + consulta2_3S;
									var request3_3S = $.ajax({ url: encodeURI(consultaRest_3S), type: "GET" });
									request3_3S.done(function (data3) {
										//RELLENA 3er SELECT (CON 2 WHERE)
										IDEVAPISelect3.options.length = 0;
										if ($(IDEVAPISelect3).attr("data-select2-id") !== undefined) { $(IDEVAPISelect3).attr("placeholder", MENSAJES.Seleccionar); } else { IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
										for (var k = 0; k < data3.features.length; k++) {
											var valor2 = data3.features[k].properties[consulta.campos[2]];
											IDEVAPISelect3.appendChild(new Option(valor2, valor2));
										}
										IDEVAPISelect3.value = MENSAJES.Seleccionar;
										IDEVAPISelect3.disabled = false;
										//Cambio del Select 3
										$(IDEVAPISelect3).off('change.idevapiConsulta');
										$(IDEVAPISelect3).on('change.idevapiConsulta', function () {
											var valor2 = $(this).val();
											if (valor2 !== null) {
												valor2 = valor2.replace(/'/g, "''");
												var consulta4_3SGET = "where=" + consulta.campos[0] + "='" + valor0 + "' AND " + consulta.campos[1] + "='" + valor1 + "' AND " + consulta.campos[2] + "='" + valor2 + "'&outFields=*&returnGeometry=true&f=geojson";
												var consultaRest4_3S = urlServicio + "/query?" + consulta4_3SGET;
												var request4_3S = $.ajax({ url: encodeURI(consultaRest4_3S), type: "GET" });
												request4_3S.done(function (data4) {
													if (data4.features.length > 0) {
														añadeAliasCampos(data4, consulta.tablaInfo.alias, consulta.urlInfoPopup);
														añadeCapaConsulta(data4, mapa, consulta);
													} else {
														limpiaConsulta(mapa);
													}
												});
												request4_3S.fail(function (jqXHR, textStatus) {
													alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
												});
											}
										});
									});
									request3_3S.fail(function (jqXHR, textStatus) {
										alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
									});
								}
							} else {
								if (IDEVAPISelect3 !== undefined) {
									IDEVAPISelect3.options.length = 0;
									IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
									IDEVAPISelect3.disabled = true;
								}
							}
						});
					});
					request2.fail(function (jqXHR, textStatus) {
						alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
					});
				} else {
					IDEVAPISelect2.options.length = 0;
					IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, ""));
					IDEVAPISelect2.disabled = true;
					if (IDEVAPISelect3 !== undefined) {
						IDEVAPISelect3.options.length = 0;
						IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
						IDEVAPISelect3.disabled = true;
					}
				}
			});
		});
		requestAGS.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
		});
		///////////////////////////////////////// CAPAS MAP SERVER /////////////////////////////////////////////////////////////
	} else if (tipoServicio == "MS") {
		var requestMS_1 = $.ajax({
			url: urlServicio,
			type: "GET",
			data: {
				'service': 'WFS',
				'request': 'GetPropertyValue',
				'version': '2.0.0',
				'typeNames': consulta.capa,
				'valueReference': consulta.campos[0],
			},
			dataType: "xml"
		});

		requestMS_1.done(function (dataMS_1) {
			var dataFiltradaMS_1 = [];
			//////////Tratamiento de respuesta XML/////////////
			var elementosMS_1 = dataMS_1.getElementsByTagName('ms:' + consulta.campos[0]);
			for (i = 0; i < elementosMS_1.length; i++) {
				var textoMS_1 = normalizaValorConsulta(elementosMS_1[i].textContent);
				if (textoMS_1 && dataFiltradaMS_1.indexOf(textoMS_1) == -1) {
					dataFiltradaMS_1.push(textoMS_1);
				}
			}
			dataFiltradaMS_1.sort();
			//////////Tratamiento de respuesta JSON///////////
			select.options.length = 0;
			if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); select.appendChild(new Option("", "")); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
			//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < dataFiltradaMS_1.length; j++) {
				var valor = dataFiltradaMS_1[j];
				select.appendChild(new Option(valor, valor));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if (!reinicio[mapa.id]) {
				selectMSJsonByMap[mapa.id].push(select);
				dataMsJsonByMap[mapa.id].push(dataFiltradaMS_1);
			}
			if (IDEVAPISelect2 !== undefined) {
				IDEVAPISelect2.options.length = 0;
				IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, ""));
				IDEVAPISelect2.disabled = true;
			}
			if (IDEVAPISelect3 !== undefined) {
				IDEVAPISelect3.options.length = 0;
				IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
				IDEVAPISelect3.disabled = true;
			}
			//Cambio del Select 1
			if (!reinicio[mapa.id]) {
				selectSecundarioByMap[mapa.id].push(IDEVAPISelect2);
				selectSecundarioByMap[mapa.id].push(IDEVAPISelect3);
			}
			$(select).on('change.idevapiConsulta', function () {
				if (IDEVAPISelect2 !== undefined) {
					IDEVAPISelect2.options.length = 0;
				}
				if (IDEVAPISelect3 !== undefined) {
					IDEVAPISelect3.options.length = 0;
					IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
					IDEVAPISelect3.disabled = true;
				}
				var valor0 = normalizaValorConsulta($(this).val());
				reiniciaConsulta(mapa.id, select);
				if (valor0 !== null && valor0 !== '') {
					var filtroMS_2 = "<Filter><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo></Filter>";
					var requestMS_2 = $.ajax({
						url: urlServicio,
						type: "GET",
						data: {
							'service': 'WFS',
							'request': 'GetPropertyValue',
							'version': '2.0.0',
							'typeNames': consulta.capa,
							'valueReference': consulta.campos[1],
							'filter': filtroMS_2
						},
						dataType: "xml"
					});

					requestMS_2.done(function (dataMS_2) {
						var dataFiltradaMS_2 = [];
						//////////Tratamiento de respuesta XML/////////////
						var elementosMS_2 = dataMS_2.getElementsByTagName('ms:' + consulta.campos[1]);
						for (i = 0; i < elementosMS_2.length; i++) {
							var textoMS_2 = normalizaValorConsulta(elementosMS_2[i].textContent);
							if (textoMS_2 && dataFiltradaMS_2.indexOf(textoMS_2) == -1) {
								dataFiltradaMS_2.push(textoMS_2);
							}
						}
						dataFiltradaMS_2.sort();
						//////////Tratamiento de respuesta JSON/////////////
						IDEVAPISelect2.options.length = 0;
						if ($(IDEVAPISelect2).attr("data-select2-id") !== undefined) { $(IDEVAPISelect2).attr("placeholder", MENSAJES.Seleccionar); IDEVAPISelect2.appendChild(new Option("", "")); } else { IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
						// IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar,
						// MENSAJES.Seleccionar));
						for (var j = 0; j < dataFiltradaMS_2.length; j++) {
							var valor = dataFiltradaMS_2[j];
							IDEVAPISelect2.appendChild(new Option(valor, valor));
						}
						IDEVAPISelect2.value = MENSAJES.Seleccionar;
						IDEVAPISelect2.disabled = false;
						$(IDEVAPISelect2).trigger('change');
						//Cambio del Select 2
						$(IDEVAPISelect2).off('change.idevapiConsulta');
						$(IDEVAPISelect2).on('change.idevapiConsulta', function () {
							var valor1 = normalizaValorConsulta($(this).val());
							if (valor1 !== null && valor1 !== '') {
								if ($(this).attr("data-select2-id") !== undefined) { $(this).trigger('change.select2'); }
								/////////////////////////////////////// 2 SELECTS /////////////////////////////////////////////////
								if (IDEVAPISelect3 !== undefined) {
									IDEVAPISelect3.options.length = 0;
								}
								if (numSelects == 2) {
									var filtro = "<Filter><And><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + consulta.campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo></And></Filter>";
									var request1_2S = $.ajax({
										url: urlServicio,
										type: "GET",
										data: {
											'service': 'WFS',
											'request': 'GetFeature',
											'version': '2.0.0',
											'typeName': consulta.capa,
											'outputFormat': 'geojsonstream',
											'srsName': 'EPSG:4326',
											'filter': filtro
										},
										dataType: "json"
									});
									request1_2S.done(function (data1_2S) {
										if (data1_2S.features.length > 0) {
											añadeAliasCampos(data1_2S, consulta.tablaInfo.alias, consulta.urlInfoPopup);
											añadeCapaConsulta(data1_2S, mapa, consulta);
										} else {
											var valor1Like = escapaValorLikeWFS(valor1) + "*";
											var filtroLike2S = "<Filter><And><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[1] + "</PropertyName><Literal>" + valor1Like + "</Literal></PropertyIsLike></And></Filter>";
											var request1_2S_like = $.ajax({
												url: urlServicio,
												type: "GET",
												data: {
													'service': 'WFS',
													'request': 'GetFeature',
													'version': '2.0.0',
													'typeName': consulta.capa,
													'outputFormat': 'geojsonstream',
													'srsName': 'EPSG:4326',
													'filter': filtroLike2S
												},
												dataType: "json"
											});
											request1_2S_like.done(function (data1_2S_like) {
												if (data1_2S_like.features.length > 0) {
													añadeAliasCampos(data1_2S_like, consulta.tablaInfo.alias, consulta.urlInfoPopup);
													añadeCapaConsulta(data1_2S_like, mapa, consulta);
												} else {
													limpiaConsulta(mapa);
												}
											});
											request1_2S_like.fail(function () { limpiaConsulta(mapa); });
										}
									});
									request1_2S.fail(function (jqXHR, textStatus) {
										alert(
											MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus
										);
									});
									/////////////////////////////////////// 3 SELECTS /////////////////////////////////////////////////
								} else if (numSelects == 3 && $(this).val() != MENSAJES.Seleccionar) {
									if (IDEVAPISelect3 !== undefined) {
										IDEVAPISelect3.options.length = 0;
									}
									var filtroMS_3 = "<Filter><And><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + consulta.campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo></And></Filter>";
									var requestMS_3 = $.ajax({
										url: urlServicio,
										type: "GET",
										data: {
											'service': 'WFS',
											'request': 'GetPropertyValue',
											'version': '2.0.0',
											'typeNames': consulta.capa,
											'valueReference': consulta.campos[2],
											'filter': filtroMS_3
										},
										dataType: "xml"
									});

									requestMS_3.done(function (dataMS_3) {
										var dataFiltradaMS_3 = [];
										//////////Tratamiento de respuesta XML/////////////
										var elementosMS_3 = dataMS_3.getElementsByTagName('ms:' + consulta.campos[2]);
										for (i = 0; i < elementosMS_3.length; i++) {
											var textoMS_3 = normalizaValorConsulta(elementosMS_3[i].textContent);
											if (textoMS_3 && dataFiltradaMS_3.indexOf(textoMS_3) == -1) {
												dataFiltradaMS_3.push(textoMS_3);
											}
										}
										dataFiltradaMS_3.sort();
										//////////Tratamiento de respuesta JSON/////////////
										IDEVAPISelect3.options.length = 0;
										if ($(IDEVAPISelect3).attr("data-select2-id") !== undefined) { $(IDEVAPISelect3).attr("placeholder", MENSAJES.Seleccionar); IDEVAPISelect3.appendChild(new Option("", "")); } else { IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
										// IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar,
										// MENSAJES.Seleccionar));
										for (var j = 0; j < dataFiltradaMS_3.length; j++) {
											var valor = dataFiltradaMS_3[j];
											IDEVAPISelect3.appendChild(new Option(valor, valor));
										}
										IDEVAPISelect3.value = MENSAJES.Seleccionar;
										IDEVAPISelect3.disabled = false;
										//Cambio del Select 3
										$(IDEVAPISelect3).off('change.idevapiConsulta');
										$(IDEVAPISelect3).on('change.idevapiConsulta', function () {
											var valor2 = normalizaValorConsulta($(this).val());
											if (valor2 != null && valor2 !== '') {
												if ($(this).attr("data-select2-id") !== undefined) { $(this).trigger('change.select2'); }
												var filtro = "<Filter><And><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + consulta.campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + consulta.campos[2] + "</PropertyName><Literal>" + valor2 + "</Literal></PropertyIsEqualTo></And></Filter>";
												var request4_3S = $.ajax({
													url: urlServicio,
													type: "GET",
													data: {
														'service': 'WFS',
														'request': 'GetFeature',
														'version': '2.0.0',
														'typeName': consulta.capa,
														'outputFormat': 'geojsonstream',
														'srsName': 'EPSG:4326',
														'filter': filtro
													},
													dataType: "json"
												});
												request4_3S.done(function (data4) {
													if (data4.features.length > 0) {
														añadeAliasCampos(data4, consulta.tablaInfo.alias, consulta.urlInfoPopup);
														añadeCapaConsulta(data4, mapa, consulta);
													} else {
														var valor2Like = escapaValorLikeWFS(valor2) + "*";
														var filtroLike3S = "<Filter><And><PropertyIsEqualTo><PropertyName>" + consulta.campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + consulta.campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo><PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + consulta.campos[2] + "</PropertyName><Literal>" + valor2Like + "</Literal></PropertyIsLike></And></Filter>";
														var request4_3S_like = $.ajax({
															url: urlServicio,
															type: "GET",
															data: {
																'service': 'WFS',
																'request': 'GetFeature',
																'version': '2.0.0',
																'typeName': consulta.capa,
																'outputFormat': 'geojsonstream',
																'srsName': 'EPSG:4326',
																'filter': filtroLike3S
															},
															dataType: "json"
														});
														request4_3S_like.done(function (data4_like) {
															if (data4_like.features.length > 0) {
																añadeAliasCampos(data4_like, consulta.tablaInfo.alias, consulta.urlInfoPopup);
																añadeCapaConsulta(data4_like, mapa, consulta);
															} else {
																limpiaConsulta(mapa);
															}
														});
														request4_3S_like.fail(function () { limpiaConsulta(mapa); });
													}
												});
												request4_3S.fail(function (jqXHR, textStatus) {
													alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
												});
											}
										});
									});
									requestMS_3.fail(function (jqXHR, textStatus) {
										alert(
											MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus
										);
									});
								}
							} else {
								if (IDEVAPISelect3 !== undefined) {
									IDEVAPISelect3.options.length = 0;
									IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
									IDEVAPISelect3.disabled = true;
								}
							}
						});
					});
					requestMS_2.fail(function (jqXHR, textStatus) {
						alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
					});
				} else {
					IDEVAPISelect2.options.length = 0;
					IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, ""));
					IDEVAPISelect2.disabled = true;
					if (IDEVAPISelect3 !== undefined) {
						IDEVAPISelect3.options.length = 0;
						IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, ""));
						IDEVAPISelect3.disabled = true;
					}
				}
			});
		});
		requestMS_1.fail(function (jqXHR, textStatus) {
			alert(MENSAJES.PeticionFallida + consulta.capa + ", " + consulta.campos[0] + ". Error:" + textStatus);
		});
		///////////////////////////////////////////////// CAPAS GEOJSON //////////////////////////////////////////////////////////
	} else if (tipoServicio == "GeoJSON") {
		var capaGJ;
		//Es una capa GeoJSON definida en el código como variable
		//En consulta.datos se define el GeoJSON
		if (consulta.servicio.url == "IDEVAPI_Local") {
			if (consulta.servicio.datos !== "") {
				if (window[consulta.servicio.datos] !== undefined) {
					capaGJ = window[servicio];
				} else {
					alert(MENSAJES.GeoJSONNoDefinido);
				}
			}
			//Capa GeoJSON ya añadida al mapa (consulta.servicio.url == "IDEVAPI_CapaExistente")
			//En consulta.datos se define el id. de la capa GeoJSON
		} else {
			$.each(GCapasGeoJSON, function (i) {
				if (GCapasGeoJSON[i].id.split(";")[0] == consulta.servicio.datos) {
					capaGJ = GCapasGeoJSON[i].toGeoJSON();
				}
			});
		}
		/*
		//Es una capa GeoJSON en http
		if (urlServicio !== "local") {
			$.each(GCapasGeoJSON, function (i) {
				if (GCapasGeoJSON[i].id.split(";")[0] == consulta.servicio) {
					capa = GCapasGeoJSON[i].toGeoJSON();
				}
			});
		//Es una capa definida en local con variable
		} else {
			capa = eval(consulta.servicio);
		}*/
		//////// PRIMER FILTRO ////////////////////////////////
		//Extrae valores únicos del campo definido en el select
		var valoresUnicos = $.unique(capaGJ.features.map(function (d) {
			return d.properties[campos[0]];
		}));
		if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
		//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;
		/////Almacenamos los valores para guardar el estado inicial de los filtros
		if (!reinicio[mapa.id]) {
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		//SELECCIÓN SELECT 1
		if (IDEVAPISelect2 !== undefined) { IDEVAPISelect2.options.length = 0; IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect2.disabled = true; }
		if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
		if (!reinicio[mapa.id]) {
			selectSecundarioByMap[mapa.id].push(IDEVAPISelect2);
			selectSecundarioByMap[mapa.id].push(IDEVAPISelect3);
		}
		$(select).on('change.idevapiConsulta', function () {
			if (IDEVAPISelect2 !== undefined) { IDEVAPISelect2.options.length = 0; }
			if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
			var valor = $(this).val();
			reiniciaConsulta(mapa.id, select);
			//valor = valor.replace(/'/g,"''");
			if (valor !== null) {
				var resultados = filtroGeoJSON(capaGJ, consulta.campos[0], valor);
				var valoresUnicos1 = $.unique(resultados.map(function (d) {
					return d.properties[consulta.campos[1]];
				}));
				//RELLENA 2º SELECT
				IDEVAPISelect2.options.length = 0;
				if ($(IDEVAPISelect2).attr("data-select2-id") !== undefined) { $(IDEVAPISelect2).attr("placeholder", MENSAJES.Seleccionar); } else { IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
				//IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
				for (var j = 0; j < valoresUnicos1.length; j++) {
					var valor = valoresUnicos1[j];
					IDEVAPISelect2.appendChild(new Option(valor, valor));
				}
				IDEVAPISelect2.value = MENSAJES.Seleccionar;
				IDEVAPISelect2.disabled = false;
				//Cambio del Select 2
				$(IDEVAPISelect2).off('change.idevapiConsulta');
				//SELECCIÓN SELECT 2
				$(IDEVAPISelect2).on('change.idevapiConsulta', function () {
					var valor1 = $(this).val();
					if (valor1 !== null) {
						//valor1 = valor1.replace(/'/g,"''");
						//******* SEGUNDO FILTRO ******Extrae valores únicos del campo definido en el select
						var resultados2 = filtroGeoJSON(capaGJ, consulta.campos[1], valor1);
						/////////////////////////////////////// 2 SELECTS /////////////////////////////////////////////////
						if (numSelects == 2) {
							if (resultados2.length > 0) {
								añadeCapaConsulta(resultados2, mapa, consulta);
							} else {
								limpiaConsulta(mapa);
							}
							/////////////////////////////////////// 3 SELECTS /////////////////////////////////////////////////
						} else if (numSelects == 3) {
							if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; }
							var valoresUnicos2 = $.unique(resultados2.map(function (d) {
								return d.properties[consulta.campos[2]];
							}));
							//RELLENA 3er SELECT (CON 2 WHERE)
							IDEVAPISelect3.options.length = 0;
							if ($(IDEVAPISelect3).attr("data-select2-id") !== undefined) { $(IDEVAPISelect3).attr("placeholder", MENSAJES.Seleccionar); } else { IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
							//IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, ""));
							for (var j = 0; j < valoresUnicos2.length; j++) {
								var valor2 = valoresUnicos2[j];
								IDEVAPISelect3.appendChild(new Option(valor2, valor2));
							}
							IDEVAPISelect3.value = MENSAJES.Seleccionar;
							IDEVAPISelect3.disabled = false;
							//Cambio del Select 3
							$(IDEVAPISelect3).off('change.idevapiConsulta');
							//SELECCIÓN SELECT 3
							$(IDEVAPISelect3).on('change.idevapiConsulta', function () {
								var valor2 = $(this).val();
								if (valor2 != null) {
									//valor2 = valor2.replace(/'/g,"''");
									///////////////////// TERCER FILTRO ////////////////////
									//Extrae valores únicos del campo definido en el select
									var resultados3 = filtroGeoJSON(capaGJ, consulta.campos[2], valor2);
									if (resultados3.length > 0) {
										añadeCapaConsulta(resultados3, mapa, consulta);
									} else {
										limpiaConsulta(mapa);
									}
								}
							});
						}
					} else {
						if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
					}
				});
			} else {
				IDEVAPISelect2.options.length = 0; IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect2.disabled = true;
				if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
			}
		});
	} else if (tipoServicio == 'JSON') {
		var scriptFirst = document.createElement('script');
		scriptFirst.type = 'text/javascript';
		scriptFirst.src = './' + urlServicio;
		$('head').append(scriptFirst);
		//////////////// PRIMER FILTRO //////////////////
		//Extrae valores únicos del campo definido en el select
		var capaGJ = window[consulta.capa];
		function uniq(a) {
			var seen = {};
			return a.filter(function (item) {
				return seen.hasOwnProperty(item) ? false : (seen[item] = true);
			});
		}
		var valoresUnicos = uniq(capaGJ.features.map(function (d) {
			return d.properties[consulta.campos[0]];
		}));
		if ($(select).attr("data-select2-id") !== undefined) { $(select).attr("placeholder", MENSAJES.Seleccionar); } else { select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
		//select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;
		/////Almacenamos los valores para guardar el estado inicial de los filtros
		if (!reinicio[mapa.id]) {
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		//SELECCIÓN SELECT 1
		if (IDEVAPISelect2 !== undefined) { IDEVAPISelect2.options.length = 0; IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect2.disabled = true; }
		if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
		if (!reinicio[mapa.id]) {
			selectSecundarioByMap[mapa.id].push(IDEVAPISelect2);
			selectSecundarioByMap[mapa.id].push(IDEVAPISelect3);
		}
		$(select).on('change.idevapiConsulta', function () {
			if (IDEVAPISelect2 !== undefined) { IDEVAPISelect2.options.length = 0; }
			if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
			var valor = $(this).val();
			reiniciaConsulta(mapa.id, select);
			//valor = valor.replace(/'/g,"''");
			if (valor !== null) {
				var resultados = filtroGeoJSON(capaGJ, consulta.campos[0], valor);
				var valoresUnicos1 = uniq(resultados.map(function (d) {
					return d.properties[consulta.campos[1]];
				}));
				//RELLENA 2º SELECT
				IDEVAPISelect2.options.length = 0;
				if ($(IDEVAPISelect2).attr("data-select2-id") !== undefined) { $(IDEVAPISelect2).attr("placeholder", MENSAJES.Seleccionar); } else { IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
				//IDEVAPISelect2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
				for (var j = 0; j < valoresUnicos1.length; j++) {
					var valor = valoresUnicos1[j];
					IDEVAPISelect2.appendChild(new Option(valor, valor));
				}
				IDEVAPISelect2.value = MENSAJES.Seleccionar;
				IDEVAPISelect2.disabled = false;
				//Cambio del Select 2
				$(IDEVAPISelect2).off('change.idevapiConsulta');
				//SELECCIÓN SELECT 2
				$(IDEVAPISelect2).on('change.idevapiConsulta', function () {
					var valor1 = $(this).val();
					if (valor1 !== null) {
						//valor1 = valor1.replace(/'/g,"''");
						//******* SEGUNDO FILTRO ******Extrae valores únicos del campo definido en el select
						var resultados2 = filtroGeoJSON(resultados, consulta.campos[1], valor1);
						//************************* 2 SELECTS *****************************************************************/
						if (numSelects == 2) {
							if (resultados2.length > 0) {
								añadeCapaConsulta(resultados2, mapa, consulta);
							} else {
								limpiaConsulta(mapa);
							}
							//************************* 3 SELECTS ******************************************************************/
						} else if (numSelects == 3) {
							if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; }
							var valoresUnicos2 = uniq(resultados2.map(function (d) {
								return d.properties[consulta.campos[2]];
							}));
							//RELLENA 3er SELECT (CON 2 WHERE)
							IDEVAPISelect3.options.length = 0;
							if ($(IDEVAPISelect3).attr("data-select2-id") !== undefined) { $(IDEVAPISelect3).attr("placeholder", MENSAJES.Seleccionar); IDEVAPISelect3.appendChild(new Option("", "")); } else { IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar)); }
							//IDEVAPISelect3.appendChild(new Option(MENSAJES.Seleccionar, ""));
							for (var j = 0; j < valoresUnicos2.length; j++) {
								var valor2 = valoresUnicos2[j];
								IDEVAPISelect3.appendChild(new Option(valor2, valor2));
							}
							IDEVAPISelect3.value = MENSAJES.Seleccionar;
							IDEVAPISelect3.disabled = false;
							//Cambio del Select 3
							$(IDEVAPISelect3).off('change.idevapiConsulta');
							//SELECCIÓN SELECT 3
							$(IDEVAPISelect3).on('change.idevapiConsulta', function () {
								var valor2 = $(this).val();
								//valor2 = valor2.replace(/'/g,"''");
								//******* TERCER FILTRO ******Extrae valores únicos del campo definido en el select
								var resultados3 = filtroGeoJSON(resultados2, consulta.campos[2], valor2);
								if (resultados3.length > 0) {
									añadeCapaConsulta(resultados3, mapa, consulta);
								} else {
									limpiaConsulta(mapa);
								}
							});
						}
					} else {
						if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
					}
				});
			} else {
				IDEVAPISelect2.options.length = 0; IDEVAPISelect2.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect2.disabled = true;
				if (IDEVAPISelect3 !== undefined) { IDEVAPISelect3.options.length = 0; IDEVAPISelect3.appendChild(new Option(MENSAJES.Esperando, "")); IDEVAPISelect3.disabled = true; }
			}
		});
	}
}

function anyadeConsultaClick(mapa, capaConsultaMunicipio) {
	//Remarcar limite municipio al hacer Click
	urlConsultaMunicipio = "https://carto.icv.gva.es/arcgis/rest/services/covid19/mes5000hab/MapServer/1/query?";
	mapa.on('click', function (ev) {
		var latlng = mapa.mouseEventToLatLng(ev.originalEvent);
		consultaRest = urlConsultaMunicipio + "geometry=" + latlng.lng + "," + latlng.lat + "&geometryType=esriGeometryPoint&inSR=4326&f=geoJSON";
		var request = $.ajax({
			url: encodeURI(consultaRest)
		});
		request.done(function (data) {
			/*if (data[0] !== undefined) {
				var datos = data[0];
			} else if (data.features[0] !== undefined) {
				var datos = data.features[0];
			} else {
				var datos = "";
			}*/
			if (capaConsultaMunicipio !== null) {
				mapa.removeLayer(capaConsultaMunicipio);
			}
			capaConsultaMunicipio = new L.geoJson(data, {
				style: estiloConsulta,
				onEachFeature: onEachFeature,
				interactive: false
				//pane: 'consulta'
			});
			capaConsultaMunicipio.id = "capaConsultaMunicipio;";
			//var capaConsultaG = new L.featureGroup([capaConsulta]);
			capaConsultaMunicipio.addTo(mapa);
		})
	});
}

