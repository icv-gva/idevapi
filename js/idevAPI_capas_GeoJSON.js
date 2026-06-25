var ordenElemGeoJSON = 0;
let layersInternasGeoJson = [];

//////////////////////////////////////////// ETIQUETAS Para capas GeoJSON /////////////////////////////////////////
// Añade etiquetas a las capas GeoJSON
function etiquetaGeoJSON (feature, layer,etiqueta) {
	//if (feature.geometry.type == "Polygon") {

	//} else if (feature.geometry.type == "Point") {
		if (etiqueta.clases !== ""){
			for (var i = 0; i < etiqueta.clases.length; i++) {
				//var centroide = turf.centroid(feature);
				//var puntoPoligono = turf.pointOnFeature(feature);
				//console.log(centroide);
				//var lat1 = feature.properties.lat_etiq;
				//var lon1 = feature.properties.lon_etiq;
				//var latlng1 = L.latLng(lat1, lon1);

				if (etiqueta.clases[i].posicion !== undefined) {
					var posicion = etiqueta.clases[i].posicion;
				} else {
					var posicion = [0,0];
				}
				var opacidad = etiqueta.clases[i].opacidad;
				//Toda la capa tiene el mismo estilo de etiqueta
				if (etiqueta.clases[i].clase == undefined) {
					var valor = feature.properties[etiqueta.clases[i].campo];
					var campo = etiqueta.clases[i].campo;
					var toolt = layer.bindTooltip(valor, {permanent:true,opacity:opacidad,position:posicion,direction:'center',className: 'leaflet-tooltip2 estiloEtiquetas_' + campo}).addTo(map);
					toolt.openTooltip();
					//toolt.openTooltip(latlng1);
					/*$('head').append('<style type="text/css">.estiloEtiquetas_zoom1 {font-size: 9px;}</style>');
					$('head').append('<style type="text/css">.estiloEtiquetas_zoom2 {font-size: 10px;}</style>');
					$('head').append('<style type="text/css">.estiloEtiquetas_zoom3 {font-size: 12px;}</style>');
					map.once('zoomend', function () {
						var zoomLevel = map.getZoom();
						layer.unbindTooltip();
						//toolt._tooltip.options.className = toolt._tooltip.options.className + " estiloEtiquetas_zoom";
						//toolt._tooltip.update();
						//console.log(toolt._tootip);
						//console.log(toolt.getContent());
						//var tooltip = $('.leaflet-tooltip');
					
						switch (zoomLevel) {
							case 11:
								toolt = layer.bindTooltip(valor, {permanent:true,opacity:opacidad,direction:'center',className: 'leaflet-tooltip2 estiloEtiquetas_' + campo + ' estiloEtiquetas_zoom2'}).addTo(map);
								toolt.openTooltip(latlng2);
								break;
							case 12:
								toolt = layer.bindTooltip(valor, {permanent:true,opacity:opacidad,direction:'center',className: 'leaflet-tooltip2 estiloEtiquetas_' + campo + ' estiloEtiquetas_zoom2'}).addTo(map);
								toolt.openTooltip(latlng2);
								break;
							case 13:
							case 14:
							case 15:
							case 16:
							case 17:
							case 18:
							case 19:
							case 20:
								var toolt = layer.bindTooltip(valor, {permanent:true,opacity:opacidad,direction:'center',className: 'leaflet-tooltip2 estiloEtiquetas_' + campo + ' estiloEtiquetas_zoom3'}).addTo(map);
								toolt.openTooltip(latlng2);
								break;
							default:
								//tooltip.css('font-size', 14);
						}
					});*/
				//Los estilo de etiqueta dependen de lo definido en etiqueta.clases.clase [campo,valor]
				} else if (feature.properties[etiqueta.clases[i].clase[0]] == etiqueta.clases[i].clase[1]) {
					layer.bindTooltip(feature.properties[etiqueta.clases[i].campo], {permanent:true,opacity:opacidad,direction:'center',offset:offsetEtiq,className: 'leaflet-tooltip2 estiloEtiquetas_' + etiqueta.clases[i].clase[0] + etiqueta.clases[i].clase[1]}).openTooltip(layer,latlng);
				}
			}
		}
	//}
}


