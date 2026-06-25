
function rellenaLeyenda(id,capasGeoJSON, capasWMS, capasWMTS, capasTree, colapsarLeyenda, mapa){
	var html = creaLeyenda(capasGeoJSON, capasWMS, capasWMTS, capasTree,mapa);
	//Busca el div "leyendaIDEV", y si lo encuentra, añade la leyenda
	if (id == "mapaIDEV") {
		if ($("#leyendaIDEV").length > 0) {
			$("#leyendaIDEV").empty();
			$("#leyendaIDEV").append(html);
		}
	} else {
		if ($("#leyendaIDEV_"+ id).length > 0) {
			$("#leyendaIDEV_"+ id).empty();
			$("#leyendaIDEV_"+ id).append(html);
		}
	}
	//Si el parametro esta definido por el ususario
	if (colapsarLeyenda !== undefined) {
		//Crea el fondo de la leyenda y le pasa el fragmento de html al widget
		var div = L.DomUtil.create('div', 'info legend');
		div.style.background = "white";
		if (id == "mapaIDEV") {
			div.id = "leyendaIDEV";
		} else {
			div.id = "leyendaIDEV_" + id;
		}
		div.innerHTML = html;
		if (html !== '') {
			mapa.controlLeyenda = L.control.leyenda(div,mapa,{position: 'topright', collapsed: colapsarLeyenda}).addTo(mapa);
		}
	}
}

