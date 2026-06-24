
function rellenaLeyenda(id, capasGeoJSON, capasWMS, capasWMTS, capasTree, colapsarLeyenda, mapa) {
	var html = creaLeyenda(capasGeoJSON, capasWMS, capasWMTS, capasTree, mapa);
	//Busca el div "leyendaIDEV", y si lo encuentra, añade la leyenda
	if (id == "mapaIDEV") {
		if ($("#leyendaIDEV").length > 0) {
			$("#leyendaIDEV").empty();
			$("#leyendaIDEV").append(html);
		}
	} else {
		if ($("#leyendaIDEV_" + id).length > 0) {
			$("#leyendaIDEV_" + id).empty();
			$("#leyendaIDEV_" + id).append(html);
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
			mapa.controlLeyenda = L.control.leyenda(div, mapa, { position: 'topright', collapsed: colapsarLeyenda }).addTo(mapa);
		}
	}
}

function creaLeyendaGeoJSON(html, capaGeoJSON, capaL) {
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
		var titulo = capaGeoJSON.titulo;
	} else if (capaGeoJSON.leyenda.titulo == "") {
		var titulo = "";
	} else {
		var titulo = capaGeoJSON.leyenda.titulo;
	}
	////////////////////////////////////////////////////////////////////// POLÍGONOS ////////////////////////
	if (tipoGeometria == "Polygon" || tipoGeometria == "MultiPolygon") {
		for (i = 0; i < estilo.length; i++) {
			if (i == 0) {
				html += "<div style='display:flex;flex-direction: column;'>";
				//Título Leyenda
				if (titulo !== "") {
					html += "<div class='idevapi-leyenda-titulo-capa'>" + titulo + "</div>";
				}
			}
			var ElemTitulo = "";
			//Capa con estilos por valores y con/sin título
			if (estilo[i].length >= 3) {
				var ElemEstilo = estilo[i][2];
				//Capa con estilos por valores sin título
				if (estilo[i].length == 4) { ElemTitulo = estilo[i][3]; }
				//Capa con estilo simple y título
			} else if (estilo[i].length == 2) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = estilo[i][1];
				//Capa con estilo simple sin título
			} else if (estilo[i].length == 1) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = capaGeoJSON.titulo;
			} else {
				console.log("El número de elementos del estilo no es 1 ni 3");
				return;
			}
			if (ElemTitulo.split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") { ElemTitulo = ElemTitulo.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { ElemTitulo = ElemTitulo.split(";")[1]; } else { ElemTitulo = ElemTitulo.split(";")[1]; }
			}
			var colorRelleno = ElemEstilo.fillColor;
			var colorLinea = ElemEstilo.color;
			var grosorLinea = ElemEstilo.weight;
			var opacidadRelleno = ElemEstilo.fillOpacity;
			var opacidad = ElemEstilo.opacity;
			html += "<div style='display:flex;align-items:center;margin:0px 2px 2px 6px;font-size:11px;'><div style='background-color: " + colorRelleno + ";width: 12px;height:12px;border: " + grosorLinea + "px solid " + colorLinea + ";opacity: " + opacidadRelleno + ";'></div><div class='idevapi-leyenda'>" + ElemTitulo + "</div></div>";
			if (i == estilo.length - 1) {
				html += "</div>";
			}
		}
		////////////////////////////////////////////////////////////////////// LÍNEAS ////////////////////////
	} else if (tipoGeometria == "LineString" || tipoGeometria == "MultiLineString") {

		////////////////////////////////////////////////////////////////////// PUNTOS ////////////////////////
	} else if (tipoGeometria == "Point" || tipoGeometria == "MultiPoint") {

		if (capaGeoJSON.cluster.tituloLeyenda == "") {
			var prefijo = "";
			if (IDEVAPI_global.idioma == "es") { prefijo = " (Agrupación)"; } else if (IDEVAPI_global.idioma == "va") { prefijo = " (Agrupació)"; } else { prefijo = " (Agrupación)"; }
			var tituloCluster = capaGeoJSON.titulo + prefijo;
		} else {
			var tituloCluster = capaGeoJSON.cluster.tituloLeyenda;
		}
		//Crea el HTML de la Leyenda
		//var html = "";
		for (i = 0; i < estilo.length; i++) {
			if (i == 0) {
				html += "<div style='display:flex;flex-direction: column;'>";
				//Título Leyenda
				if (titulo !== "") {
					html += "<div class='idevapi-leyenda-titulo-capa'>" + titulo + "</div>";
				}
				//Leyenda del cluster
				if (capaGeoJSON.cluster.activo) {
					var tamaño = capaGeoJSON.cluster.tamaño;
					var borderRadiusE = tamaño / 2;
					var anchoAltoInt = tamaño * 0.75;
					var marginInt = (tamaño - anchoAltoInt) / 2;
					var borderRadiusI = anchoAltoInt / 2;
					if (tamaño > 50) {
						var fontSize = 15;
					} else if (tamaño >= 30 && tamaño <= 50) {
						var fontSize = 13;
					} else if (tamaño >= 26 && tamaño < 30) {
						var fontSize = 12;
					} else {
						var fontSize = 11;
					}
					var colorClusterE = capaGeoJSON.cluster.colorExterior.replace("rgb(", "rgba(").replace(")", "," + capaGeoJSON.cluster.opacidadExterior + ")");
					var colorClusterI = capaGeoJSON.cluster.colorInterior.replace("rgb(", "rgba(").replace(")", "," + capaGeoJSON.opacidad + ")");
					html += "<div style='display:flex;align-items:center;margin:2px 2px 2px 0px;font-size:11px;'><div style='background-color: " + colorClusterE + ";border-radius: " + borderRadiusE + "px;width: " + tamaño + "px;height:" + tamaño + "px;width: " + tamaño + "px;height:" + tamaño + "px;min-width: " + tamaño + "px;min-height:" + tamaño + "px;opacity: 1;'><div style='background-color: " + colorClusterI + "; border-radius: " + borderRadiusI + "px; width: " + anchoAltoInt + "px;height: " + anchoAltoInt + "px;min-width: " + anchoAltoInt + "px;min-height: " + anchoAltoInt + "px;margin-left: " + marginInt + "px;margin-top: " + marginInt + "px;text-align: center;'><span style='font-size: " + fontSize + "px;font-family: RobotoCondensed;line-height: " + anchoAltoInt + "px;color:" + capaGeoJSON.cluster.colorTxt + ";'></span></div></div><div class='idevapi-leyenda'>" + tituloCluster + "</div></div>";
				}
			}
			var ElemTitulo = "";
			//Capa con estilos por valores y con/sin título
			if (estilo[i].length >= 3) {
				var ElemEstilo = estilo[i][2];
				//Capa con estilos por valores sin título
				if (estilo[i].length == 4) { ElemTitulo = estilo[i][3]; }
				//Capa con estilo simple y título
			} else if (estilo[i].length == 2) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = estilo[i][1];
				//Capa con estilo simple sin título
			} else if (estilo[i].length == 1) {
				var ElemEstilo = estilo[i][0];
				ElemTitulo = capaGeoJSON.titulo;
			} else {
				console.log("El número de elementos del estilo no es 1 ni 3");
				return;
			}
			if (ElemTitulo.split(";").length > 1) {
				if (IDEVAPI_global.idioma == "es") { ElemTitulo = ElemTitulo.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { ElemTitulo = ElemTitulo.split(";")[1]; } else { ElemTitulo = ElemTitulo.split(";")[1]; }
			}
			//Se inserta un margen superior a la leyenda, si no hay cluster y el primer div
			if (i == 0 && !capaGeoJSON.cluster.activo) { var margenSup = "2"; } else { var margenSup = "0"; }
			//Estilo con Imagen
			if (ElemEstilo.iconUrl !== undefined) {
				if (ElemEstilo.iconSize !== undefined) {
					imgAncho = ElemEstilo.iconSize[0];
					imgAlto = ElemEstilo.iconSize[1];
				} else {
					imgAncho = 30;
					imgAlto = 30;
				}
				html += "<div style='display:flex;align-items:center;margin:" + margenSup + "px 2px 2px 0px;font-size:11px;'><img style='width:" + imgAncho + "px;height:" + imgAlto + "px;margin-right:3px;' src='" + ElemEstilo.iconUrl + "'/><div class='idevapi-leyenda'>" + ElemTitulo + "</div></div>";
				//Estilo circular
			} else {
				var anchoAlto = (Number(ElemEstilo.radius) * 2) - (Number(ElemEstilo.weight) * 2);
				var radioBorde = (anchoAlto / 2) + Number(ElemEstilo.weight);
				html += "<div style='display:flex;align-items:center;margin:" + margenSup + "px 2px 2px 6px;font-size:11px;'><div style='background-color: " + ElemEstilo.fillColor + ";border-radius:" + radioBorde + "px;min-width: " + anchoAlto + "px;min-height:" + anchoAlto + "px;border: " + ElemEstilo.weight + "px solid " + ElemEstilo.color + ";opacity: " + ElemEstilo.fillOpacity + ";'></div><div class='idevapi-leyenda'>" + ElemTitulo + "</div></div>";
			}
			if (i == estilo.length - 1) {
				html += "</div>";
			}
		}
	}
	return html;
}