//////////////////////////////  CAPAS GeoJSON  //////////////////////////////////////////////////////////////////////////////////
//Añade las capa GeoJSON (de AGS, MS, de archivos GeoJSON o de GeoJSON definido en index.html)
function añadeCapaGeoJSON(contador,mapa,idCapa,data,capa,tipoArbol,servicios,capasGeoJSON,capasNormales,datosTabla) {
//////////////// MANEJA ALIAS DEL INFO. Se añaden nuevas propiedades a los elementos: "propertiesAlias"
	//Se almacenan los valores en una nueva propiedad "propertiesAlias" en orden definido en tablaInfo.alias
	if ((capa.tablaInfo.alias !== undefined) && (capa.tablaInfo.alias !=="")) {
		for (var i in data.features) {
			var feat = data.features[i];
			var aliasAux = {};
			for (var prop in capa.tablaInfo.alias) {
				var prefijo = "";
				var sufijo = "";
				var tipo = "";
				var paramsExtra = "";
				if (prop.split("|").length > 1) {
					paramsExtra = prop.split("|")[1];
					var propCampo = prop.split("|")[0];
					if (IDEVAPI_global.idioma == "es") {
						prefijo = eval(paramsExtra.split(";")[0])[0];
						sufijo =  eval(paramsExtra.split(";")[1])[0];
						tipo = eval(paramsExtra.split(";")[2])[0];
					} else {
						prefijo = eval(paramsExtra.split(";")[0])[1];
						sufijo =  eval(paramsExtra.split(";")[1])[1];
						tipo = eval(paramsExtra.split(";")[2])[1];
					}
					var alias = capa.tablaInfo.alias[prop];
					prop = propCampo;
				} else {
					var alias = capa.tablaInfo.alias[prop];
				}

				if (tipo !== ""){
					//Listado de posibles valores [NumMiles]
					if (tipo == "NumMiles") {
						var valorNuevo = prefijo + new Intl.NumberFormat('es-ES').format(feat.properties[prop]) + sufijo;
					}
				} else {
					var valorNuevo = prefijo + feat.properties[prop] + sufijo;
				}
				aliasAux[alias] = valorNuevo;
			}
			feat.propertiesAlias = aliasAux;
		}
	}
	//////////////// MANEJA ESTILOS DEL INFO. Se añaden nuevas estilos a las celdas con valores de la tabla
	//Se almacenan los valores del estilo en una nueva propiedad "estiloCampo"
	if ((capa.tablaInfo.estiloCampo !== undefined) && (capa.tablaInfo.estiloCampo !=="")) {
		var estiloCampoAux = {};
		for (var prop in capa.tablaInfo.estiloCampo) {
			if ((capa.tablaInfo.alias !== undefined) && (capa.tablaInfo.alias !=="")) {
				for (var prop2 in capa.tablaInfo.alias) {
					if (prop == prop2) {
						var alias = capa.tablaInfo.alias[prop];
						estiloCampoAux[alias] = capa.tablaInfo.estiloCampo[prop];
					}
				}
			} else {
				estiloCampoAux[prop] = capa.tablaInfo.estiloCampo[prop];
			}
		}
		for (var i in data.features) {
			var feat = data.features[i];

			feat.estiloCampo = estiloCampoAux;
		}
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var tipoGeometria = data.features[0].geometry.type;
	/////////////////////////////////////////////////// GeoJSON PUNTOS ////////////////////////////////////////////////////
	if (tipoGeometria == "Point") {
		function devuelveEstilo (estilo,feature,latlng,idPane) {
			for(i = 0; i < estilo.length; i++){
				//Se dibuja por valores de un campo. estilo tiene 3 o 4 valores ['campo','valor','estilo'] o  ['campo','valor','estilo',titulo']
				if (estilo[i].length >= 3 ) {
					var campo = estilo[i][0];
					if (feature.properties[campo] !== undefined){
						//estilo[i][1]
						var listaCampos = [];
						if ($.isArray(estilo[i][1])) {
							listaCampos = estilo[i][1];
						} else {
							listaCampos.push(estilo[i][1]);
						}
						for(j = 0; j < listaCampos.length; j++){
							//if (feature.properties[campo] == estilo[i][1]){
							if (feature.properties[campo] == listaCampos[j]){
								if (capa.estilo[i][2].iconUrl !== undefined) {
									var myIcon = new L.icon(capa.estilo[i][2]);
									return L.marker(latlng, {
										pane: "capaGeoJSON|" + idPane,
										icon: myIcon
									});
								} else {
									estilo[i][2].pane = "capaGeoJSON|" + idPane;
									return L.circleMarker(latlng,estilo[i][2]);
								}
							}
						}
					}
				//Se dibuja un único símbolo, con o sin título
				} else if (estilo[i].length == 1 || estilo[i].length == 2) {
					if (capa.estilo[i][0].iconUrl !== undefined) {
						var myIcon = new L.icon(capa.estilo[i][0]);
						return L.marker(latlng, {
							pane:"capaGeoJSON|" + idPane,
							icon: myIcon
						});
					//Símbolo circular [[{radius:8,stroke: true,width:1,opacity:1,color:'rgb(150,150,0)',fill: true,fillColor:'rgb(255,255,0)',fillOpacity:1}]]
					} else {
						estilo[i][0].pane = "capaGeoJSON|" + idPane;
						return L.circleMarker(latlng,estilo[i][0]);
					}
				}
				
			}
		}

		var idPane = idCapa + "|" + (paneZIndexCapas-contador);
		
		if (mapa.getPane("capaGeoJSON|" + idPane) == undefined) {
			mapa.createPane("capaGeoJSON|" + idPane);
			mapa.getPane("capaGeoJSON|" + idPane).style.zIndex = (paneZIndexCapas-contador);
		}
		//var geoJsonLayer = L.Proj.geoJson(data, {
		var geoJsonLayer = L.geoJson(data, {
			pointToLayer: function (feature, latlng) {
				return devuelveEstilo(capa.estilo,feature,latlng,idPane)
			},
			onEachFeature: function (feature, layer) {
				if (capa.tablaInfo.activo) {
					popupGeoJSON (feature,layer,capa.tablaInfo);
				}
				//Configura orden de visualización de los elementos GeoJSON
				//Por defecto se ordena según orden de la tabla
				if (layer.options.zIndexOffset !== undefined) {
					layer.setZIndexOffset(ordenElemGeoJSON);
					ordenElemGeoJSON++;
				}
				//Si está configurado un orden personalizado
				if (capa.ordenVis.activo) {
					if (capa.ordenVis.elementos !== undefined) {
						for (i = capa.ordenVis.elementos.length-1; i >= 0; i--){
							var campo = capa.ordenVis.elementos[i][0];
							var valor = capa.ordenVis.elementos[i][1];
							var ordenElem = 1000;
							if (feature.properties[campo] !== undefined) {
								if (feature.properties[campo] == valor) {
									layer.setZIndexOffset(ordenElem);
									ordenElem = ordenElem + 1000;
								}
							}
						}
					}
				}
				if (capa.etiqueta.activo) {
					etiquetaGeoJSON (feature,layer,capa.etiqueta);
				}
			}
		});
		//////////////////////// Añadimos nuevas propiedades a las capas ////////////////////
		geoJsonLayer.id = idCapa;
		geoJsonLayer.idInterno = capa.idInterno;
		geoJsonLayer.url = capa.servicio.url;
		geoJsonLayer.titulo = capa.titulo;
		geoJsonLayer.origen = capa.servicio.origen;
		geoJsonLayer.idVisor = capa.servicio.idVisor;
		geoJsonLayer.capas = capa.capas;
		geoJsonLayer.visibleInicio = capa.visibleInicio;
		geoJsonLayer.opacidad = capa.opacidad;
		geoJsonLayer.tipoGeometria = tipoGeometria;
		geoJsonLayer.estilo = capa.estilo;
		geoJsonLayer.cluster = capa.cluster;
		geoJsonLayer.tipoServicio = capa.tipo;
		geoJsonLayer.featureCollection = data;
		geoJsonLayer.tablaInfo = capa.tablaInfo;
		geoJsonLayer.actualizaDatos = capa.actualizaDatos;
		if (datosTabla !== undefined) {geoJsonLayer.datosTabla = datosTabla;}
		geoJsonLayer.filtro = capa.filtro;
		geoJsonLayer.filtroInicial = capa.filtroInicial;
		geoJsonLayer.leyenda = capa.leyenda;
		////////////////////////////////////////// Capa Cluster /////////////////////////////////////////////////
		if (capa.cluster.activo) {
			var colorClusterE = capa.cluster.colorExterior.replace("rgb(","rgba(").replace(")","," + capa.cluster.opacidadExterior + ")");
			var colorClusterI = capa.cluster.colorInterior.replace("rgb(","rgba(").replace(")","," + capa.opacidad + ")");
			var idCSS = idCapa.replace(";","-").replace(".","_");
			var tamaño = capa.cluster.tamaño;
			var borderRadiusE = tamaño/2;
			var anchoAltoInt = tamaño*0.75;
			var lineHeightTxt = tamaño*0.8;
			var marginInt = (tamaño-anchoAltoInt)/2;
			var borderRadius = anchoAltoInt/2;
			if (tamaño > 50) {
				var fontSize = 15;
			} else if (tamaño >= 30 && tamaño <= 50) {
				var fontSize = 13;
			} else if (tamaño >= 26 && tamaño < 30) {
				var fontSize = 12;
			} else if (tamaño >= 24 && tamaño < 26) {
				var fontSize = 11;
			} else {
				var fontSize = 10;
			}
			//Se define el Pane para recoger los clusters
			if (mapa.getPane("capaGeoJSONCluster|" + idPane) == undefined) {
				mapa.createPane("capaGeoJSONCluster|" + idPane);
				mapa.getPane("capaGeoJSONCluster|" + idPane).style.zIndex = (paneZIndexCapas-contador);
			}
			//Se definen los estilos personalizados del Cluster
			$('head').append('<style type="text/css">.marker-micluster-'  + idCSS + ' {background-color: ' + colorClusterE + ';border-radius: ' + borderRadiusE + 'px;} .marker-micluster-'  + idCSS + ' div {width:'  + anchoAltoInt + 'px ; height:'  + anchoAltoInt + 'px; margin-left:'  + marginInt + 'px ; margin-top:'  + marginInt + 'px; border-radius:'  + borderRadius + 'px ;background-color: ' + colorClusterI + ';color: ' + capa.cluster.colorTxt + ';} .marker-micluster-'  + idCSS + ' div span{line-height:' + lineHeightTxt + 'px; font-family:ArialNarrowBold; font-size:' + fontSize + 'px;}</style>');
			var markerCluster = L.markerClusterGroup.layerSupport({
				clusterPane: "capaGeoJSONCluster|" + idPane,
				maxClusterRadius: capa.cluster.radio,	//Radio para agrupar en pixeles
				singleMarkerMode: capa.cluster.mostrar1Elem,	//No dibuja icono cuando es 1 elemento
				spiderfyOnMaxZoom: capa.cluster.spiderfy,
				//zoomToBoundsOnClick:false,
				iconCreateFunction: function(cluster) {	//Función que crea el icono del cluster
					var childCount = cluster.getChildCount();
					return new L.DivIcon({ html: '<div id="'+ idCapa + '"><span>' + childCount + '</span></div>', className: 'marker-cluster marker-micluster-'  + idCSS, iconSize: new L.Point(tamaño, tamaño) });
				}
			});
			markerCluster.addTo(mapa);
			markerCluster.checkIn(geoJsonLayer);
			mapa.addLayer(markerCluster);
			//
			popupGeoJSONCluster(markerCluster,capa.tablaInfo);
		}
		/////////////////////////////////////////// TOC anidado / no anidado ////////////////////////////////////////////////////
		//Si hay TOC anidado
		if(capa.TOCNivel1 !== null && capa.TOCNivel2 !== null){
			capasAHojas(tipoArbol, servicios, capa.TOCNivel2, capa.TOCNivel1, geoJsonLayer, capa.titulo, contador, controlCapa.GCapasTree);
		//Si el TOC es NO anidado
		} else {
			if (capa.TOCVisible) {
				capasNormales.push({label: capa.titulo, layer: geoJsonLayer, mostrarChecbox: true});
			}
			capasGeoJSON.push(geoJsonLayer);
			layersInternasGeoJson.push(geoJsonLayer);
			geoJsonLayer.addTo(mapa);
		}
	/////////////////////////////////////////////////// GeoJSON POLÍGONOS ////////////////////////////////////////////////////
	} else if (tipoGeometria == "Polygon" || tipoGeometria == "MultiPolygon") {
		
		var idPane = idCapa + "|" + (paneZIndexCapas-contador);
		if (mapa.getPane("capaGeoJSON|" + idPane) == undefined) {
			mapa.createPane("capaGeoJSON|" + idPane);
			mapa.getPane("capaGeoJSON|" + idPane).style.zIndex = (paneZIndexCapas-contador);
		}

		function devuelveEstiloPoly (feature,estilo) {
			if (capa.estilo[0].length == 1) {
				return estilo[0][0];
			} else if (capa.estilo[0].length > 1) {

				for(i = 0; i < estilo.length; i++){
					//Si el estilo se define según valores de campo
					if (estilo[i].length >= 3 ) {
						var campo = estilo[i][0];
						if (feature.properties[campo] !== undefined){
							//estilo[i][1]
							var listaCampos = [];
							if ($.isArray(estilo[i][1])) {
								listaCampos = estilo[i][1];
							} else {
								listaCampos.push(estilo[i][1]);
							}
							for(j = 0; j < listaCampos.length; j++){
								if (feature.properties[campo] == listaCampos[j]){
									return estilo[i][2];
									
								}
							}
						}
					}
				}
			}
		}

		var geoJsonLayer = L.geoJson(data, {
			pane: "capaGeoJSON|" + idPane,
			onEachFeature: function (feature, layer) {
				if (capa.tablaInfo.activo) {
					popupGeoJSON (feature,layer,capa.tablaInfo);
				}
				if (capa.etiqueta.activo) {
					etiquetaGeoJSON (feature,layer,capa.etiqueta);
					//layer.bindTooltip(feature.properties['acc_grado'], {permanent:true,direction:'center',offset:[0, 0],className: etiqueta.clases[i].clase[0]}).openTooltip();
					//layer.bindTooltip(feature.properties['acc_grado'], {permanent:true,direction:'center',offset:[0, 0],className: 'estiloEtiquetas' + etiqueta.clases[i].clase[0] + etiqueta.clases[i].clase[1]}).openTooltip();
				}
			},
			style: function (feature) {
				var estilo = devuelveEstiloPoly (feature,capa.estilo);
				return estilo;
			}
		});
		//////////////////////// Añadimos nuevas propiedades a las capas ////////////////////
		geoJsonLayer.id = idCapa;
		geoJsonLayer.idInterno = capa.idInterno;
		geoJsonLayer.url = capa.servicio.url;
		geoJsonLayer.titulo = capa.titulo;
		geoJsonLayer.origen = capa.servicio.origen;
		geoJsonLayer.idVisor = capa.servicio.idVisor;
		geoJsonLayer.capas = capa.capas;
		geoJsonLayer.visibleInicio = capa.visibleInicio;
		geoJsonLayer.opacidad = capa.opacidad;
		geoJsonLayer.tipoGeometria = tipoGeometria;
		geoJsonLayer.cluster = capa.cluster;
		geoJsonLayer.estilo = capa.estilo;
		geoJsonLayer.tipoServicio = capa.tipo;
		geoJsonLayer.featureCollection = data;
		geoJsonLayer.tablaInfo = capa.tablaInfo;
		geoJsonLayer.actualizaDatos = capa.actualizaDatos;
		if (datosTabla !== undefined) {geoJsonLayer.datosTabla = datosTabla;}
		geoJsonLayer.filtro = capa.filtro;
		geoJsonLayer.filtroInicial = capa.filtroInicial;
		geoJsonLayer.leyenda = capa.leyenda;

		/////////////////////////////////////////// TOC anidado / no anidado ////////////////////////////////////////////////////
		//Si hay TOC anidado
		if(capa.TOCNivel1 !== null && capa.TOCNivel2 !== null){
			capasAHojas(tipoArbol, servicios, capa.TOCNivel2, capa.TOCNivel1, geoJsonLayer, capa.titulo, contador, controlCapa.GCapasTree);
		//Si el TOC es NO anidado
		} else {
			if (capa.TOCVisible) {
				capasNormales.push({label: capa.titulo, layer: geoJsonLayer, mostrarChecbox: true});
			}
			capasGeoJSON.push(geoJsonLayer);
			layersInternasGeoJson.push(geoJsonLayer);
			geoJsonLayer.addTo(mapa);
		}
	/////////////////////////////////////////////////// GeoJSON LÍNEAS ////////////////////////////////////////////////////
	} else if (tipoGeometria == "LineString") {

		var idPane = idCapa + "|" + (paneZIndexCapas-contador);
		
		if (mapa.getPane("capaGeoJSON|" + idPane) == undefined) {
			mapa.createPane("capaGeoJSON|" + idPane);
			mapa.getPane("capaGeoJSON|" + idPane).style.zIndex = (paneZIndexCapas-contador);
		}

		var geoJsonLayer = L.geoJson(data, {
			pane: "capaGeoJSON|" + idPane,
			onEachFeature: function (feature, layer) {
				if (capa.tablaInfo.activo) {
					popupGeoJSON (feature,layer,capa.tablaInfo);
				}
				if (capa.etiqueta.activo) {
					etiquetaGeoJSON (feature,layer,capa.etiqueta);
				}
			}
		});
		//////////////////////// Añadimos nuevas propiedades a las capas ////////////////////
		geoJsonLayer.id = idCapa;
		geoJsonLayer.idInterno = capa.idInterno;
		geoJsonLayer.url = capa.servicio.url;
		geoJsonLayer.titulo = capa.titulo;
		geoJsonLayer.origen = capa.servicio.origen;
		geoJsonLayer.idVisor = capa.servicio.idVisor;
		geoJsonLayer.capas = capa.capas;
		geoJsonLayer.visibleInicio = capa.visibleInicio;
		geoJsonLayer.opacidad = capa.opacidad;
		geoJsonLayer.tipoGeometria = tipoGeometria;
		geoJsonLayer.cluster = capa.cluster;
		geoJsonLayer.estilo = capa.estilo;
		geoJsonLayer.tipoServicio = capa.tipo;
		geoJsonLayer.featureCollection = data;
		geoJsonLayer.tablaInfo = capa.tablaInfo;
		geoJsonLayer.actualizaDatos = capa.actualizaDatos;
		if (datosTabla !== undefined) {geoJsonLayer.datosTabla = datosTabla;}
		geoJsonLayer.filtro = capa.filtro;
		geoJsonLayer.filtroInicial = capa.filtroInicial;
		geoJsonLayer.leyenda = capa.leyenda;
		//Se asigna el estilo (por ahora solo permite un único estilo)
		geoJsonLayer.setStyle(capa.estilo[0][0]);
		/////////////////////////////////////////// TOC anidado / no anidado ////////////////////////////////////////////////////
		//Si hay TOC anidado
		if(capa.TOCNivel1 !== null && capa.TOCNivel2 !== null){
			capasAHojas(tipoArbol, servicios, capa.TOCNivel2, capa.TOCNivel1, geoJsonLayer, capa.titulo, contador, controlCapa.GCapasTree);
		//Si el TOC es NO anidado
		} else {
			if (capa.TOCVisible) {
				capasNormales.push({label: capa.titulo, layer: geoJsonLayer, mostrarChecbox: true});
			}
			capasGeoJSON.push(geoJsonLayer);
			layersInternasGeoJson.push(geoJsonLayer);
			geoJsonLayer.addTo(mapa);
		}
	}

}

function actualizaCapaIntervalo3FiltroGeoJSON (data,capa){
	if (data !== undefined) {
		//Aplica FILTRO INICIAL si hay
		if (capa.filtroInicial !== null) {
			//var resultados = data.features;
			var resTotal = [];
			for (var i = 0; i < capa.filtroInicial.length; i++) {
				var campo = capa.filtroInicial[i][0];
				var valor = capa.filtroInicial[i][1];
				var tipo = capa.filtroInicial[i][2];
				datosParciales = filtroGeoJSON(data,campo,valor,tipo);
				resTotal = resTotal.concat(datosParciales.features);
			}
			if (resTotal.length > 0) {
				var resTotal2 = {};
				resTotal2.type = "FeatureCollection";
				resTotal2.features = resTotal;
			}
		}
		data=resTotal2;
		return data;
	}
}

function actualizaCapaIntervalo3 (data,capa){

	if (data !== undefined) {
		//Aplica selección FILTROS, si los hay
		var valores = [];
		capa.filtro.selects.forEach(function(sel){
			var res = $("body").find('#' + sel[0]);
			if (res.length > 0) {selectCapa = res[0];} else {return;}
			if ($(selectCapa).val() == ""){var valor = null}else{var valor=$(selectCapa).val()}
			valores.push(valor);
		});

		for (var m = 0; m < valores.length; m++) {
			//console.log(valores[m]);
			if (valores[m] !== null) {
				data = filtroGeoJSON (data,capa.filtro.selects[m][1],valores[m]);
			}
		}
		// MODIFICACIÓN COORDENADAS PUNTOS. Hecho para modificar estaciones Red ERVA
		/*if (modCoords !== undefined) {
			data = modificaCoordenadas (modCoords,data,"identificador");
		}*/
		//ACTUALIZA la capa
		capa = actualizaFiltroCapaGeoJSON(capa,data);
		//capa.clearLayers();
		//capa.addData(data);
	}
}

///////// ACTUALIZACIÓN de las capas GeoJSON ////////////////////////////////////////////
function actualizaCapaIntervalo2 (capa){
	///////// CAPAS GeoJSON - Origen AGS //////////
	if (capa.origen == "AGS") {
		capa.url = capa.url.replace("/arcgis/services/","/arcgis/rest/services/").replace("/MapServer/WMSServer","/MapServer");
		var consulta = "where=1=1&outFields=*&f=geojson";
		var peticionAGS = $.ajax({
			url:  encodeURI(capa.url + "/" + capa.capas + "/query?" + consulta)
		});
		peticionAGS.done(function(data) {
			//añadeCapaGeoJSON(i,map,idCapa,data,capa,esFija,tipoArbol,controlCapa.servicios,controlCapa.GCapasGeoJSON,controlCapa.capasNormal,datosTabla);
		});
		peticionAGS.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.ErrorAGS + textStatus);
		});
	///////// CAPAS GeoJSON - Origen MS ////////
	} else if (capa.origen == "MS") {
		var peticionPG = $.ajax({
			url:  capa.url,
			type: "GET",
			data: {
				'service':'WFS',
				'request':'GetFeature',
				'version':'2.0.0',
				'typenames': capa.capas,
				'outputFormat': 'geojsonstream',
				'srsName': 'EPSG:4326',
				'filter' : capa.filtroInicial
			}, //campo donde realizar la búsqueda : valor de búsqueda
			dataType: "json"
		});

		peticionPG.done(function(data) {
			actualizaCapaIntervalo3(data,capa);
		});
		peticionPG.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.ErrorGeoJSON + textStatus );
		});
	//////////// CAPAS GeoJSON - Origen BD ////////////
	} else if (capa.origen == "BD") {
		var tabla = capa.url.split(",")[0];		//tm_industria.certificados_energeticos_pol
		var campoId = capa.url.split(",")[1];	//id
		var campoGeom = capa.url.split(",")[2];	//geom
		//var clausWhere = eval(capa[9]);	//"municipio LIKE 'AGOST' AND nombre LIKE 'POLIDEPORTIVO%'";
		var clausWhere = eval(capa.filtroSQL);	//"municipio LIKE 'AGOST' AND nombre LIKE 'POLIDEPORTIVO%'";
		var peticionPG = $.ajax({
			url:  prot + "//descargas.icv.gva.es/server_api/idevapi/sql_select_json_geojson.php?nocache=" + Math.random(),
			type: "POST",
			//data: { 'tabla':'tm_industria.certificados_energeticos_pol','campo1':'mun_nombre', 'valor1':'Aldaia','campo2':'cer_concalificacion', 'valor2':'B'}, //campo donde realizar la búsqueda : valor de búsqueda
			data: {
				'tipo':"geojson",
				'tabla':tabla,
				'id':campoId,
				'geom':campoGeom
				//'where':clausWhere
			}, //campo donde realizar la búsqueda : valor de búsqueda
			dataType: "json"
		});

		peticionPG.done(function(data) {
			//añadeCapaGeoJSON(i,map,idCapa,data,capa,esFija,tipoArbol,controlCapa.servicios,controlCapa.GCapasGeoJSON,controlCapa.capasNormal,datosTabla);
		});

		peticionPG.fail(function(jqXHR, textStatus ) {
			alert(MENSAJES.ErrorGeoJSON + textStatus );
		});

	} else if (capa.origen == "GeoJSON") {
		if (capa.url == "local") {
			if (eval(servicio) !== undefined) {
				//Actualiza el resultado del filtro de la capa
				if (resFiltro.length > 0) {
					capa = actualizaFiltroCapaGeoJSON(capa,eval(servicio));
					//capa.clearLayers();
					//capa.addData(eval(servicio));
				}
			} else {
				alert(MENSAJES.GeoJSONNoDefinido);
			}
		} else {
			var peticionGJ = $.ajax({
				//url:  proxyICV + capa.servicioURL,
				url:  capa.url,
				dataType: "json"
			});
			peticionGJ.done(function(data) {
				var data = actualizaCapaIntervalo3FiltroGeoJSON(data,capa);
				actualizaCapaIntervalo3(data,capa);
			});
			peticionGJ.fail(function(jqXHR, textStatus ) {
				alert(MENSAJES.ErrorGeoJSON + textStatus );
			});
		}
	} else {
		alert(MENSAJES.ErrorOrigenGeoJSON);
		return;
	}
}