function creaLeyendaGeoJSON (html,capaGeoJSON,capaL){
	var idCapa = capaGeoJSON.id;
	if (capaL !== undefined) {
		if (capaL !== idCapa) {
			return true;
		}
	}
	var estilo = capaGeoJSON.estilo;
	var tipoGeometria = capaGeoJSON.tipoGeometria;

	//Título principal de la Leyenda
	if (capaGeoJSON.leyenda.titulo == "IDEVAPI_Capa") {
		var titulo =  capaGeoJSON.titulo;
	} else if (capaGeoJSON.leyenda.titulo == ""){
		var titulo =  "";
	} else {
		var titulo = capaGeoJSON.leyenda.titulo;
	}
	////////////////////////////////////////////////////////////////////// POLÍGONOS ////////////////////////
	if (tipoGeometria == "Polygon" || tipoGeometria == "MultiPolygon") {
		for (i = 0; i < estilo.length; i++){
			if (i==0){
				html += "<div style='display:flex;flex-direction: column;'>";
				//Título Leyenda
				if (titulo !== "") {
					html += "<div class='IDEVAPILeyendaTituloCapa'>" + titulo + "</div>";
				}
			}
			var ElemTitulo = "";
			//Capa con estilos por valores y con/sin título
			if (estilo[i].length >= 3 ) {
				var ElemEstilo = estilo[i][2];
				//Capa con estilos por valores sin título
				if (estilo[i].length == 4 ) {ElemTitulo = estilo[i][3];}
			//Capa con estilo simple y título
			} else if (estilo[i].length == 2 ) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = estilo[i][1];
			//Capa con estilo simple sin título
			} else if (estilo[i].length == 1 ) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = capaGeoJSON.titulo;
			} else {
				console.log("El número de elementos del estilo no es 1 ni 3");
				return;
			}
			if (ElemTitulo.split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") {ElemTitulo = ElemTitulo.split(";")[0];} else if (IDEVAPI_global.idioma == "va"){ElemTitulo = ElemTitulo.split(";")[1];} else {ElemTitulo = ElemTitulo.split(";")[1];}
			}
			var colorRelleno = ElemEstilo.fillColor;
			var colorLinea = ElemEstilo.color;
			var grosorLinea = ElemEstilo.weight;
			var opacidadRelleno = ElemEstilo.fillOpacity;
			var opacidad = ElemEstilo.opacity;
			html += "<div style='display:flex;align-items:center;margin:0px 2px 2px 6px;font-size:11px;'><div style='background-color: " + colorRelleno + ";width: 12px;height:12px;border: " + grosorLinea + "px solid " + colorLinea + ";opacity: " + opacidadRelleno + ";'></div><div class='IDEVAPILeyenda'>" + ElemTitulo + "</div></div>";
			if (i==estilo.length-1){
				html += "</div>";
			}
		}
	////////////////////////////////////////////////////////////////////// LÍNEAS ////////////////////////
	} else if (tipoGeometria == "LineString" || tipoGeometria == "MultiLineString") {

	////////////////////////////////////////////////////////////////////// PUNTOS ////////////////////////
	} else if (tipoGeometria == "Point" || tipoGeometria == "MultiPoint") {
		
		if (capaGeoJSON.cluster.tituloLeyenda == "") {
			var prefijo = "";
			if (IDEVAPI_global.idioma == "es") {prefijo = " (Agrupación)";} else if (IDEVAPI_global.idioma == "va"){prefijo = " (Agrupació)";} else {prefijo = " (Agrupación)";}
			var tituloCluster =  capaGeoJSON.titulo + prefijo;
		} else {
			var tituloCluster = capaGeoJSON.cluster.tituloLeyenda;
		}
		//Crea el HTML de la Leyenda
		//var html = "";
		for (i = 0; i < estilo.length; i++){
			if (i==0){
				html += "<div style='display:flex;flex-direction: column;'>";
				//Título Leyenda
				if (titulo !== "") {
					html += "<div class='IDEVAPILeyendaTituloCapa'>" + titulo + "</div>";
				}
				//Leyenda del cluster
				if (capaGeoJSON.cluster.activo) {
					var tamaño = capaGeoJSON.cluster.tamaño;
					var borderRadiusE = tamaño/2;
					var anchoAltoInt = tamaño*0.75;
					var marginInt = (tamaño-anchoAltoInt)/2;
					var borderRadiusI = anchoAltoInt/2;
					if (tamaño > 50) {
						var fontSize = 15;
					} else if (tamaño >= 30 && tamaño <= 50) {
						var fontSize = 13;
					} else if (tamaño >= 26 && tamaño < 30) {
						var fontSize = 12;
					} else {
						var fontSize = 11;
					}
					var colorClusterE = capaGeoJSON.cluster.colorExterior.replace("rgb(","rgba(").replace(")","," + capaGeoJSON.cluster.opacidadExterior + ")");
					var colorClusterI = capaGeoJSON.cluster.colorInterior.replace("rgb(","rgba(").replace(")","," + capaGeoJSON.opacidad + ")");
					html += "<div style='display:flex;align-items:center;margin:2px 2px 2px 0px;font-size:11px;'><div style='background-color: " + colorClusterE + ";border-radius: " + borderRadiusE + "px;width: " + tamaño + "px;height:" + tamaño + "px;width: " + tamaño + "px;height:" + tamaño + "px;min-width: " + tamaño + "px;min-height:" + tamaño + "px;opacity: 1;'><div style='background-color: " + colorClusterI + "; border-radius: " + borderRadiusI + "px; width: " + anchoAltoInt + "px;height: " + anchoAltoInt + "px;min-width: " + anchoAltoInt + "px;min-height: " + anchoAltoInt + "px;margin-left: " + marginInt + "px;margin-top: " + marginInt + "px;text-align: center;'><span style='font-size: " + fontSize + "px;font-family: RobotoCondensed;line-height: " + anchoAltoInt + "px;color:" + capaGeoJSON.cluster.colorTxt + ";'></span></div></div><div class='IDEVAPILeyenda'>" + tituloCluster + "</div></div>";	
				}
			}
			var ElemTitulo = "";
			//Capa con estilos por valores y con/sin título
			if (estilo[i].length >= 3 ) {
				var ElemEstilo = estilo[i][2];
				//Capa con estilos por valores sin título
				if (estilo[i].length == 4 ) {ElemTitulo = estilo[i][3];}
			//Capa con estilo simple y título
			} else if (estilo[i].length == 2 ) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = estilo[i][1];
			//Capa con estilo simple sin título
			} else if (estilo[i].length == 1 ) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = capaGeoJSON.titulo;
			} else {
				console.log("El número de elementos del estilo no es 1 ni 3");
				return;
			}
			if (ElemTitulo.split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") {ElemTitulo = ElemTitulo.split(";")[0];} else if (IDEVAPI_global.idioma == "va"){ElemTitulo = ElemTitulo.split(";")[1];} else {ElemTitulo = ElemTitulo.split(";")[1];}
			}
			//Se inserta un margen superior a la leyenda, si no hay cluster y el primer div
			if (i==0 && !capaGeoJSON.cluster.activo) {var margenSup = "2";} else {var margenSup = "0";}
			//Estilo con Imagen
			if (ElemEstilo.iconUrl !== undefined) {
				if (ElemEstilo.iconSize !== undefined) {
					imgAncho = ElemEstilo.iconSize[0];
					imgAlto = ElemEstilo.iconSize[1];
				} else {
					imgAncho = 30;
					imgAlto = 30;
				}
				html += "<div style='display:flex;align-items:center;margin:" + margenSup + "px 2px 2px 0px;font-size:11px;'><img style='width:" + imgAncho + "px;height:" + imgAlto + "px;margin-right:3px;' src='" + ElemEstilo.iconUrl + "'/><div class='IDEVAPILeyenda'>" + ElemTitulo + "</div></div>";
			//Estilo circular
			} else {
				var anchoAlto = (Number(ElemEstilo.radius)*2)-(Number(ElemEstilo.weight)*2);
				var radioBorde = (anchoAlto/2)+Number(ElemEstilo.weight);
				html += "<div style='display:flex;align-items:center;margin:" + margenSup + "px 2px 2px 6px;font-size:11px;'><div style='background-color: " + ElemEstilo.fillColor + ";border-radius:" + radioBorde + "px;min-width: " + anchoAlto + "px;min-height:" + anchoAlto + "px;border: " + ElemEstilo.weight + "px solid " + ElemEstilo.color + ";opacity: " + ElemEstilo.fillOpacity + ";'></div><div class='IDEVAPILeyenda'>" + ElemTitulo + "</div></div>";
			}
			if (i==estilo.length-1){
				html += "</div>";
			}
		}
	}
	return html;
}

