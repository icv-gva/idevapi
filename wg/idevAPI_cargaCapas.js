function creaBotonCargar (id,mapa){
    if ($('#divControles_'+id).length == 0) {
        creaDivControles(id);
    }
    var divAnadir = document.createElement("div");
    divAnadir.id = "botonAnadir_" + id;
    var iconoAnadir = L.DomUtil.create('img');
    iconoAnadir.src = prot + urlAPI + "/images/h_anadircapa.png";
    iconoAnadir.style.maxHeight = "100%";
    iconoAnadir.style.maxWidth = "100%";
    divAnadir.appendChild(iconoAnadir);
    $('#divControles_'+id).append(divAnadir);
    $('#botonAnadir_'+id).addClass("classBoton").addClass("classBotonHome");
    $('#botonAnadir_'+id).hover(
        function() {$(this).addClass("classBotonHover")},
        function() {$(this).removeClass("classBotonHover")}
    );

    //EVENTOS//
    $('#botonAnadir_'+id).on('click',function(e){
      e.stopPropagation();
      if ($("#vAddLayer").dialog("isOpen")) {
        $("#vAddLayer").dialog("close");
        $("#vAddLayer").dialog("open");
        $("#vAddLayer").data("mapaId",id);
        $("#vAddLayer").data("mapa",mapa);
      } else {
        $("#vAddLayer").dialog("open");
        $("#vAddLayer").data("mapaId",id);
        $("#vAddLayer").data("mapa",mapa);
      }
      var filesUpload = document.getElementById("files-upload"),
  		dropArea = document.getElementById("drop-area"),
  		fileList = document.getElementById("file-list");
      //Evento change de Seleccionar ficheros
  		filesUpload.addEventListener("change", function () {
  				traverseFiles(this.files);
  				//ficheroValor = this.files;
  		}, false);

  		dropArea.addEventListener("dragleave", function (evt) {
  				var target = evt.target;
  				if (target && target === dropArea) {
  					this.className = "";
  				}
  				evt.preventDefault();
  				evt.stopPropagation();
  		}, false);

  		dropArea.addEventListener("dragenter", function (evt) {
  			this.className = "over";
  			evt.preventDefault();
  			evt.stopPropagation();
  		}, false);

  		dropArea.addEventListener("dragover", function (evt) {
  			evt.preventDefault();
  			evt.stopPropagation();
  		}, false);

  		dropArea.addEventListener("drop", function (evt) {
  			//ficheroValor = evt.dataTransfer.files;
  			traverseFiles(evt.dataTransfer.files);
  			$("#files-upload").val("");
  			this.className = "";
  			evt.preventDefault();
  			evt.stopPropagation();
  		}, false);
    });


}