function actualizaCapaIntervalo (capas) {
	capas.forEach(function(capa){
		if (capa.actualizaDatos > 0 ) {
			var intervalId = window.setInterval(function(){
				actualizaCapaIntervalo2 (capa);
			}, capa.actualizaDatos*1000);
		}
	});
}

////////////////// EVENTOS FILTROS INPUTS ////////////////////////////////////////////////

//Mostramos u ocultamos imagen de limpiar en filtros de texto, fechas y numéricos
function toggleClearIcon(input) {
	var icon = input.parentElement.querySelector('.inputClearIcon');
	if (icon == null) {
		var icon = input.parentElement.querySelector('.inputClearIconFecha');
	}
	if (input.value.trim() !== '') {
		icon.style.visibility = 'visible';
	} else {
		let allEmpty = [...input.parentElement.querySelectorAll('.inputFiltroTxt, .inputFiltroFechaTxt')].every(el => el.value.trim() === '');
		if (allEmpty) icon.style.visibility = 'hidden';
	}
}

function validarInputNumerico(input, valorMax, valorMin, decimales) {

	toggleClearIcon(input);

	// Permitir solo números y el punto decimal
	input.value = input.value.replace(/[^0-9.]/g, '');

	// Asegurar que no haya más de un punto decimal
	let partes = input.value.split('.');
	if (partes.length > 2) {
		input.value = partes[0] + '.' + partes.slice(1).join('');
	}

	// Aplicar la restricción de decimales
	let regex = new RegExp(`^(\\d+\\.?\\d{0,${decimales}}).*$`);
	input.value = input.value.replace(regex, "$1");

	// Convertir el valor a número para validación de rango
	let valor = parseFloat(input.value);
	
	// Permitir entrada progresiva sin forzar inmediatamente el mínimo
	if (!isNaN(valor)) {
		if (valor > valorMax) input.value = valorMax;
		if (valor < valorMin && input.value.length >= valorMin.toString().length) {
			input.value = valorMin;
		}
	}
}