function creaLeyendaWMS(html, capaWMS, capaL) {
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
				html += "<div style='display:flex;flex-direction:column;align-items:flex-start;margin:0px 2px 0px 5px;font-size:11px;'><div class='idevapi-leyenda-titulo-capa'>" + capaWMS.leyenda.titulo + "</div><div><img src='" + url + "'/></div></div>";
			} else {
				html += "<div style='display:flex;align-items:stretch;margin:0px 2px 0px 5px;font-size:11px;'><div><img src='" + url + "'/></div><div>" + capaWMS.leyenda.titulo + "</div></div>";
			}
		} else {
			var htmlGrupo = "";
			if (capaWMS.grupo !== null) {
				htmlGrupo = "<span class='idevapi-leyenda-titulo-grupo 'style='margin-left: 5px;'>" + capaWMS.grupo + "</span>";
			}
			html += "<div>" + htmlGrupo;
			if (capaWMS.leyenda.titulo !== "") {
				html += "<span class='idevapi-leyenda-titulo-capa' style='margin-left: 5px;'>" + capaWMS.leyenda.titulo + "</span>";
			}
			html += "<img style='display:block;' src='" + url + "'/></div>";
		}
	}
	return html;
}

function creaLeyendaWMTS(html, capaWMTS, capaL) {
	var idCapa = capaWMTS.id;
	if ((capaL == undefined) || (capaL == idCapa)) {
		var capasIds = "";
		var count = 0;
		for (i in capaWMTS.layer) {
			if (count == 0) {
				capasIds += i;
			} else {
				capasIds += "," + i;
			}
			count++;
		}
		var url = capaWMTS.url + "version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + capasIds + "&format=image/png";

		if (capaWMTS.origen == "AGS") {
			html += "<div style='display:flex;align-items:center;margin:0px 2px 0px 5px;font-size:11px;'><img src='" + url + "'/>" + capaWMTS.titulo + "</div>";
		} else {
			html += "<div><img style='display:block;' src='" + url + "'/></div>";
		}
	}
	return html;
}

