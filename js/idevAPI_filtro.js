//Variables necesarias para devolver los filtros a su valor por defecto
//Al existir la posibilidad de multiples mapas, cada variable debe contener un valor para cada mapa id
var dataAGSByMap = {};
var dataMsJsonByMap = {};
var selectAGSByMap = {};
var selectMSJsonByMap = {};
var selectSecundarioByMap = {};
var camposAGSByMap = {};
var reinicio = {};
var capasIniciales = {};
var cargaInicial = {};
var capasARecargar = {};
var auxLeyenda = {};

////////////////// FILTROS ////////////////////////////////////////////////
function rellenaFiltros(id,mapa,filtros) {
	filtros.forEach(function(filtro){
		var selectsSecundarios = [];
		var selects = filtro.selects;
		var numSelects = filtro.selects.length;
		if (numSelects > 3) {
			alert(MENSAJES.NivelConsultas)
		}
		var IDEVAPISelect1 = $('#' + selects[0]);
		if (IDEVAPISelect1.length < 1){
			alert(MENSAJES.SelectDesconocido + selects[0]);
			return true;
		}
		IDEVAPISelect1 = IDEVAPISelect1[0];
		if (numSelects > 1) {
			if(numSelects >= 2){
				var IDEVAPISelect2 = $('#' + selects[1]);
				if (IDEVAPISelect2.length < 1){
					alert(MENSAJES.SelectDesconocido + selects[1]);
					return true;
				}
				IDEVAPISelect2 = IDEVAPISelect2[0];
				selectsSecundarios.push(IDEVAPISelect2);
			}
			if(numSelects == 3){
				var IDEVAPISelect3 = $('#' + selects[2]);
				if (IDEVAPISelect3.length < 1){
					alert(MENSAJES.SelectDesconocido + selects[2]);
					return true;
				}
				IDEVAPISelect3 = IDEVAPISelect3[0];
				selectsSecundarios.push(IDEVAPISelect3);
			}
		}
		var servicioId = filtro.servicioId.replace(/\s+/g, '');
		if (servicioId.split(',')[0] == 'externo' || servicioId.split(',')[0] == 'archivo' || capasIDEV[servicioId] !== undefined) {	//HAY servicio definido para realizar la consulta
			var capaId = filtro.capaId;
			var campos = filtro.campos;
			var muestraInfo = filtro.mostrarInfo;
			if(filtro.anyadirAMapa == undefined){var anyadeCapa = true;} else {var anyadeCapa = filtro.anyadirAMapa;}
			var aliasCampos = filtro.aliasCampos;
			if ((aliasCampos !== undefined) && (aliasCampos !== "")) {
				try {
					aliasCampos = JSON.parse(aliasCampos);
				} catch (e) {
					alert(MENSAJES.ErrorAlias + servicioId);
				}
			}
			if(filtro.animacion == undefined){var animacion = true;} else {var animacion = filtro.animacion;}
			if(filtro.zoom == undefined){
				var zoom = true;
			} else {
				var zoom = filtro.zoom;
			}
			var urlIcono = filtro.urlIcono;
			if (numSelects == 1) {
				preparaFiltroSelect(IDEVAPISelect1,mapa,servicioId,capaId,campos,muestraInfo,anyadeCapa,aliasCampos,urlIcono);
			} else {
				preparaFiltroMultiSelect(IDEVAPISelect1,mapa,selectsSecundarios,numSelects,servicioId,capaId,campos,muestraInfo,anyadeCapa,aliasCampos,urlIcono);
			}
		} else {
			alert(MENSAJES.SelectSimpleDesconocido);
		}
	});
}

//Añade valores alias de los campos en el objeto data.features
function añadeAliasCamposFiltro (data,aliasCampos,urlInfoPopup) {
	if ((aliasCampos !== undefined) && (aliasCampos !=="")) {
		for (var i in data.features) {
			var feat = data.features[i];
			var objAlias = {}
			for (var j in aliasCampos) {

				var aliasCamposV = aliasCampos[j].split(";");
				var alias = "";
				if (aliasCamposV.length > 1) {
					if (IDEVAPI_global.idioma == "va") {alias = aliasCamposV[1];} else if (IDEVAPI_global.idioma == "es") {alias = aliasCamposV[0];} else {if (aliasCamposV[2] !== undefined) {alias = aliasCamposV[2];}}
				} else {
					alias = aliasCampos[j];
				}
				var nombreA = alias;
				//El campo cabecraPopup define el titulo a mostrar en el Popup
				if(j == "tituloCapa"){
					feat.tituloCapa = nombreA;
				} else {
					var valor = feat.properties[j];
					objAlias[nombreA] = valor;
				}
			}
			feat.urlCapa = urlInfoPopup;
			feat.propertiesAlias = objAlias;
		}
	}
}