//// Rellena los filtros definidos para la capa GeoJSON //////////////////////////////////////////////
function rellenaFiltrosCapaGeoJSON(id,mapa,capasGeoJSON) {
	capasGeoJSON.forEach(function(capa){
		//convierteASelect2();
		preparaFiltrosCapas(mapa,capa);
	});	
}

function actualizaFiltroCapaGeoJSON(capa,resFiltro){

	//Limpiamos popups
	Object.values(capa._layers).forEach(layer => {
		if (layer.popupPers) {
			delete layer.popupPers;
		}
	});
	
	let tieneCluster = false;
	if (capa._proxyMcgLayerSupportGroup !== undefined) {
		tieneCluster = true;
		var MCG = capa._proxyMcgLayerSupportGroup;
	}	
	//Limpiamos capa GeoJSON
	capa.clearLayers();
	//Limpiamos capa GeoJSON de MarkerCluster
	//MCG._layers = {};
	if (tieneCluster) {
		Object.keys(MCG._layers).forEach(key => delete MCG._layers[key]);
		//console.log(MCG);
	}

	//Añadimos los datos filtrados a capa GeoJSON
	capa.addData(resFiltro);
	//Añadimos los datos filtrados a capa GeoJSON de MarkerCluster
	if (tieneCluster) {
		MCG.checkIn(capa);
	}

	return capa;

}