function leerWMSLayer() {
	//******WMS configurado por usuario*****************************************
	$("#inputDireccionWMS").val("");
	$("#inputNombreServicioWMS").val("");
	$("#textoMensajeWMS").text("");
	document.getElementById("inputDireccionWMS").value = document.getElementById("inputServicioWMSP").value;
	var peticionCapabilities = 	document.getElementById("inputDireccionWMS").value;
	if (peticionCapabilities.indexOf("?") == peticionCapabilities.length-1) {
		peticionCapabilities = peticionCapabilities;
	} else if (peticionCapabilities.indexOf("?") == -1) {
		peticionCapabilities = peticionCapabilities + "?";
	} else {
		peticionCapabilities = peticionCapabilities + "&";
	}
	peticionCapabilities = peticionCapabilities + "request=GetCapabilities&service=WMS";
  peticionCapabilities = peticionCapabilities.replace(/^http:\/\//i, 'https://');
	//Peticion GetCapabilities al servicio
  document.getElementById('gifCargaTabla').style.display = "block";
  var requestCapas = $.ajax({
    url:  peticionCapabilities,
    type: "GET",
    dataType: "XML"
  });
  requestCapas.done(function(response){respuestaCapabilities(response)});
  requestCapas.fail(function(jqXHR, textStatus ) {
    alert(MENSAJES.falloPeticionExterna + peticionCapabilities);
  });

}
//Respuesta del GetCapabilities al añadir un WMS configurado por el usuario
function respuestaCapabilities(response, io){

		/*dojo.require("dojox.xml.parser");
		var responsexml = dojox.xml.parser.parse(response);*/

		var resp = creaListadoCapasWMS("",response);
		if (!resp) {	//Hay error
			$("#textoMensajeWMS").text(MENSAJES.falloReferenciaWMS);
			$('#capasServicioWMS').empty();
			$('#inputNombreCapaWMS').val("");
			return;
		}

		var nombreServicio = resp.nombreServicio;
		var tituloServicio = resp.tituloServicio;
		var capaId = resp.capaId;
		var capaNombre = resp.capaNombre;
		var capaEscalaMax = resp.capaEscalaMax;
		var capaEscalaMin = resp.capaEscalaMin;
		var MD = resp.MD;
		var numCapasGrupo = resp.numCapasGrupo;

		$('#capasServicioWMS').empty();
		for (var i=0; i<capaId.length; i++){
			if (numCapasGrupo[i] == 0) {
				$("#capasServicioWMS").append($('<option>', {value:i + ";" + capaId[i], text: capaNombre[i] + " (" +  capaId[i] + ")"}));
			}
		}
		$("#inputNombreServicioWMS").val(nombreServicio);
		$("#inputNombreCapaWMS").val(tituloServicio);
		$("#inputDireccionWMS").attr("escala",capaEscalaMax + ";" + capaEscalaMin);
		$("#inputDireccionWMS").attr("md",MD);
    document.getElementById('gifCargaTabla').style.display = "none";
}

function creaListadoCapasWMS(servicioId,responsexml) {
	var x = responsexml.getElementsByTagName("WMS_Capabilities");
	if (x[0] == undefined){
		x = responsexml.getElementsByTagName("WMT_MS_Capabilities");
		if (x[0] == undefined){
			this.cambiaEstadoNodoTOCError(servicioId);
			console.log(MENSAJES.falloVersionServidor);
			return false;
		}
	}
	var versionWMS = x[0].getAttribute("version");

	var nodesService = responsexml.getElementsByTagName("Service");
	var nombreServicio = "WMS_" + nodesService[0].getElementsByTagName("Name")[0].childNodes[0].nodeValue;
	nombreServicio = nombreServicio.replace(/[^a-zA-Z 0-9.]+/g,'_');
	nombreServicio = nombreServicio.replace(/ /g, '_');
	if (nodesService[0].getElementsByTagName("Title")[0] !== undefined) {
		var tituloServicio = nodesService[0].getElementsByTagName("Title")[0].childNodes[0].nodeValue;
	} else {
		var tituloServicio = nombreServicio;
	}

	//Comprueba que el WMS está en EPSG:3857
	var esta3857 = false;
	var nodesChildLayer = responsexml.getElementsByTagName("Layer")[0].childNodes;
	for (i=0;i<nodesChildLayer.length;i++) {
		if (nodesChildLayer[i].nodeType==1) {
			if (nodesChildLayer[i].nodeName == "CRS" || nodesChildLayer[i].nodeName == "SRS") {
				if (nodesChildLayer[i].childNodes[0] !== undefined){
					var srs = nodesChildLayer[i].childNodes[0].nodeValue;
					if (srs.indexOf(" ") != -1){
						var v_srs = general.convierteAVector(srs," ");
						for (j=0;j<v_srs.length;j++) {
							if (v_srs[j] == "EPSG:3857"){
								esta3857 = true;
								break;
							}
						}
					} else if (srs == "EPSG:3857"){
						esta3857 = true;
						break;
					}
				}
			}
		}
	}

	if (esta3857 == false){
		this.cambiaEstadoNodoTOCError(servicioId);
		console.log("El servicio WMS " + nombreServicio + " no soporta el Sistema de Referencia del visor (EPSG:3857) y no se puede cargar la capa.");
		return false;
	}

	var capaId = [];
	var capaNombre = [];
	var capaEscalaMin = [];
	var capaEscalaMax = [];
	var numCapasGrupo = [];
	var MD = [];

	//Rellena vectores para construir el árbol
	var capasI = $(responsexml).children().children("Capability").children("Layer").children("Layer").get().reverse();
	$(capasI).each(function() {
		if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
		var Title = $(this).children("Title").text();
		if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
		if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
		if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
		capaId.push(Name);
		capaNombre.push(Title.replace(/'/g, "&apos;"));
		MD.push(MetadataURL);
		capaEscalaMin.push(MinScaleDenominator);
		capaEscalaMax.push(MaxScaleDenominator);
		numCapasGrupo.push($(this).children("Layer").length);
		if ($(this).children("Layer").length > 0 ) {
			var sCapa = $(this).children("Layer").get().reverse();
			$(sCapa).each(function() {
				if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
				var Title = $(this).children("Title").text();
				if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
				if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
				if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
				capaId.push(Name);
				capaNombre.push(Title.replace(/'/g, "&apos;"));
				MD.push(MetadataURL);
				capaEscalaMin.push(MinScaleDenominator);
				capaEscalaMax.push(MaxScaleDenominator);
				numCapasGrupo.push($(this).children("Layer").length);
				if ($(this).children("Layer").length > 0 ) {
					var sCapa = $(this).children("Layer").get().reverse();
					$(sCapa).each(function() {
						if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
						var Title = $(this).children("Title").text();
						if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
						if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
						if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
						capaId.push(Name);
						capaNombre.push(Title.replace(/'/g, "&apos;"));
						MD.push(MetadataURL);
						capaEscalaMin.push(MinScaleDenominator);
						capaEscalaMax.push(MaxScaleDenominator);
						numCapasGrupo.push($(this).children("Layer").length);
						if ($(this).children("Layer").length > 0 ) {
							var sCapa = $(this).children("Layer").get().reverse();
							$(sCapa).each(function() {
								if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
								var Title = $(this).children("Title").text();
								if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
								if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
								if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
								capaId.push(Name);
								capaNombre.push(Title.replace(/'/g, "&apos;"));
								MD.push(MetadataURL);
								capaEscalaMin.push(MinScaleDenominator);
								capaEscalaMax.push(MaxScaleDenominator);
								numCapasGrupo.push($(this).children("Layer").length);
								if ($(this).children("Layer").length > 0 ) {
									var sCapa = $(this).children("Layer").get().reverse();
									$(sCapa).each(function() {
										if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
										var Title = $(this).children("Title").text();
										if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
										if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
										if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
										capaId.push(Name);
										capaNombre.push(Title.replace(/'/g, "&apos;"));
										MD.push(MetadataURL);
										capaEscalaMin.push(MinScaleDenominator);
										capaEscalaMax.push(MaxScaleDenominator);
										numCapasGrupo.push($(this).children("Layer").length);
										if ($(this).children("Layer").length > 0 ) {
											var sCapa = $(this).children("Layer").get().reverse();
											$(sCapa).each(function() {
												if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
												var Title = $(this).children("Title").text();
												if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
												if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
												if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
												capaId.push(Name);
												capaNombre.push(Title.replace(/'/g, "&apos;"));
												MD.push(MetadataURL);
												capaEscalaMin.push(MinScaleDenominator);
												capaEscalaMax.push(MaxScaleDenominator);
												numCapasGrupo.push($(this).children("Layer").length);
												if ($(this).children("Layer").length > 0 ) {
													var sCapa = $(this).children("Layer").get().reverse();
													$(sCapa).each(function() {
														if ($(this).children("Name").length > 0 ) {var Name = $(this).children("Name").text();} else {var Name = $(this).children("Title").text();}
														var Title = $(this).children("Title").text();
														if ($(this).children("MetadataURL").length > 0 ) {var MetadataURL = $(this).children("MetadataURL").children("OnlineResource").attr("xlink:href");} else {var MetadataURL = "";}
														if ($(this).children("MinScaleDenominator").length > 0 ) {var MinScaleDenominator = $(this).children("MinScaleDenominator").text();} else {var MinScaleDenominator = "0";}
														if ($(this).children("MaxScaleDenominator").length > 0 ) {var MaxScaleDenominator = $(this).children("MaxScaleDenominator").text();} else {var MaxScaleDenominator = "0";}
														capaId.push(Name);
														capaNombre.push(Title.replace(/'/g, "&apos;"));
														MD.push(MetadataURL);
														capaEscalaMin.push(MinScaleDenominator);
														capaEscalaMax.push(MaxScaleDenominator);
														numCapasGrupo.push($(this).children("Layer").length);
													})
												}
											})
										}
									})
								}
							})
						}
					})
				}
			})
		}
	})


	return {
		nombreServicio:nombreServicio,
		tituloServicio:tituloServicio,
		capaId:capaId,
		capaNombre:capaNombre,
		capaEscalaMax:capaEscalaMax,
		capaEscalaMin:capaEscalaMin,
		numCapasGrupo:numCapasGrupo,
		MD:MD};
}

function botonAnadirCapaWMS(){
	var urlPeticionGetMap = document.getElementById("inputDireccionWMS").value;
  var valorSelect = $('#capasServicioWMS').val().reverse();
  var tituloCapaWMS = $("#inputNombreCapaWMS").val();
  if (urlPeticionGetMap.indexOf("?") !== -1) {
    urlPeticionGetMap = urlPeticionGetMap + "&";
  } else {
    urlPeticionGetMap = urlPeticionGetMap + "?";
  }

  var source = new MySource(urlPeticionGetMap, {
    maxZoom: 20,
    format: "image/png",
    transparent: true,
    opacity: false,
    version: '1.3.0',
    info_format: "text/html",
    feature_count:"150",
    modificarPopup:  {url: urlPeticionGetMap, titulo: tituloCapaWMS}
  });
  var mapa = $('#vAddLayer').data()['mapa'];
  for (var i = 0; i < valorSelect.length; i++) {
    var capaWMS = source.getLayer(valorSelect[i].split(';')[1]);
    capaWMS.addTo(mapa)
    if (mapa.controlCapasUsuario == undefined) {
      mapa.controlCapasUsuario = L.control.layers({}, {}, {collapsed:L.Browser.mobile}).addTo(mapa);
      var etiqueta = document.createElement("Label");
      etiqueta.innerHTML = MENSAJES.capasExternas;
      mapa.controlCapasUsuario._section.insertBefore(etiqueta, mapa.controlCapasUsuario._section.childNodes[0]);
    }
    mapa.controlCapasUsuario.addOverlay(capaWMS, tituloCapaWMS);


  }

}

function botonAnadirAGSLayer(){
  var direccionCapasAGS = $("#inputServicioAGFS").val();
  var tituloCapaAGS = $("#inputNombreCapaAGFS").val();
  var idCapaAGS = $("#inputLayerAGFS").val();
  if (direccionCapasAGS.indexOf("?") !== -1) {
    direccionCapasAGS = direccionCapasAGS + "&";
  } else {
    direccionCapasAGS = direccionCapasAGS + "?";
  }
  var source = new MySource(direccionCapasAGS, {
    maxZoom: 20,
    format: "image/png",
    transparent: true,
    opacity: false,
    version: '1.3.0',
    info_format: "text/html",
    feature_count:"150",
    modificarPopup:  {url: direccionCapasAGS, titulo: tituloCapaAGS}
  });
  capaAGS = source.getLayer(idCapaAGS)
  var mapa = $('#vAddLayer').data()['mapa'];
  capaAGS.addTo(mapa);
  if (mapa.controlCapasUsuario == undefined) {
    mapa.controlCapasUsuario = L.control.layers({}, {}, {collapsed:L.Browser.mobile}).addTo(mapa);
    var etiqueta = document.createElement("Label");
    etiqueta.innerHTML = MENSAJES.capasExternas;
    mapa.controlCapasUsuario._section.insertBefore(etiqueta, mapa.controlCapasUsuario._section.childNodes[0]);
  }
  mapa.controlCapasUsuario.addOverlay(capaAGS, tituloCapaAGS);
}

 function botonAnadirFichero(){
	// Create the layer
	//Aquí habrá que leer del directorio donde se subarn los ficheros por asp o php.
	$("#textoMensajecargaFichero").text("");
	var fichero = ficheroValor[0].name;
	var fichero = fichero.replace("C:\\fakepath\\","");
	var ficheroSolo = fichero;
	var fichero = "data/" + fichero;

	if (fichero.indexOf(".zip") !== -1 ||
	fichero.indexOf(".gpx") !== -1 ||
	fichero.indexOf(".json") !== -1 ||
	fichero.indexOf(".geojson") !== -1 ||
	fichero.indexOf(".kml") !== -1 ||
	fichero.indexOf(".kmz") !== -1 ||
	fichero.indexOf(".gml") !== -1 ||
	fichero.indexOf(".dxf") !== -1 ||
	fichero.indexOf(".dgn") !== -1 ||
	fichero.indexOf(".csv") !== -1) {
		var input = document.getElementById('files-upload');
		var tituloCapa = $("#inputNombreCapaFichero").val();
		var sFile = ficheroValor[0];
		var formdata = new FormData();
  		formdata.append("upload", sFile);
		var srsFichero = $("#SAnadirCapaFicheroSRS").val();
		formdata.append("sourceSrs", srsFichero);
		formdata.append("targetSrs", "EPSG:4326");

		var $this=this;
  		$.ajax({
			url: "https://descargas.icv.gva.es/icv/ogre",
        	data: formdata,
			enctype: 'multipart/form-data',
        	type: "POST",
        	processData: false,
        	contentType: false,
			dataType: "text",
        	success: function(res) {
				if (res !== "" && res != "null") {
					var res2 = JSON.stringify(eval('('+res+')'));
					var response = $.parseJSON(res2);
					if (response.error != true || typeof response.error === "undefined"){
						if (response.length > 1){
							for (i=0; i <= response.length-1; i++ ){
								if (response[i].features.length > 0){
									if (response[i].name == "tracks"){
										var tituloCapa2 = tituloCapa + " (Tracks)";
									} else if (response[i].name == "waypoints") {
										var tituloCapa2 = tituloCapa + " (Waypoints)";
									} else {
										var tituloCapa2 = tituloCapa + " (Routes)";
									}
									anadeCapaGeoJSON(tituloCapa2, response[i]);
								}
							}
						} else {
							anadeCapaGeoJSON(tituloCapa, response);
						}
					} else {
						$("#textoMensajecargaFichero").text(MENSAJES.errorTamanoArchivo);
					}
				} else {
					var srsDesactivo = $('#SAnadirCapaFicheroSRS').prop('disabled');
					if (srsFichero == "" && !srsDesactivo) {
						$("#textoMensajecargaFichero").text(MENSAJES.errorSeleSistema);
					} else {
						$("#textoMensajecargaFichero").text(MENSAJES.errorCargaFichero);
					}
				}
       		},
        	error: function(error) {
				console.log(error);
				$("#textoMensajecargaFichero").text(MENSAJES.errorCargaFichero);
        	}
		});
	} else {
		$("#textoMensajecargaFichero").text(MENSAJES.errorExtensionFichero);
	}
}

function anadeCapaGeoJSON(tituloCapa, response){
	if (response.features.length>0) {
    var geoJsonLayer = L.geoJson(response, {
      onEachFeature: onEachFeature
    });
  }
  var mapa = $('#vAddLayer').data()['mapa']
  geoJsonLayer.addTo(mapa);
  if (mapa.controlCapasUsuario == undefined) {
    mapa.controlCapasUsuario = L.control.layers({}, {}, {collapsed:L.Browser.mobile}).addTo(mapa);
    var etiqueta = document.createElement("Label");
    etiqueta.innerHTML = MENSAJES.capasExternas;
    mapa.controlCapasUsuario._section.insertBefore(etiqueta, mapa.controlCapasUsuario._section.childNodes[0]);
  }
  mapa.controlCapasUsuario.addOverlay(geoJsonLayer, tituloCapa);

}

function traverseFiles (files) {
					if (typeof files !== "undefined") {
						ficheroValor = files;
						$("#inputNombreCapaFichero").val(files[0].name);
						$("#textoMensajecargaFichero").text("");
						//Por defecto 4326 activado
						if (files[0].name.indexOf(".gpx") !== -1 || files[0].name.indexOf(".kml") !== -1 || files[0].name.indexOf(".kmz") !== -1) {
							$('#SAnadirCapaFicheroSRS').val('EPSG:4326');
							$('#SAnadirCapaFicheroSRS').prop('disabled', 'disabled');
							if (!$('#TAnadirCapaFicheroSRS').hasClass('textoDesactivado')){
								$('#TAnadirCapaFicheroSRS').addClass('textoDesactivado');
							}
						//Activada la selección de SRS
						} else if (files[0].name.indexOf(".json") !== -1 || files[0].name.indexOf(".geojson") !== -1 || files[0].name.indexOf(".zip") !== -1 || files[0].name.indexOf(".csv") !== -1 || files[0].name.indexOf(".dxf") !== -1 || files[0].name.indexOf(".dgn") !== -1 || files[0].name.indexOf(".gml") !== -1 ) {
							$('#SAnadirCapaFicheroSRS').val('EPSG:4326');
							$('#SAnadirCapaFicheroSRS').prop('disabled', false);
							if ($('#TAnadirCapaFicheroSRS').hasClass('textoDesactivado')){
								$('#TAnadirCapaFicheroSRS').removeClass('textoDesactivado');
							}
							//$('#AnadirCapaFicheroSRS').show();
						//Desactivada la selección de SRS
						} else {
							$('#SAnadirCapaFicheroSRS').val('');
							$('#SAnadirCapaFicheroSRS').prop('disabled', 'disabled');
							if (!$('#TAnadirCapaFicheroSRS').hasClass('textoDesactivado')){
								$('#TAnadirCapaFicheroSRS').addClass('textoDesactivado');
							}
						}
						//dom.byId('upload-status').innerHTML = "";
						//selectedFiles = files;
						//uploadFiles(files);
						/*for (var i=0, l=files.length; i<l; i++) {
							uploadFile(files[i]);
						}*/
					} else {
						//fileList.innerHTML = "No support for the File API in this web browser";
					}
				}