//Añade la capa de consulta a partir de un geoJSON quue recibe en "data".
//Muestra info del elemento si es "true" y es un sólo elemento.
function añadeCapaConsultaFiltro (data,muestraInfo,anyadeCapa,urlIcono,mapa) {
	if (data[0] !== undefined) {
		var datos = data[0];
	} else if (data.features[0] !== undefined) {
		var datos = data.features[0];
	} else {
		var datos = "";
	}

	if (datos !== "" && datos.geometry.type == "Point") {
		//Se usa un svg cualquiera y se le da un tamaño 0. El info sale 10 pixeles más arriba
		var myIcon;
		if(anyadeCapa){
			myIcon = L.icon({
				iconUrl: prot + urlAPI + "/" + llDir + "/images/marker-icon.png",
				iconSize : [20, 30],
				shadowSize: [0,0],
				iconAnchor:[10,30],
				popupAnchor:[0,-30]
			});
		}else{
			myIcon = L.icon({
				iconUrl: prot + urlAPI + "/" + llDir + "/images/marker-icon.png",
				iconSize : [0, 0],
				shadowSize: [0,0],
			});
		}
		var opcionesMaker = {};
		if(urlIcono !== undefined){
			myIcon.iconUrl =  urlIcono;
			myIcon.iconSize =  [30, 30];
		}
		opcionesMaker = {icon:myIcon};
		if(!muestraInfo){
			opcionesMaker.interactive = false;
		}
		limpiaConsulta(mapa);
		capaConsulta = new L.geoJson(data, {
			style: estiloConsulta,
			pointToLayer: function (feature, latlng) {
				return L.marker(latlng, opcionesMaker);
			},
			onEachFeature: onEachFeature
		});
		capaConsulta.addTo(mapa);

		///////////Mostrar los puntos con cluster/////////////////////

		var colorCluster = 'rgb(0,0,255)';
		var colorClusterE = colorCluster.replace("rgb(","rgba(").replace(")",",0.6)");
		var colorClusterI = colorCluster.replace("rgb(","rgba(").replace(")",",1)");
		var idCSS = "capaConsulta"
		$('head').append('<style id="capaConsulta;" type="text/css">.marker-micluster-'  + idCSS + ' {background-color: ' + colorClusterE + ';;width:60px;height:60px;}.marker-micluster-'  + idCSS + ' div {background-color: ' + colorClusterI + ';}</style>');
		var markerCluster = L.markerClusterGroup.layerSupport({
			showCoverageOnHover: false,
			maxClusterRadius:40,
			iconCreateFunction: function(cluster) {
				var childCount = cluster.getChildCount();
				return new L.DivIcon({ html: '<div id="capaConsulta;"><span>' + childCount + '</span></div>', className: 'marker-cluster marker-micluster-'  + idCSS, iconSize: new L.Point(40, 40) });
			}
		});
		markerCluster.addTo(mapa);
		markerCluster.checkIn(capaConsulta);
		capaConsulta.addTo(mapa);
		//toc.addOverlay(markerCluster,titulo);
		mapa.addLayer(markerCluster);
	} else {
		limpiaConsulta(mapa);
		/*capaConsulta = new L.geoJson(data, {
			style: estiloConsulta,
			onEachFeature: onEachFeature
		}).addTo(map);*/
		if(anyadeCapa){
			capaConsulta = new L.geoJson(data, {
				style: estiloConsulta,
				onEachFeature: onEachFeature,
				interactive: false
			//onEachFeature: onEachFeature,
			//pane: 'consulta'
			});
		} else {
			capaConsulta = new L.geoJson(data, {
				style: estiloVacio,
				onEachFeature: onEachFeature,
				interactive: false
			//onEachFeature: onEachFeature,
			//pane: 'consulta'
			});
		}
		capaConsulta.id = "capaConsulta;";
		//var capaConsultaG = new L.featureGroup([capaConsulta]);
		capaConsulta.addTo(mapa);
		/*map.eachLayer(function(layer) {
			if (layer.id !== undefined) {
				if (layer.id !== "capaConsulta;") {
					console.log(layer.id);
					layer.bringToFront();
				}
			}
		});*/
		/*map.eachLayer(function(layer) {
			if (layer.id !== undefined) {
				if (layer.id == "Orto_Actual;") {
					console.log(layer.id);
					layer.bringToFront();
				}
			}
		});
		map.eachLayer(function(layer) {
			if (layer.id !== undefined) {
				console.log(layer.id);
			}
		});*/
	}

	///////////Añadir/Quitar capas del control de capas//////////////////
	//map.controlCapas._capasNormales.children.push({layer: capaConsulta, label: "Capa consulta", mostrarChecbox: true});
	if(cargaInicial[mapa.id]){
		capasIniciales[mapa.id] = mapa.controlCapas._capasNormales.children;
		cargaInicial[mapa.id] = false;
	}

	for(i = 0; i < capasIniciales[mapa.id].length; i++){
		if(mapa.hasLayer(capasIniciales[mapa.id][i].layer)){
			mapa.removeLayer(capasIniciales[mapa.id][i].layer);
			capasARecargar[mapa.id].push(capasIniciales[mapa.id][i].layer);
		}
	}

	auxLeyenda[mapa.id] = mapa.controlLeyenda;
	if(	mapa.controlLeyenda !== undefined){
		mapa.controlLeyenda.remove();
	}
	mapa.controlCapas.setCapasNormales({layer: capaConsulta, label: "Capa consulta", mostrarChecbox: true});
	mapa.controlCapas.addTo(mapa);

	if(Object.keys(capaConsulta._layers).length < 1000){
		mapa.flyToBounds(capaConsulta.getBounds(),{
			maxZoom: 16
		});
	} else {
		mapa.fitBounds(capaConsulta.getBounds(),{
			maxZoom: 16,
			animate: true,
			duration: 1.0
		});
	}


	if (data.features !== undefined) {
		if (muestraInfo && data.features.length == 1) {
			muestraInfoElemento(capaConsulta.getLayers()[0],mapa);
		}
	//SI se trata de una capa GeoJSON en local
	} else {
		if (muestraInfo && data.length == 1) {
			muestraInfoElemento(capaConsulta.getLayers()[0],mapa);
		}
	}
}

function limpiaConsulta (mapa){
	if (capaConsulta !== null) {
		mapa.removeLayer(capaConsulta);
	}
}

///////////////// DEVUELVE LOS FILTROS A LOS VALORES POR DEFECTO /////////////////////////////////