//Función que se ejecuta con el cambio de cualquier select o input del filtro
function actualizaFiltroCambio (capa,evt) {
	$("#cargandoMapa_" + capa._map.id).show();
	setTimeout(function(){	//Se ejecuta en Timeout para que se vea el icono de Cargando Capa
	var objecto = $(evt.currentTarget);

	//*********** Se recogen valores *********************************************************************
	//Se itera por todos los inputs del filtro y se guardan los valores seleccionados
	var valoresInput = [];
	capa.filtro.inputs.forEach(function(input){
		var res = $("body").find('#' + input.id);
		if (res.length > 0) {var inpDOM = res[0];} else {return;}
		if (input.tipo == 'fecha') {
			var inputCapa1 = $(inpDOM).find("input:first");
			var inputCapa2 = $(inpDOM).find("input:last");
			if ($(inputCapa1).val() == "" && $(inputCapa2).val() == "") {
				var valor = null;
				valoresInput.push(valor);
			} else {
				var valor1 = $(inputCapa1).val();
				var valor2 = $(inputCapa2).val();
				valoresInput.push([valor1,valor2]);
			}
		} else {
			var inputCapa = $(inpDOM).find("input:first");
			if ($(inputCapa).val() == ""){var valor = null}else{var valor=$(inputCapa).val()}
			valoresInput.push(valor);
		}
	});
	//Se itera por todos los selects del filtro y se guardan los valores seleccionados
	var valoresSelect = [];
	capa.filtro.selects.forEach(function(sel2){
		var res2 = $("body").find('#' + sel2.select);
		if (res2.length > 0) {var selectCapa2 = res2[0];} else {return;}
		if ($(selectCapa2).val() == ""){var valor = null}else{var valor=$(selectCapa2).val()}
		valoresSelect.push(valor);
	});

	//*********** Se realiza los filtros recorriendo los valores *********************************************************************
	var resFiltro = capa.featureCollection.features; //Se inicializa filtro con TODOS los valores

	//Se filtra por los valores de los INPUTS
	//var contadorNoNulos = 0;//Contador de valores no nulos
	//var contadorNoNulosInputs = 0;//Contador de valores no nulos
	for (var m = 0; m < valoresInput.length; m++) {
		//Si es null, no hace filtro con ese valor
		if (valoresInput[m] !== null) {	
			let tipo = capa.filtro.inputs[m].tipo;
			if (tipo === 'numero') {
				let operador = capa.filtro.inputs[m].operador;
				resFiltro = filtroGeoJSON (resFiltro,capa.filtro.inputs[m].campo,valoresInput[m],'numero',operador);
			} else if (tipo === 'texto') {
				resFiltro = filtroGeoJSON (resFiltro,capa.filtro.inputs[m].campo,valoresInput[m],'texto');
			} else if (tipo === 'fecha'){
				resFiltro = filtroGeoJSON (resFiltro,capa.filtro.inputs[m].campo,valoresInput[m],'fecha');
			}
		}
	}

	//Se filtra por los valores de los SELECT
	//Se guardan los arrays de valores para mostrar los valores en los select
	var selectQueCambia = objecto.attr('id');
	//var numSelects = 0;
	for (var m = 0; m < valoresSelect.length; m++) {
		//Si es null, no hace filtro con ese valor
		if (valoresSelect[m] !== null) {
			//SELECT MULTIPLE
			if (capa.filtro.selects[m].tipo === 'multiple') {
				var resFiltroParcial = [];
				for (var n = 0; n < valoresSelect[m].length; n++) {
					// Concatenamos filtros solo para valores multiples con más de 1 seleción
					if (n != 0) {
						resFiltroParcial = resFiltroParcial.concat(filtroGeoJSON (resFiltro,capa.filtro.selects[m].campo,valoresSelect[m][n]));	
					//El primer valor del select multiple
					} else {
						resFiltroParcial = filtroGeoJSON (resFiltro,capa.filtro.selects[m].campo,valoresSelect[m][n]);
					}
					if (n == valoresSelect[m].length - 1) {
						resFiltro = resFiltroParcial;
					}
				}
			//SELECT SIMPLE
			} else {
				resFiltro = filtroGeoJSON (resFiltro,capa.filtro.selects[m].campo,valoresSelect[m]);
			}
		}
	}

	//*********** Se actualizan los selects con la nueva selección *********************************************************************
	capa.filtro.selects.some(function(sel2) {
		var res2 = $("body").find('#' + sel2.select);
		if (res2.length > 0) {var selectCapa2 = res2[0];} else {return;}

		var listadoValoresSelect = [];

		var valorActual = $(selectCapa2).val();
		
		var selectActual = $(selectCapa2).attr('id');
		//Si el select es el actual en el bucle, no se hace nada y pasa al siguiente
		//Esto hace que los valores del select se mantengan después de la selección, para seleccionar otro, pero si el null, vuelve a tener todos los valores posibles
		if (selectQueCambia == selectActual && valorActual !== null) {
			return false;
		//En caso que sean los demás selects, se actualizan con los nuevos valores únicos
		} else {
			listadoValoresSelect = resFiltro;
		}

		var valoresUnicos = unique(listadoValoresSelect,sel2.campo,sel2.orden);

		//Limpiamos el Select
		selectCapa2.options.length = 0;
		
		$(selectCapa2).attr("placeholder", MENSAJES.Seleccionar);

		//Rellena los Select de valores únicos
		for (var k = 0; k < valoresUnicos.length; k++) {
			var valor = valoresUnicos[k];
			$(selectCapa2).append($('<option>', {
				value: valor,
				text: valor,
				campo: sel2.campo	//Se almacena en el select el campo asociado
			}));
		}
		//Añadimos el valor actual de nuevo
		$(selectCapa2).val(valorActual);
		
	});

	//*********** Se actualiza el resultado del filtro en la capa, re realiza zoom (si hay) y se actualizan estadísticas (si hay) ************************
	if (resFiltro.length >= 0) {
		capa = actualizaFiltroCapaGeoJSON(capa,resFiltro);
		capa.resFiltro = resFiltro;
	}

	//Actualizamos estadísticas
	if (capa.filtro.zoom) {
		zoomAElementosGeoJSON (mapa,capa);
	} else {
		aplicaEstadisticas(mapa, capa, capa.featureCollection.features, capa.resFiltro);
	}
	//Actualizamos tabla
	setTimeout(function() {
		if (capa.datosTabla !== undefined) {
			actualizarDatosTabla();
		}
	}, 100);
	$("#cargandoMapa_" + mapa.id).hide();
	}, 1);
}