function creaLeyendaWMS (html,capaWMS,capaL){
	var idCapa = capaWMS.id;
	if ((capaL == undefined) || (capaL == idCapa)) {
		var capasIds = "";
		var count = 0;
		for (i in capaWMS._source._subLayers) {
			if (count == 0) {
				capasIds += i;
			} else {
				capasIds += "," + i;
			}
			count++;
		}
		//Leyenda de Catastro
		if (capaWMS.url.indexOf("ovc.catastro.meh.es/Cartografia/WMS") !== -1) {
			var url = "https://ovc.catastro.meh.es/Cartografia/WMS/simbolos.png";
		//Leyenda por petición GetLegendGraphic
		} else if (capaWMS.url.indexOf("www.ign.es/wms-inspire/unidades-administrativas") !== -1) {
			var url = "https://www.ign.es/wms-inspire/unidades-administrativas/leyendas/UnidadesAdministrativas.png";
		} else {
			var url = capaWMS._source._url + "version=" + capaWMS.versionServicio + "&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&style=" + capaWMS.estiloServicio + "&layer=" + capasIds + "&format=image/png";
		}
		if (capaWMS.origen == "AGS" || capaWMS.url.indexOf("ovc.catastro.meh.es/Cartografia/WMS") !== -1) {
			if (capaWMS.leyenda.alineacion == "vertical") {
				html += "<div style='display:flex;flex-direction:column;align-items:flex-start;margin:0px 2px 0px 5px;font-size:11px;'><div class='IDEVAPILeyendaTituloCapa'>" + capaWMS.leyenda.titulo + "</div><div><img src='" + url + "'/></div></div>";
			} else {
				html += "<div style='display:flex;align-items:stretch;margin:0px 2px 0px 5px;font-size:11px;'><div><img src='" + url + "'/></div><div>" + capaWMS.leyenda.titulo + "</div></div>";
			}
		} else {
			var htmlGrupo = "";
			if (capaWMS.grupo !== null){
				htmlGrupo = "<span class='IDEVAPILeyendaTituloGrupo 'style='margin-left: 5px;'>" + capaWMS.grupo + "</span>";
			}
			html += "<div>" + htmlGrupo;
			if (capaWMS.leyenda.titulo !== "") {
				html += "<span class='IDEVAPILeyendaTituloCapa' style='margin-left: 5px;'>" + capaWMS.leyenda.titulo + "</span>";
			}
			html += "<img style='display:block;' src='" + url + "'/></div>";
		}
	}
	return html;
}

function creaLeyenda(capasGeoJSON, capasWMS, capasWMTS, capasTree,mapa, capaL){
	var html = "";
	///////////////////////////////// CAPAS GeoJSON /////////////////////////////////////////////////////////
	for (var k in capasGeoJSON) {
		if(mapa.hasLayer(capasGeoJSON[k]) && capasGeoJSON[k].leyenda.activo){
			html = creaLeyendaGeoJSON (html,capasGeoJSON[k],capaL);
		}
	}
	///////////////////////////////// CAPAS WMS /////////////////////////////////////////////////////////
	capasWMS.eachLayer (function (layer){
		if(mapa.hasLayer(layer) && layer.leyenda.activo){
			html = creaLeyendaWMS (html,layer,capaL);
		}
    });

	///////////////////////////////// CAPAS WMTS /////////////////////////////////////////////////////////
	capasWMTS.eachLayer (function (layer){
		if(mapa.hasLayer(layer) && layer.leyenda.activo){
			
			var idCapa = layer.id;
			if ((capaL == undefined) || (capaL == idCapa)) {
				var capasIds = "";
				var count = 0;
				for (i in layer.layer) {
					if (count == 0) {
						capasIds += i;
					} else {
						capasIds += "," + i;
					}
					count++;
				}
				var url = layer.url + "version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + capasIds + "&format=image/png";

				if (layer.origen == "AGS") {
					html += "<div style='display:flex;align-items:center;margin:0px 2px 0px 5px;font-size:11px;'><img src='" + url + "'/>" + layer.titulo + "</div>";
				} else {
					html += "<div><img style='display:block;' src='" + url + "'/></div>";
				}
			}

		}
	});

	///////////////////////////////// CAPAS EN ÁRBOL (GeoJSON y WMS) /////////////////////////////////////////////////////////
	capasTree.eachLayer (function (layer){
		if(mapa.hasLayer(layer) && layer.leyenda.activo){
			///////////////////////////////////////// Capas GeoJSON //////////////////////////////////////////
			if(layer.tipoServicio == "GeoJSON"){
				html = creaLeyendaGeoJSON (html,layer,capaL);
			///////////////////////////////////////// Capas WMS //////////////////////////////////////////
			} else if (layer.tipoServicio == "WMS") {
				html = creaLeyendaWMS (html,layer,capaL);
			}
		}
	});
	return html;
}