function reiniciaFiltro (id,selectExcepcion){
	reinicio[id] = true;
	//mapa = mapas_id.find(function(x){ return x.id === id}).mapa;
	mapa = mapas_id.filter(function (x) {
		return x.id === id
    })[0].mapa;
	if (capaConsulta !== null) {
		for(i = 0; i < selectAGSByMap[id].length; i++){
			if(selectAGSByMap[id][i] !== selectExcepcion){
			selectAGSByMap[id][i].options.length = 0;
			selectAGSByMap[id][i].appendChild(new Option(MENSAJES.Seleccionar, ""));
			var data = dataAGSByMap[id][i];
			for (var j = 0; j < data.features.length; j++) {
				var valor = data.features[j].attributes[camposAGSByMap[id][i]];
				selectAGSByMap[id][i].appendChild(new Option(valor, valor));
			}
			}
		}
		for(i = 0; i < selectMSJsonByMap[id].length; i++){
			if(selectMSJsonByMap[id][i] !== selectExcepcion){
				selectMSJsonByMap[id][i].options.length = 0;
				selectMSJsonByMap[id][i].appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
				var data = dataMsJsonByMap[id][i];
				for (var j = 0; j < data.length; j++) {
					var valor = data[j];
					selectMSJsonByMap[id][i].appendChild(new Option(valor, valor));
				}
				selectMSJsonByMap[id][i].value = MENSAJES.Seleccionar;
			}
		}
		for(i = 0; i < selectSecundarioByMap[id].length; i++){
			if (selectSecundarioByMap[id][i] !== undefined) {selectSecundarioByMap[id][i].options.length = 0;selectSecundarioByMap[id][i].appendChild(new Option(MENSAJES.Esperando, ""));selectSecundarioByMap[id][i].disabled = true;}
		}
		mapa.removeLayer(capaConsulta);
	}
	if(selectExcepcion == undefined){
		mapa.flyTo(mapa.coordInicio, mapa.zoomInicio);
	}
	if(!cargaInicial[mapa.id]){
		for(i = 0; i < capasARecargar[mapa.id].length; i++){
			mapa.addLayer(capasARecargar[mapa.id][i]);
		}
	}
	mapa.controlCapas.setCapasNormales(capasIniciales[mapa.id]);
	/*
	if(auxLeyenda[mapa.id] !== undefined){
			auxLeyenda[mapa.id].addTo(mapa);
	}
	*/
	if(	mapa.controlLeyenda !== undefined){
		mapa.controlLeyenda.remove();
	}
}

function muestraInfoElemento(capa,mapa){
	mapa.once('moveend', function() {
		capa.openPopup();
	});
}