//// Preparan los selects: rellena con datos y crea la función al seleccionar elemento y hacer consulta
function preparaFiltrosCapas (mapa,capa) {
	//********************** FECHA
	//capa.originalFeatures = [...capa.featureCollection.features];
	//********************** FECHA
	capa.resFiltro = capa.featureCollection.features;
	//*************************************************************** FILTRO FECHAS ***************************************************************
	// Escolta els inputs de data
	/*capa.filtro.fechas.forEach(function(fec){
				
		var res = $("body").find('#' + fec.id);
		var objFecha;
		if (res.length > 0) {objFecha = res[0];} else {return;}
		//************************************* Evento CHANGE de cada Select ***************************
		$(objFecha).change(function(sel){
			$("#cargandoMapa_" + mapa.id).show();
			setTimeout(function(){	//Se ejecuta en Timeout para que se vea el icono de Cargando Capa
				var idObjQueCambia = sel.target.id;
				filtraFeaturesPorFecha(mapa, capa, idObjQueCambia);
			}, 1);
		});
	});
	*/
	//Código inicial Nexus
  	/*$('#calendario_fecha_inicio, #calendario_fecha_fin').change(function() {
  	  filtraFeaturesPorFecha(mapa, capa);
  	});*/
	//*************************************************************** FIN FILTRO FECHAS ***************************************************************
	
	//Botón Limpiar Filtro (si existe)
	if (capa.filtro.botonLimpiar !== null) {
		var res = $("body").find('#' + capa.filtro.botonLimpiar);
		if (res.length > 0) {
			var botonLimpiar = res[0];
			$(botonLimpiar).click(function() {
				$("#cargandoMapa_" + mapa.id).show();
				setTimeout(function(){	//Se ejecuta en Timeout para que se vea el icono de Cargando Capa

				//Recorre cada Input definido para el filtro de las capas GeoJSON
				capa.filtro.inputs.forEach(function(input){
					var res = $("body").find('#' + input.id);
					var inp;
					if (res.length > 0) {inp = res[0];} else {$("#cargandoMapa_" + mapa.id).hide();return;}

					//Limpiamos los inputs de texto
					var inputs = document.querySelectorAll('.inputFiltro .inputFiltroTxt');
					var clearIcons = document.querySelectorAll('.inputFiltro .inputClearIcon');
					// Recorre todos los inputs y limpia su valor
					inputs.forEach(function(input) {
						input.value = '';
					});
					// Recorre todas las imágenes y oculta el ícono
					clearIcons.forEach(function(icon) {
						icon.style.visibility = 'hidden';
					});

					//Limpiamos los inputs de tipo fecha
					var dateInputs = document.querySelectorAll('.inputFiltroFecha .inputFiltroFechaTxt');
					var clearIconsDate = document.querySelectorAll('.inputFiltroFecha .inputClearIconFecha');
					// Recorre todos los inputs de tipo date y limpia su valor
					dateInputs.forEach(function(input) {
						input.value = '';
					});
					// Recorre todas las imágenes y oculta el ícono
					clearIconsDate.forEach(function(icon) {
						icon.style.visibility = 'hidden';
					});


				});

				//Recorre cada Select definido para el filtro de la Capas GeoJSON
				capa.filtro.selects.forEach(function(sel){
					var valoresUnicos = unique(capa.featureCollection.features,sel.campo,sel.orden);

					var res = $("body").find('#' + sel.select);
					var selectCapa;
					
					if (res.length > 0) {selectCapa = res[0];} else {$("#cargandoMapa_" + mapa.id).hide();return;}

					selectCapa.options.length = 0;
					$(selectCapa).attr("placeholder", MENSAJES.Seleccionar);
					//Rellena los Select pro primera vez de valores únicos
					for (var j = 0; j < valoresUnicos.length; j++) {
						var valor = valoresUnicos[j];
						$(selectCapa).append($('<option>', {
							value: valor,
							text: valor,
							campo: sel.campo	//Se almacena en el select el campo asociado
						}));
					}
					selectCapa.value = MENSAJES.Seleccionar;
				});

				//Actualiza el resultado del filtro de la capa
				if (capa.featureCollection.features.length > 0) {
					capa = actualizaFiltroCapaGeoJSON(capa,capa.featureCollection.features);
					capa.resFiltro = capa.featureCollection.features;
				}
				if (capa.filtro.zoom) {
					zoomAElementosGeoJSON (mapa,capa);
				} else {
					aplicaEstadisticas(mapa, capa, capa.featureCollection.features, capa.featureCollection.features);
				}
				setTimeout(function() {
					if (capa.datosTabla !== undefined) {
						actualizarDatosTabla();
					}
				}, 100);
				$("#cargandoMapa_" + mapa.id).hide();
				}, 1);
			});						
		}
	}
	//************************* CAPAS ARCGIS SERVER ***********************************************/
	//if (capa.origen == "AGS") {
	//////////////////////////////// CAPAS MAP SERVER ///////////////////////////////////////////////////////
	//} else if (capa.origen == "MS") {

	//Calcula en NÚMERO TOTAL de resultados
	/*
	if (capa.filtro.mostrarNumTotal !== null) {
		var casillaTotal = $('#' + capa.filtro.mostrarNumTotal);
		if (casillaTotal.length > 0) {$(casillaTotal).html(capa.featureCollection.features.length);}
	}
	*/

	aplicaEstadisticas(mapa, capa, capa.featureCollection.features, capa.featureCollection.features);
	mapa.on('moveend', function(e) {
		aplicaEstadisticas(mapa, capa, capa.featureCollection.features, capa.resFiltro);  // RECALCULA LAS ESTADÍSTICAS
	});

	//************ Recorre cada SELECT definido para el filtro de la Capas GeoJSON ****************
	capa.filtro.selects.forEach(function(sel){
		var valoresUnicos = unique(capa.featureCollection.features,sel.campo,sel.orden);
		var res = $("body").find('#' + sel.select);
		var selectCapa;
		if (res.length > 0) {selectCapa = res[0];} else {return;}

		selectCapa.options.length = 0;
		$(selectCapa).attr("placeholder", MENSAJES.Seleccionar);
		//Rellena los Select por primera vez de valores únicos
		for (var j = 0; j < valoresUnicos.length; j++) {
			var valor = valoresUnicos[j];
			$(selectCapa).append($('<option>', {
				value: valor,
				text: valor,
				campo: sel.campo,
				tipo: sel.tipo
			}));
		}
		selectCapa.value = MENSAJES.Seleccionar;
//************************************* Se añade Evento CHANGE de cada Select *****************************************************************
		$(selectCapa).change(function(evt){
			actualizaFiltroCambio(capa,evt);
		});
		
	});

	//************ Recorre cada INPUT definido para el filtro de la Capas GeoJSON ****************
	//Función que actualiza el filtro al perder el foco
	function blurEvent(evt) {
		if (!eventoActualizaFiltroEjecutado) {
			actualizaFiltroCambio(capa, evt);
		}
		eventoActualizaFiltroEjecutado = false;
	}

	//Función que actualiza el filtro al clicar en el botón Refreseh
	function refreshClic(evt) {
		eventoActualizaFiltroEjecutado = true;
		actualizaFiltroCambio(capa, evt);
	}

	//Función que actualiza el filtro al limpiar filtro
	function limpiarClic(evt) {
		eventoActualizaFiltroEjecutado = true;

		let icon = evt.currentTarget;
		let input = evt.currentTarget.previousElementSibling;
		input.value = '';
		icon.style.visibility = 'hidden';
		actualizaFiltroCambio(capa, evt);
	}
	//Función que actualiza el filtro al limpiar filtro (fechas)
	function limpiarClicFecha(evt) {
		eventoActualizaFiltroEjecutado = true;

		let icon = evt.currentTarget;
		let parent = evt.currentTarget.parentNode;
		let inputs = parent.querySelectorAll('.inputFiltroFechaTxt');
		inputs.forEach(function(input) {
			input.value = '';
		});
		icon.style.visibility = 'hidden';
		actualizaFiltroCambio(capa, evt);
	}

	var eventoActualizaFiltroEjecutado = false;
	//Recorremos cada INPUT del filtro para asignar los eventos
	capa.filtro.inputs.forEach(function(inp) {
		var res = $("body").find('#' + inp.id);
		if (res.length === 0) return;

		var divInput = res[0];

		if (inp.tipo === 'fecha') {
			var inputElement1 = $(divInput).find("input:eq(0)");
			var inputElement2 = $(divInput).find("input:eq(1)");
			var imgLimpiar = $(divInput).find("img");
			var divRefresh = $(divInput).find(".inputRefreshFiltro");
			$(inputElement1).on("blur", function(evt) {
				setTimeout(function() {
					blurEvent(evt);
				}, 100);
			});
			$(inputElement2).on("blur", function(evt) {
				setTimeout(function() {
					blurEvent(evt);
				}, 100);
			});
			$(imgLimpiar).on("click", limpiarClicFecha);
			$(divRefresh).on("click", refreshClic);
		} else {
			var inputElement = $(divInput).find("input");
			var imgLimpiar = $(divInput).find("img");
			var divRefresh = $(divInput).find(".inputRefreshFiltro");
			$(inputElement).on("blur", function(evt) {
				setTimeout(function() {
					blurEvent(evt);
				}, 100);
			});
			$(imgLimpiar).on("click", limpiarClic);
			$(divRefresh).on("click", refreshClic);
		}
	});

	//**************** Seleccionamos valores por defecto de Inputs Y Selects **********

	capa.filtro.inputs.forEach(function(inp){
		if (inp.tipo == 'fecha') {
			if (inp.valorDefectoInicio !== undefined || inp.valorDefectoFin !== undefined) {
				var res = $("body").find('#' + inp.id);
				if (res.length > 0) {var inpDOM = res[0];} else {return;}
				var inputElement1 = $(inpDOM).find("input:eq(0)");
				var inputElement2 = $(inpDOM).find("input:eq(1)");
				var refreshClic = $(inpDOM).find(".inputRefreshFiltro:eq(0)");
				if (inp.valorDefectoInicio !== undefined) {
					$(inputElement1).val(inp.valorDefectoInicio);
					toggleClearIcon(inputElement1[0]);
				}
				if (inp.valorDefectoFin !== undefined) {
					$(inputElement2).val(inp.valorDefectoFin);
					toggleClearIcon(inputElement2[0]);
				}
				$(refreshClic).trigger('click');
			}
		} else {
			if (inp.valorDefecto !== undefined) {
				var res = $("body").find('#' + inp.id);
				if (res.length > 0) {var inpDOM = res[0];} else {return;}
				var inputElement = $(inpDOM).find("input:eq(0)");
				var refreshClic = $(inpDOM).find("div:eq(1)");
				$(inputElement).val(inp.valorDefecto);
				$(refreshClic).trigger('click');
			}
		}
	});

	capa.filtro.selects.forEach(function(sel){
		if (sel.valorDefecto !== undefined) {
			var res = $("body").find('#' + sel.select);
			if (res.length > 0) {var selectCapa = res[0];} else {return;}
			$(selectCapa).val(sel.valorDefecto).trigger('change');
		}
	});


}
//////////////////////////////// CAPAS GEOJSON ///////////////////////////////////////////////////////