function obtenerPaneCapa(layer) {
	if (layer.options && layer.options.pane) {
		return layer.options.pane;
	}
	if (layer._source && layer._source.options && layer._source.options.pane) {
		return layer._source.options.pane;
	}
	if (layer._layers) {
		for (var key in layer._layers) {
			if (layer._layers[key] && layer._layers[key].options && layer._layers[key].options.pane) {
				return layer._layers[key].options.pane;
			}
		}
	}
	return null;
}

function obtenerZIndexLeyenda(layer, mapa) {
	var paneName = obtenerPaneCapa(layer);
	if (paneName !== null) {
		var pane = mapa.getPane(paneName);
		if (pane && pane.style && pane.style.zIndex !== "") {
			var z = Number(pane.style.zIndex);
			if (!isNaN(z)) {
				return z;
			}
		}
		var parts = paneName.split("|");
		var zFromName = Number(parts[parts.length - 1]);
		if (!isNaN(zFromName)) {
			return zFromName;
		}
	}
	return -1;
}

function obtenerOrdenLeyenda(layer) {
	if (layer && $.isNumeric(layer.ordenLeyenda)) {
		return Number(layer.ordenLeyenda);
	}
	return null;
}

function añadeCapaLeyendaActiva(destino, mapa, layer, capaL, seq) {
	if (mapa.hasLayer(layer) && layer.leyenda && layer.leyenda.activo) {
		destino.push({
			layer: layer,
			ordenLeyenda: obtenerOrdenLeyenda(layer),
			seq: seq,
			zIndex: obtenerZIndexLeyenda(layer, mapa),
			capaL: capaL
		});
		return seq + 1;
	}
	return seq;
}

function capasLeyendaOrdenadas(capasGeoJSON, capasWMS, capasWMTS, capasTree, mapa, capaL) {
	var resultado = [];
	var vistos = {};
	var seq = 0;

	function agrega(layer) {
		if (!layer) {
			return;
		}
		var stamp = L.stamp(layer);
		if (vistos[stamp]) {
			return;
		}
		vistos[stamp] = true;
		seq = añadeCapaLeyendaActiva(resultado, mapa, layer, capaL, seq);
	}

	for (var k in capasGeoJSON) {
		agrega(capasGeoJSON[k]);
	}
	capasWMS.eachLayer(function (layer) {
		agrega(layer);
	});
	capasWMTS.eachLayer(function (layer) {
		agrega(layer);
	});
	capasTree.eachLayer(function (layer) {
		agrega(layer);
	});

	resultado.sort(function (a, b) {
		if (a.ordenLeyenda !== null && b.ordenLeyenda !== null && a.ordenLeyenda !== b.ordenLeyenda) {
			return a.ordenLeyenda - b.ordenLeyenda;
		}
		if (a.zIndex !== b.zIndex) {
			return b.zIndex - a.zIndex;
		}
		return a.seq - b.seq;
	});

	return resultado;
}

function creaLeyenda(capasGeoJSON, capasWMS, capasWMTS, capasTree, mapa, capaL) {
	var html = "";
	var capasOrdenadas = capasLeyendaOrdenadas(capasGeoJSON, capasWMS, capasWMTS, capasTree, mapa, capaL);

	for (var i = 0; i < capasOrdenadas.length; i++) {
		var layer = capasOrdenadas[i].layer;
		if (layer.tipoServicio == "GeoJSON") {
			html = creaLeyendaGeoJSON(html, layer, capaL);
		} else if (layer.tipoServicio == "WMTS") {
			html = creaLeyendaWMTS(html, layer, capaL);
		} else if (layer.tipoServicio == "WMS") {
			html = creaLeyendaWMS(html, layer, capaL);
		}
	}
	return html;
}