//Preparan los selects: rellena con datos y crea la función al seleccionar elemento y hacer consulta
function preparaFiltroSelect (select,mapa,servicio,capa,campo,muestraInfo,anyadeCapa,aliasCampos,urlIcono){
	campo=campo[0];
	//En caso de ser el primer select de un mapa, inicializar las varibles
	if(selectAGSByMap[mapa.id] == undefined){selectAGSByMap[mapa.id] = []}
	if(selectMSJsonByMap[mapa.id] == undefined){selectMSJsonByMap[mapa.id] = []}
	if(selectSecundarioByMap[mapa.id] == undefined){selectSecundarioByMap[mapa.id] = []}
	if(dataAGSByMap[mapa.id] == undefined){dataAGSByMap[mapa.id] = []}
	if(camposAGSByMap[mapa.id] == undefined){camposAGSByMap[mapa.id] = []}
	if(dataMsJsonByMap[mapa.id] == undefined){dataMsJsonByMap[mapa.id] = []}
	if(capasARecargar[mapa.id] == undefined){capasARecargar[mapa.id] = []}
	if(cargaInicial[mapa.id] == undefined){cargaInicial[mapa.id] = true}
	if(reinicio[mapa.id] == undefined){reinicio[mapa.id] = false}
	if(servicio.split(',')[0] == 'externo') {
		var urlServicio = servicio.split(',')[1].split("|")[0];
		var tipoServicio = servicio.split(',')[2];
	} else if (capasIDEV[servicio] !== undefined) {
		var tipoServicio = capasIDEV[servicio][0];
		var urlServicio = capasIDEV[servicio][1].split("|")[0];
	} else {
		alert("El servicio no existe o el identificador del servicio es incorrecto");
		return;
	}
	var urlInfoPopup = urlServicio;
	if (tipoServicio == "AGS") {
		urlServicio = urlServicio.replace("/arcgis/services/","/arcgis/rest/services/").replace("/MapServer/WMSServer","/MapServer/");
		urlServicio = urlServicio + capa;
		/*
		var queryTask = new QueryTask(urlServicio);
		var query = new Query();
		query.returnGeometry = true;
		queryTask.execute(query, function(featureSet){
			console.log(featureSet);
		});*/
		var consulta = "where=1=1&outFields=" + campo + "&returnGeometry=false&returnDistinctValues=true&orderByFields=" + campo + "&f=json";
		var consultaRest = urlServicio + "/query?" + consulta;
		var request = $.ajax({
			url: encodeURI(consultaRest),
			type: "GET"
		});
		request.done(function(data) {
			select.options.length = 0;
			select.appendChild(new Option(MENSAJES.Seleccionar, ""));
			for (var j = 0; j < data.features.length; j++) {
				var valor = data.features[j].attributes[campo];
				select.appendChild(new Option(valor, valor));
			}
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if(!reinicio[mapa.id]){
				selectAGSByMap[mapa.id].push(select);
				dataAGSByMap[mapa.id].push(data);
				camposAGSByMap[mapa.id].push(campo);
			}
			$(select).change(function(){
				var valor = $(this).val();
				reiniciaFiltro(mapa.id,select);
				valor = valor.replace(/'/g,"''");
				var consulta = "where="+ campo +"='" + valor + "'&outFields=*&returnGeometry=true&f=geojson";
				//var consulta = "where=" + campo + " LIKE '" + valor + "'&outFields=*&returnGeometry=true&f=geojson";
				var consultaRest2 = urlServicio + "/query?" + consulta;
				var request2 = $.ajax({
					url: encodeURI(consultaRest2),
					type: "GET"
				});
				request2.done(function(data2) {
					if (data2.features.length > 0) {
						añadeAliasCamposFiltro(data2,aliasCampos,urlInfoPopup);
						añadeCapaConsultaFiltro (data2,muestraInfo,anyadeCapa,urlIcono,mapa);
					} else {
						limpiaConsulta(mapa);
					}
				});
				request2.fail(function(jqXHR, textStatus ) {
					alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
				});
			});
		});
		request.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
		});
	} else if (tipoServicio == "MS") {
		var requestMS = $.ajax({
			url:  urlServicio,
                type: "GET",
                data: {
                    'service':'WFS',
                    'request':'GetPropertyValue',
                    'version':'2.0.0',
                    'typeNames': capa,
                    'valueReference': campo,
                    'sortBy': campo
                },
                dataType: "xml"
		});

		requestMS.done(function(data) {
			var dataFiltrada = [];
			//////////Tratamiento de respuesta XML/////////////

			var elementos = data.getElementsByTagName('ms:' + campo);
			for(i = 0; i < elementos.length; i++){
				if(!dataFiltrada.includes(elementos[i].childNodes[0].data)){
					dataFiltrada.push(elementos[i].childNodes[0].data);
				}
			}
			//////////Tratamiento de respuesta JSON///////////
			/*
			for(i = 0; i < data.features.length; i++){
				if(!dataFiltrada.includes(data.features[i].properties[campo])){
					dataFiltrada.push(data.features[i].properties[campo])
				}
			}
			*/
			select.options.length = 0;
			select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < dataFiltrada.length; j++) {
				var valor = dataFiltrada[j];
				select.appendChild(new Option(valor, valor));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if(!reinicio[mapa.id]){
				selectMSJsonByMap[mapa.id].push(select);
				dataMsJsonByMap[mapa.id].push(dataFiltrada);
			}
			$(select).change(function(){
				var valor = $(this).val();
				reiniciaFiltro(mapa.id,select);
				valor = valor.replace(/'/g,"'");
				if(valor.length > 120){ valor =  valor.substring(0,120)}
				//var filtro = "<Filter><PropertyIsEqualTo><PropertyName>" + campo + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo></Filter>";
				var filtro = "<Filter><PropertyIsEqualTo><PropertyName>" + campo + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo></Filter>";
				var request2 = $.ajax({
					url:  urlServicio,
					type: "GET",
					data: {
						'service':'WFS',
						'request':'GetFeature',
						'version':'1.1.0',
						'typeName': capa,
						'outputFormat': 'geojson',
						'srsName': 'EPSG:4326',
						'filter' : filtro
					},
					dataType: "json"
				});
				request2.done(function(data) {
					if (data.features.length > 0) {
						if(valor !== MENSAJES.Seleccionar){
							añadeAliasCamposFiltro(data,aliasCampos,urlInfoPopup);
							añadeCapaConsultaFiltro (data,muestraInfo,anyadeCapa,urlIcono,mapa);
						}
					} else {
						limpiaConsulta(mapa);
					}
				});
				request2.fail(function(jqXHR, textStatus ) {
					alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
				});
			});
		});
		requestMS.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
		});
	} else if (tipoServicio == "GeoJSON"){
		var capa;
		//Es una capa GeoJSON en http
		if (urlServicio !== "local") {
			$.each(GCapasGeoJSON, function (i) {
				if (GCapasGeoJSON[i].id.split(";")[0] == servicio) {
					capa = GCapasGeoJSON[i].toGeoJSON();
				}
			});
		//Es una capa definida en local con variable
		} else {
			capa = eval(servicio);
		}
		//Extrae valores únicos del campo definido en el select
		var valoresUnicos= $.unique(capa.features.map(function (d) {
			return d.properties[campo];
		}));
		select.options.length = 0;
		select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;

		if(!reinicio[mapa.id]){
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		$(select).change(function(){
			var valor = $(this).val();
			reiniciaConsulta(select);
			//valor = valor.replace(/'/g,"''");
			var resultados = filtroJSON (capa,campo,valor);
			if (resultados.length > 0) {
				añadeCapaConsulta(resultados,muestraInfo,anyadeCapa,urlIcono,mapa);
			} else {
				limpiaConsulta(mapa);
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
			return a.filter(function(item) {
				return seen.hasOwnProperty(item) ? false : (seen[item] = true);
			});
		}
		var valoresUnicos = uniq(capa.features.map(function (d) {
			return d.properties[campo];
		}))
		select.options.length = 0;
		select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			select.appendChild(new Option(valor, valor));
		}
		select.value = MENSAJES.Seleccionar;
		if(!reinicio[mapa.id]){
			selectMSJsonByMap[mapa.id].push(select);
			dataMsJsonByMap[mapa.id].push(valoresUnicos);
		}
		$(select).change(function(){
			var valor = $(this).val();
			reiniciaConsulta(select);
			var resultados = filtroJSON (capa,campo,valor);
			if (resultados.length > 0) {
				añadeAliasCamposJSON(resultados,aliasCampos);
				añadeCapaConsulta(resultados,muestraInfo,anyadeCapa,urlIcono,mapa);
			} else {
				limpiaConsulta(mapa);
			}
		});
	}
}

//Preparan los selects: rellena con datos y crea la función al seleccionar elemento y hacer consulta
function preparaFiltroMultiSelect (select,mapa,selectsSecundarios,numSelects,servicio,capa,campos,muestraInfo,anyadeCapa,aliasCampos,urlIcono){
	//En caso de ser el primer select de un mapa, inicializar las varibles
	if(selectAGSByMap[mapa.id] == undefined){selectAGSByMap[mapa.id] = []}
	if(selectMSJsonByMap[mapa.id] == undefined){selectMSJsonByMap[mapa.id] = []}
	if(selectSecundarioByMap[mapa.id] == undefined){selectSecundarioByMap[mapa.id] = []}
	if(dataAGSByMap[mapa.id] == undefined){dataAGSByMap[mapa.id] = []}
	if(camposAGSByMap[mapa.id] == undefined){camposAGSByMap[mapa.id] = []}
	if(dataMsJsonByMap[mapa.id] == undefined){dataMsJsonByMap[mapa.id] = []}
	if(capasARecargar[mapa.id] == undefined){capasARecargar[mapa.id] = []}
	if(cargaInicial[mapa.id] == undefined){cargaInicial[mapa.id] = true}
	if(reinicio[mapa.id] == undefined){reinicio[mapa.id] = false}
	if(servicio.split(',')[0] == 'externo') {
		var urlServicio = servicio.split(',')[1].split("|")[0];
		var tipoServicio = servicio.split(',')[2];
	} else {
		var tipoServicio = capasIDEV[servicio][0];
		var urlServicio = capasIDEV[servicio][1].split("|")[0];
	}
	var urlInfoPopup = urlServicio;
	if (numSelects >= 2) {
		var select2 = selectsSecundarios[0];
	}
	if (numSelects == 3) {
		var select3 = selectsSecundarios[1];
	}
	//************************* CAPAS ARCGIS SERVER ***********************************************/
	if (tipoServicio == "AGS") {
		urlServicio = urlServicio.replace("/arcgis/services/","/arcgis/rest/services/").replace("/MapServer/WMSServer","/MapServer/");
		urlServicio = urlServicio + capa;
		var consulta = "where=1=1&outFields=" + campos[0] + "&returnGeometry=false&returnDistinctValues=true&orderByFields=" + campos[0] + "&f=json";
		var consultaRest = urlServicio + "/query?" + consulta;
		var requestAGS = $.ajax({
			url: encodeURI(consultaRest),
			type: "GET"
		});
		requestAGS.done(function(data) {
			select.options.length = 0;
			select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < data.features.length; j++) {
				var valor0 = data.features[j].attributes[campos[0]];
				select.appendChild(new Option(valor0, valor0));
			}
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if(!reinicio[mapa.id]){
				selectAGSByMap[mapa.id].push(select);
				dataAGSByMap[mapa.id].push(data);
				camposAGSByMap[mapa.id].push(campos[0]);
			}
			if (select2 !== undefined) {select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;}
			if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
			if(!reinicio[mapa.id]){
				selectSecundarioByMap[mapa.id].push(select2);
				selectSecundarioByMap[mapa.id].push(select3);
			}
			$(select).change(function(){
				if (select2 !== undefined) {select2.options.length = 0;}
				if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
				reiniciaFiltro(mapa.id,select);
				var valor0 = $(this).val();
				if(valor0 !== MENSAJES.Seleccionar){

				}
					reiniciaFiltro(mapa.id,select);
					if(valor0 !== MENSAJES.Seleccionar){
						valor0 = valor0.replace(/'/g,"''");
						var consulta = "where=" + campos[0] + "='" + valor0 + "'&outFields=" + campos[1] + "&returnGeometry=false&returnDistinctValues=true&orderByFields=" + campos[1] + "&f=geojson";
						var consultaRest2 = urlServicio + "/query?" + consulta;
						var request2 = $.ajax({
							url: encodeURI(consultaRest2),
							type: "GET"
						});
						request2.done(function(data2) {
							//RELLENA 2º SELECT (CON 1 WHERE)
							select2.options.length = 0;
							select2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
							for (var j = 0; j < data2.features.length; j++) {
								var valor1 = data2.features[j].properties[campos[1]];
								select2.appendChild(new Option(valor1, valor1));
							}
							select2.disabled = false;
							//Cambio del Select 2
							$(select2).off('change');
							$(select2).change(function(){
								var valor1 = $(this).val();
								if(valor1 !== MENSAJES.Seleccionar){
									valor1 = valor1.replace(/'/g,"''");
								//************************* 2 SELECTS ****************************************************************/
									if (numSelects == 2) {
										var consulta2 = "where=" + campos[0] + "='" + valor0 + "' AND " + campos[1] + "='" + valor1 + "'&outFields=*&returnGeometry=true&orderByFields=" + campos[1] + "&f=geojson";
										var consultaRest_2S = urlServicio + "/query?" + consulta2;
										var request1_2S = $.ajax({
											url: encodeURI(consultaRest_2S),
											type: "GET"
										});
										request1_2S.done(function(data1_2S) {
											if (data1_2S.features.length > 0) {
												añadeAliasCamposFiltro(data1_2S,aliasCampos,urlInfoPopup);
												añadeCapaConsultaFiltro (data1_2S,muestraInfo,anyadeCapa,urlIcono,mapa);
											} else {
												limpiaConsulta(mapa);
											}
										});
										request1_2S.fail(function(jqXHR, textStatus ) {
											alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
										});
								//************************* 3 SELECTS *************************************************************/
									} else if (numSelects == 3) {
										if (select3 !== undefined) {select3.options.length = 0;}
										var consulta2_3S = "where=" + campos[0] + "='" + valor0 + "' AND " + campos[1] + "='" + valor1 + "'&outFields=" + campos[2] + "&returnDistinctValues=true&orderByFields=" + campos[2] + "&returnGeometry=false&f=geojson";
										var consultaRest_3S = urlServicio + "/query?" + consulta2_3S;
										var request3_3S = $.ajax({
											url: encodeURI(consultaRest_3S),
											type: "GET"
										});
										request3_3S.done(function(data3) {
											//RELLENA 3er SELECT (CON 2 WHERE)
											select3.options.length = 0;
											select3.appendChild(new Option(MENSAJES.Seleccionar, ""));
											for (var k = 0; k < data3.features.length; k++) {
												var valor2 = data3.features[k].properties[campos[2]];
												select3.appendChild(new Option(valor2, valor2));
											}
											select3.disabled = false;
											//Cambio del Select 3
											$(select3).off('change');
											$(select3).change(function(){
												var valor2 = $(this).val();
												valor2 = valor2.replace(/'/g,"''");
												var consulta4_3S = "where=" + campos[0] + "='" + valor0 + "' AND " + campos[1] + "='" + valor1 + "' AND " + campos[2] + "='" + valor2 + "'&outFields=*&returnGeometry=true&f=geojson";
												var consultaRest4_3S = urlServicio + "/query?" + consulta4_3S;
												var request4_3S = $.ajax({
													url: encodeURI(consultaRest4_3S),
													type: "GET"
												});
												request4_3S.done(function(data4) {
													if (data4.features.length > 0) {
														añadeAliasCamposFiltro(data4,aliasCampos,urlInfoPopup);
														añadeCapaConsultaFiltro (data4,muestraInfo,anyadeCapa,urlIcono,mapa);
													} else {
														limpiaConsulta(mapa);
													}
												});
												request4_3S.fail(function(jqXHR, textStatus ) {
													alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
												});
											});
										});
										request3_3S.fail(function(jqXHR, textStatus ) {
											alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
										});
									}
								} else {
									if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
								}

							});
						});
						request2.fail(function(jqXHR, textStatus ) {
							alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
						});
					}else{
						select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;
						if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
					}

			});
		});
		requestAGS.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
		});
	//************************* CAPAS MAP SERVER ***********************************************************/
	} else if (tipoServicio == "MS") {
		var requestMS_1 = $.ajax({
			url:  urlServicio,
			type: "GET",
			data: {
				'service':'WFS',
				'request':'GetPropertyValue',
				'version':'2.0.0',
				'typenames': capa,
				'valueReference': campos[0],
				//'sortBy': campos[0]
			},
			dataType: "xml"
		});

		requestMS_1.done(function(dataMS_1) {
			var dataFiltradaMS_1 = [];
			//////////Tratamiento de respuesta XML/////////////

			var elementosMS_1 = dataMS_1.getElementsByTagName('ms:' + campos[0]);
			for(i = 0; i < elementosMS_1.length; i++){
				if(!dataFiltradaMS_1.includes(elementosMS_1[i].childNodes[0].data)){
					dataFiltradaMS_1.push(elementosMS_1[i].childNodes[0].data);
				}
			}
			dataFiltradaMS_1.sort();
			console.log(dataFiltradaMS_1);
			//////////Tratamiento de respuesta JSON///////////
			/*
			for(i = 0; i < data.features.length; i++){
				if(!dataFiltrada.includes(data.features[i].properties[campo])){
					dataFiltrada.push(data.features[i].properties[campo])
				}
			}
			*/
			select.options.length = 0;
			select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < dataFiltradaMS_1.length; j++) {
				var valor = dataFiltradaMS_1[j];
				select.appendChild(new Option(valor, valor));
			}
			select.value = MENSAJES.Seleccionar;
			/////Almacenamos los valores para guardar el estado inicial de los filtros
			if(!reinicio[mapa.id]){
				selectMSJsonByMap[mapa.id].push(select);
				dataMsJsonByMap[mapa.id].push(dataFiltradaMS_1);
			}

			if (select2 !== undefined) {select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;}
			if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
			if(!reinicio[mapa.id]){
				selectSecundarioByMap[mapa.id].push(select2);
				selectSecundarioByMap[mapa.id].push(select3);
			}
			//Cambio del Select 1
			$(select).change(function(){

				if (select2 !== undefined) {select2.options.length = 0;}
				if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
				var valor0 = $(this).val();
				reiniciaFiltro(mapa.id,select);
				if(valor0 !== MENSAJES.Seleccionar){
					valor0 = valor0.replace(/'/g,"'");
					var where = campos[0] + "='" + valor0 + "'";
					var requestMS_2 = $.ajax({
						url:  urlServicio,
						type: "GET",
						data: {
							'service':'WFS',
							'request':'GetPropertyValue',
							'version':'2.0.0',
							'typeNames': capa,
							'valueReference': campos[1],
							//'sortBy': campos[0]
						},
						dataType: "xml"
					});

					requestMS_2.done(function(dataMS_2) {
						var dataFiltradaMS_2 = [];
						//////////Tratamiento de respuesta XML/////////////

						var elementosMS_2 = dataMS_2.getElementsByTagName('ms:' + campos[1]);
						for(i = 0; i < elementosMS_2.length; i++){
							if(!dataFiltradaMS_2.includes(elementosMS_2[i].childNodes[0].data) && elementosMS_1[i].childNodes[0].data == valor0){
								dataFiltradaMS_2.push(elementosMS_2[i].childNodes[0].data);
							}
						}
						dataFiltradaMS_2.sort();
						console.log(dataFiltradaMS_2);
						//////////Tratamiento de respuesta JSON/////////////
						/*
						var dataFiltrada = [];
						for(i = 0; i < data2_2S.features.length; i++){
							if(!dataFiltrada.includes(data2_2S.features[i].properties[campos[1]]) && data2_2S.features[i].properties[campos[0]] == valor0 ){
								dataFiltrada.push(data2_2S.features[i].properties[campos[1]])
							}
						}
						*/
						select2.options.length = 0;
						select2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
						for (var j = 0; j < dataFiltradaMS_2.length; j++) {
							var valor = dataFiltradaMS_2[j];
							select2.appendChild(new Option(valor, valor));
						}
						select2.disabled = false;
						//Cambio del Select 2
						//$(select2).off('change');
						$(select2).change(function(){
							var valor1 = $(this).val();
							if(valor1 !== MENSAJES.Seleccionar && valor1 !== null){
								valor1 = valor1.replace(/'/g,"'");
							//************************* 2 SELECTS *****************************************************************/
							if (select3 !== undefined) {select3.options.length = 0;}
								if (numSelects == 2) {
									var filtro = "<Filter><And><PropertyIsEqualTo><PropertyName>" + campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo></And></Filter>";
									var request1_2S = $.ajax({
										url:  urlServicio,
										type: "GET",
										data: {
											'service':'WFS',
											'request':'GetFeature',
											'version':'2.0.0',
											'typeName': capa,
											'outputFormat': 'geojson',
											'srsName': 'EPSG:4326',
											'filter' : filtro
										},
										dataType: "json"
									});
									request1_2S.done(function(data1_2S) {
										if (data1_2S.features.length > 0) {
											añadeAliasCamposFiltro(data1_2S,aliasCampos,urlInfoPopup);
											añadeCapaConsultaFiltro (data1_2S,muestraInfo,anyadeCapa,urlIcono,mapa);
										} else {
											limpiaConsulta(mapa);
										}
									});
									request1_2S.fail(function(jqXHR, textStatus ) {
										alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
									});
							//************************* 3 SELECTS ******************************************************************/
								} else if (numSelects == 3 && $(this).val() != MENSAJES.Seleccionar) {
									if (select3 !== undefined) {select3.options.length = 0;}
									var where = campos[0] + "='" + valor0 + "' AND " + campos[1] + "='" + valor1 + "'";
									/*
									var request3_3S = $.ajax({
											url:  urlServicio,
											type: "GET",
											data: {
												'service':'WFS',
												'request':'GetFeature',
												'version':'1.1.0',
												'typeName': capa,
												'outputFormat': 'geojson',
												'srsName': 'EPSG:4326',
												'propertyName': campos[0]+","+campos[1]+","+campos[2],
												'sortBy': campos[2]
											},
											dataType: "json"
										});
										*/
										var requestMS_3 = $.ajax({
											url:  urlServicio,
											type: "GET",
											data: {
												'service':'WFS',
												'request':'GetPropertyValue',
												'version':'2.0.0',
												'typeNames': capa,
												'valueReference': campos[2],
												//'sortBy': campos[0]
											},
											dataType: "xml"
										});
										requestMS_3.done(function(dataMS_3) {
											var dataFiltradaMS_3 = [];
											//////////Tratamiento de respuesta XML/////////////
											var elementosMS_3 = dataMS_3.getElementsByTagName('ms:' + campos[2]);
											for(i = 0; i < elementosMS_3.length; i++){
												if(!dataFiltradaMS_3.includes(elementosMS_3[i].childNodes[0].data) && elementosMS_1[i].childNodes[0].data == valor0 && elementosMS_2[i].childNodes[0].data == valor1){
													dataFiltradaMS_3.push(elementosMS_3[i].childNodes[0].data);
												}
											}
											dataFiltradaMS_3.sort();
										//////////Tratamiento de respuesta JSON/////////////
										/*
										var dataFiltrada = [];
										for(i = 0; i < data3.features.length; i++){
											if(!dataFiltrada.includes(data3.features[i].properties[campos[2]]) && data3.features[i].properties[campos[0]] == valor0
											&& data3.features[i].properties[campos[1]] == valor1 ){
												dataFiltrada.push(data3.features[i].properties[campos[2]])
											}
										}
										*/
										select3.options.length = 0;
										select3.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
										for (var j = 0; j < dataFiltradaMS_3.length; j++) {
											var valor = dataFiltradaMS_3[j];
											select3.appendChild(new Option(valor, valor));
										}
										select3.disabled = false;
										//Cambio del Select 3
										$(select3).off('change');
										$(select3).change(function(){
											var valor2 = $(this).val();
											valor2 = valor2.replace(/'/g,"'");
											var filtro = "<Filter><And><PropertyIsEqualTo><PropertyName>" + campos[0] + "</PropertyName><Literal>" + valor0 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + campos[1] + "</PropertyName><Literal>" + valor1 + "</Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>" + campos[2] + "</PropertyName><Literal>" + valor2 + "</Literal></PropertyIsEqualTo></And></Filter>";
											var request4_3S = $.ajax({
												url:  urlServicio,
												type: "GET",
												data: {
													'service':'WFS',
													'request':'GetFeature',
													'version':'2.0.0',
													'typeName': capa,
													'outputFormat': 'geojson',
													'srsName': 'EPSG:4326',
													'filter' : filtro
												},
												dataType: "json"
											});
											request4_3S.done(function(data4) {
												if (data4.features.length > 0) {
													añadeAliasCamposFiltro(data4,aliasCampos,urlInfoPopup);
													añadeCapaConsultaFiltro (data4,muestraInfo,anyadeCapa,urlIcono,mapa);
												} else {
													limpiaConsulta(mapa);
												}
											});
											request4_3S.fail(function(jqXHR, textStatus ) {
												alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
											});
										});
									});
									requestMS_3.fail(function(jqXHR, textStatus ) {
										alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
									});
								}
							} else {
								if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
							}
						});
					});
					requestMS_2.fail(function(jqXHR, textStatus ) {
						alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
					});
				} else {
					select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;
					if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
				}
			});
		});
		requestMS_1.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.PeticionFallida + capa + ", " + campo + ". Error:" + textStatus);
		});
	//************************* CAPAS GEOJSON *******************************************************************************/
} else if (tipoServicio == "GeoJSON"){
	var capa;
	//Es una capa GeoJSON en http
	if (urlServicio !== "local") {
		$.each(GCapasGeoJSON, function (i) {
			if (GCapasGeoJSON[i].id.split(";")[0] == servicio) {
				capa = GCapasGeoJSON[i].toGeoJSON();
			}
		});
	//Es una capa definida en local con variable
	} else {
		capa = eval(servicio);
	}
	//****** PRIMER FILTRO ******Extrae valores únicos del campo definido en el select
	var valoresUnicos= $.unique(capa.features.map(function (d) {
		return d.properties[campos[0]];
	}));

	select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
	for (var j = 0; j < valoresUnicos.length; j++) {
		var valor = valoresUnicos[j];
		select.appendChild(new Option(valor, valor));
	}
	select.value = MENSAJES.Seleccionar;
	/////Almacenamos los valores para guardar el estado inicial de los filtros
	if(!reinicio[mapa.id]){
		selectMSJsonByMap[mapa.id].push(select);
		dataMsJsonByMap[mapa.id].push(valoresUnicos);
	}
	//SELECCIÓN SELECT 1
	if (select2 !== undefined) {select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;}
	if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
	if(!reinicio[mapa.id]){
		selectSecundarioByMap[mapa.id].push(select2);
		selectSecundarioByMap[mapa.id].push(select3);
	}
	$(select).change(function(){
		if (select2 !== undefined) {select2.options.length = 0;}
		if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}

		var valor = $(this).val();
		reiniciaConsulta(select);
		//valor = valor.replace(/'/g,"''");
		if(valor !== MENSAJES.Seleccionar){
			var resultados = filtroJSON (capa,campos[0],valor);
			var valoresUnicos1= $.unique(resultados.map(function (d) {
				return d.properties[campos[1]];
			}));
			//RELLENA 2º SELECT
			select2.options.length = 0;
			select2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < valoresUnicos1.length; j++) {
				var valor = valoresUnicos1[j];
				select2.appendChild(new Option(valor, valor));
			}
			select2.disabled = false;
			//Cambio del Select 2
			$(select2).off('change');
			//SELECCIÓN SELECT 2
			$(select2).change(function(){
				var valor1 = $(this).val();
				if(valor1 !== MENSAJES.Seleccionar){
					//valor1 = valor1.replace(/'/g,"''");
					//******* SEGUNDO FILTRO ******Extrae valores únicos del campo definido en el select
					var resultados2 = filtroJSON (capa,campos[1],valor1);
				//************************* 2 SELECTS *****************************************************************/
					if (numSelects == 2) {
						if (resultados2.length > 0) {
							añadeCapaConsulta(resultados2,muestraInfo,anyadeCapa,urlIcono,mapa);
						} else {
							limpiaConsulta(mapa);
						}
				//************************* 3 SELECTS ******************************************************************/
					} else if (numSelects == 3) {
						if (select3 !== undefined) {select3.options.length = 0;}
						var valoresUnicos2= $.unique(resultados2.map(function (d) {
							return d.properties[campos[2]];
						}));
						//RELLENA 3er SELECT (CON 2 WHERE)
						select3.options.length = 0;
						select3.appendChild(new Option(MENSAJES.Seleccionar, ""));
						for (var j = 0; j < valoresUnicos2.length; j++) {
							var valor2 = valoresUnicos2[j];
							select3.appendChild(new Option(valor2, valor2));
						}
						select3.disabled = false;
						//Cambio del Select 3
						$(select3).off('change');
						//SELECCIÓN SELECT 3
						$(select3).change(function(){
							var valor2 = $(this).val();
							//valor2 = valor2.replace(/'/g,"''");
							//******* TERCER FILTRO ******Extrae valores únicos del campo definido en el select
							var resultados3 = filtroJSON (capa,campos[2],valor2);
							if (resultados3.length > 0) {
								añadeCapaConsulta(resultados3,muestraInfo,anyadeCapa,urlIcono,mapa);
							} else {
								limpiaConsulta(mapa);
							}
						});
					}
				}else {
					if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
				}
			});
		}else {
			select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;
			if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
		}

	});
} else if (tipoServicio == 'JSON') {
	var scriptFirst = document.createElement('script');
	scriptFirst.type = 'text/javascript';
	scriptFirst.src = './' + urlServicio;
	$('head').append(scriptFirst);
	//****** PRIMER FILTRO ******Extrae valores únicos del campo definido en el select
	capa = window[capa];
	/*
	var valoresUnicos =$.unique(capa.features.map(function (d) {
		return d.properties[campos[0]];
	}));
	*/
	function uniq(a) {
		var seen = {};
		return a.filter(function(item) {
			return seen.hasOwnProperty(item) ? false : (seen[item] = true);
		});
	}
	var valoresUnicos = uniq(capa.features.map(function (d) {
		return d.properties[campos[0]];
	}));

	select.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
	for (var j = 0; j < valoresUnicos.length; j++) {
		var valor = valoresUnicos[j];
		select.appendChild(new Option(valor, valor));
	}
	select.value = MENSAJES.Seleccionar;
	/////Almacenamos los valores para guardar el estado inicial de los filtros
	if(!reinicio[mapa.id]){
		selectMSJsonByMap[mapa.id].push(select);
		dataMsJsonByMap[mapa.id].push(valoresUnicos);
	}
	//SELECCIÓN SELECT 1
	if (select2 !== undefined) {select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;}
	if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
	if(!reinicio[mapa.id]){
		selectSecundarioByMap[mapa.id].push(select2);
		selectSecundarioByMap[mapa.id].push(select3);
	}
	$(select).change(function(){
		if (select2 !== undefined) {select2.options.length = 0;}
		if (select3 !== undefined) {select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}

		var valor = $(this).val();
			reiniciaConsulta(select);
		//valor = valor.replace(/'/g,"''");
		if(valor !== MENSAJES.Seleccionar){
			var resultados = filtroJSON (capa,campos[0],valor);
			var valoresUnicos1= uniq(resultados.map(function (d) {
				return d.properties[campos[1]];
			}));
			//RELLENA 2º SELECT
			select2.options.length = 0;
			select2.appendChild(new Option(MENSAJES.Seleccionar, MENSAJES.Seleccionar));
			for (var j = 0; j < valoresUnicos1.length; j++) {
				var valor = valoresUnicos1[j];
				select2.appendChild(new Option(valor, valor));
			}
			select2.disabled = false;
			//Cambio del Select 2
			$(select2).off('change');
			//SELECCIÓN SELECT 2
			$(select2).change(function(){
				var valor1 = $(this).val();
				if(valor1 !== MENSAJES.Seleccionar){
					//valor1 = valor1.replace(/'/g,"''");
					//******* SEGUNDO FILTRO ******Extrae valores únicos del campo definido en el select
					var resultados2 = filtroJSON (resultados,campos[1],valor1);
				//************************* 2 SELECTS *****************************************************************/
					if (numSelects == 2) {
						if (resultados2.length > 0) {
							añadeCapaConsulta(resultados2,muestraInfo,anyadeCapa,urlIcono,mapa);
						} else {
							limpiaConsulta(mapa);
						}
				//************************* 3 SELECTS ******************************************************************/
					} else if (numSelects == 3) {
						if (select3 !== undefined) {select3.options.length = 0;}
						var valoresUnicos2= uniq(resultados2.map(function (d) {
							return d.properties[campos[2]];
						}));
						//RELLENA 3er SELECT (CON 2 WHERE)
						select3.options.length = 0;
						select3.appendChild(new Option(MENSAJES.Seleccionar, ""));
						for (var j = 0; j < valoresUnicos2.length; j++) {
							var valor2 = valoresUnicos2[j];
							select3.appendChild(new Option(valor2, valor2));
						}
						select3.disabled = false;
						//Cambio del Select 3
						$(select3).off('change');
						//SELECCIÓN SELECT 3
						$(select3).change(function(){
							var valor2 = $(this).val();
							//valor2 = valor2.replace(/'/g,"''");
							//******* TERCER FILTRO ******Extrae valores únicos del campo definido en el select
							var resultados3 = filtroJSON (resultados2,campos[2],valor2);
							if (resultados3.length > 0) {
								añadeCapaConsulta(resultados3,muestraInfo,anyadeCapa,urlIcono,mapa);
							} else {
								limpiaConsulta(mapa);
							}
						});
					}
				}else {
					if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
				}
			});
		} else {
			select2.options.length = 0;select2.appendChild(new Option(MENSAJES.Esperando, ""));select2.disabled = true;
			if (select3 !== undefined){select3.options.length = 0;select3.appendChild(new Option(MENSAJES.Esperando, ""));select3.disabled = true;}
		}
	});
}
}