function aplicaEstadisticas(mapa, capa, features, featuresFiltrados) {
	const estadisticas = capa.filtro.estadisticas;
	if (estadisticas && Array.isArray(estadisticas)) {
        //appendStatisticsToMenu(estadisticas);
		estadisticas.forEach(function(estadistica) {
            let result = 0;
            const element = $('#' + estadistica.id); // Encuentra elemento html por id

            if (element.length > 0) {
                switch (true) {
                    case estadistica.formula === 'numTotal':
                        result = features.length;
                        break;

                    case estadistica.formula === 'numFiltrados':
                        result = featuresFiltrados.length;
                        break;

					case estadistica.formula === 'numFiltradosVisibles':
						//result = featuresVisibles.length;
						result = filtroGeoJSONBBox(mapa.getBounds(),featuresFiltrados);
						break;

                    case /suma\{(.+)\}/.test(estadistica.formula):
                        const fieldSuma = /suma\{(.+)\}/.exec(estadistica.formula)[1];
                        result = sumaCampo(features, fieldSuma);
						// Formatear el número según el formato español y el número de decimales
						let decimalesSuma = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesSuma, maximumFractionDigits: decimalesSuma }).format(result);
                        break;

                    case /sumaFiltrados\{(.+)\}/.test(estadistica.formula):
                        const fieldSumaVisible = /sumaFiltrados\{(.+)\}/.exec(estadistica.formula)[1];
                        result = sumaCampo(featuresFiltrados, fieldSumaVisible);
						// Formatear el número según el formato español y el número de decimales
						let decimalesSumaFiltrados = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesSumaFiltrados, maximumFractionDigits: decimalesSumaFiltrados }).format(result);
						break;

					case /media\{(.+)\}/.test(estadistica.formula):
						const fieldMedia = /media\{(.+)\}/.exec(estadistica.formula)[1];
						result = mediaCampo(features, fieldMedia);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMedia = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMedia, maximumFractionDigits: decimalesMedia }).format(result);
						break;

                    case /mediaFiltrados\{(.+)\}/.test(estadistica.formula):
                        const fieldMediaVisible = /mediaFiltrados\{(.+)\}/.exec(estadistica.formula)[1];
                        result = mediaCampo(featuresFiltrados, fieldMediaVisible);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMediaFiltrados = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMediaFiltrados, maximumFractionDigits: decimalesMediaFiltrados }).format(result);
                        break;

                    case /desvTipica\{(.+)\}/.test(estadistica.formula):
                        const fieldDesvTipica = /desvTipica\{(.+)\}/.exec(estadistica.formula)[1];
                        result = desviacionTipica(features, fieldDesvTipica);
						// Formatear el número según el formato español y el número de decimales
						let decimalesDesvTipica = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesDesvTipica, maximumFractionDigits: decimalesDesvTipica }).format(result);
                        break;

                    case /devTipicaFiltrados\{(.+)\}/.test(estadistica.formula):
                        const fieldDesvTipicaVisible = /devTipicaFiltrados\{(.+)\}/.exec(estadistica.formula)[1];
                        result = desviacionTipica(featuresFiltrados, fieldDesvTipicaVisible);
						// Formatear el número según el formato español y el número de decimales
						let decimalesDesvTipicaFiltrados = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesDesvTipicaFiltrados, maximumFractionDigits: decimalesDesvTipicaFiltrados }).format(result);
                        break;

                    case /max\{(.+)\}/.test(estadistica.formula):
                        const fieldMax = /max\{(.+)\}/.exec(estadistica.formula)[1];
                        result = maxCampo(features, fieldMax);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMax = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMax, maximumFractionDigits: decimalesMax }).format(result);
                        break;

                    case /maxFiltrados\{(.+)\}/.test(estadistica.formula):
                        const fieldMaxVisible = /maxFiltrados\{(.+)\}/.exec(estadistica.formula)[1];
                        result = maxCampo(featuresFiltrados, fieldMaxVisible);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMaxFiltrados = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMaxFiltrados, maximumFractionDigits: decimalesMaxFiltrados }).format(result);
                        break;

                    case /min\{(.+)\}/.test(estadistica.formula):
                        const fieldMin = /min\{(.+)\}/.exec(estadistica.formula)[1];
                        result = minCampo(features, fieldMin);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMin = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMin, maximumFractionDigits: decimalesMin }).format(result);
                        break;

                    case /minFiltrados\{(.+)\}/.test(estadistica.formula):
                        const fieldMinVisible = /minFiltrados\{(.+)\}/.exec(estadistica.formula)[1];
                        result = minCampo(featuresFiltrados, fieldMinVisible);
						// Formatear el número según el formato español y el número de decimales
						let decimalesMinFiltrados = estadistica.decimales !== undefined ? estadistica.decimales : 1;
						result = Intl.NumberFormat('es-ES', { minimumFractionDigits: decimalesMinFiltrados, maximumFractionDigits: decimalesMinFiltrados }).format(result);
                        break;
                }

                // Muestra el número en el elemento html correspondiente
                element.html(result);
            }
        });
    } else {
        //console.warn('No estadisticas defined in capa.filtro');
    }
}

function sumaCampo(features, campo) {
    return features.reduce((sum, feature) => {
        const value = parseFloat(feature.properties[campo]) || 0;
        return sum + value;
    }, 0);
}

function mediaCampo(features, campo) {
    const sum = sumaCampo(features, campo);
    return features.length ? sum / features.length : 0;
}

function desviacionTipica(features, campo) {
    const mean = mediaCampo(features, campo);
    const variance = features.reduce((total, feature) => {
        const value = parseFloat(feature.properties[campo]) || 0;
        return total + Math.pow(value - mean, 2);
    }, 0) / features.length;

    return Math.sqrt(variance);
}

function maxCampo(features, campo) {
    return Math.max(...features.map(feature => parseFloat(feature.properties[campo]) || -Infinity));
}

function minCampo(features, campo) {
    return Math.min(...features.map(feature => parseFloat(feature.properties[campo]) || Infinity));
}

function extraerCampoDeFormula(formula) {
	const regex = /\{(.+)\}/;
	const match = formula.match(regex);
	return match ? match[1] : ''; // Devuelve cadena vacía si no encuentra nada.
  }

// Función para restablecer los datos de una capa GEOJSON
function IDEVAPI_actualizarCapaGeoJSON(capaId, nuevosDatos, zoomACapa = false){
	let capaAModificar = null;
	
	layersInternasGeoJson.forEach(function(layer) {
	   if (layer.idInterno === capaId) {
		  capaAModificar = layer;
	   }
	});
 
	if(capaAModificar !== null){

		// Conservamos los Alias
	    for (let i in nuevosDatos.features) {
			let feat = nuevosDatos.features[i];
			let aliasAux = {};
			for (let prop in capaAModificar.tablaInfo.alias) {
				let prefijo = "";
				let sufijo = "";
				let tipo = "";
				let paramsExtra = "";
				if (prop.split("|").length > 1) {
					paramsExtra = prop.split("|")[1];
					let propCampo = prop.split("|")[0];
					if (IDEVAPI_global.idioma == "es") {
						prefijo = eval(paramsExtra.split(";")[0])[0];
						sufijo =  eval(paramsExtra.split(";")[1])[0];
						tipo = eval(paramsExtra.split(";")[2])[0];
					} else {
						prefijo = eval(paramsExtra.split(";")[0])[1];
						sufijo =  eval(paramsExtra.split(";")[1])[1];
						tipo = eval(paramsExtra.split(";")[2])[1];
					}
					var alias = capaAModificar.tablaInfo.alias[prop];
					prop = propCampo;
				} else {
					var alias = capaAModificar.tablaInfo.alias[prop];
				}

				if (tipo !== ""){
					//Listado de posibles valores [NumMiles]
					if (tipo == "NumMiles") {
						var valorNuevo = prefijo + new Intl.NumberFormat('es-ES').format(feat.properties[prop]) + sufijo;
					}
				} else {
					var valorNuevo = prefijo + feat.properties[prop] + sufijo;
				}
				aliasAux[alias] = valorNuevo;
			}
			feat.propertiesAlias = aliasAux;
		}

		capaAModificar = actualizaFiltroCapaGeoJSON(capaAModificar,nuevosDatos);
		//capaAModificar.clearLayers();
		//capaAModificar.addData(nuevosDatos);
		capaAModificar.featureCollection = nuevosDatos;
 
	   if(zoomACapa){
		  let datos = capaAModificar.featureCollection.features;
		  let bounds = new L.LatLngBounds();
 
		  for (const element of datos) {
			 if (element.geometry.type === "Point" && element.geometry.coordinates) {
				let lat = element.geometry.coordinates[1];
				let lng = element.geometry.coordinates[0];
				bounds.extend(new L.LatLng(lat, lng));
			 } else if (element.geometry.type === "MultiPolygon" && element.geometry.coordinates) {
				for (const polygonData of element.geometry.coordinates) {
				   let polygon = polygonData[0]; // Asume que es un polígono simple
				   for (const coordinate of polygon) {
					  let lat = coordinate[1];
					  let lng = coordinate[0];
					  bounds.extend(new L.LatLng(lat, lng));
				   }
			 }
			 }
		  }
 
		  if (bounds.isValid()) {
			 map.fitBounds(bounds);
		  }
		  else{
			 alert('Error');
		  }    
	   }
	}
	else{
	   alert('Error al actualizar capa GeoJSON');
	} 
	
}

function esperarCapasGeoJson(){
	return new Promise(resolve => {
        const interval = setInterval(() => {
            if (layersInternasGeoJson.length > 0) {
                clearInterval(interval);
                resolve();
            }
        }, 1000); 
    });
}

function obtenerCapasGeoJson(){
	return layersInternasGeoJson;
}