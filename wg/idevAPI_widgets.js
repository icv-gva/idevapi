function creaDivControles (id){
    $('<link>')
    .appendTo('head')
    .attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: prot + urlAPI + '/wg/idevAPI_widgets.css'
    });
    var html = '<div id="divControles_'+ id +'">';
    html += '</div>';
    //$('#controles').append(html);
    $('#' + id).children(".leaflet-control-container").children(".leaflet-top.leaflet-left").append(html);
    $('#divControles_'+ id).addClass("leaflet-control");
    $('#divControles_'+ id).addClass("divControles");
}

function creaBotonesZoom (id, mapa){
  if ($('#divControles_'+id).length == 0) {
      creaDivControles(id);
  }

    var html = "";
    html += '<div id="botonZoomMas_'+id+'"><img class="classBotonZoomImg" src="' + prot + urlAPI + '/images/h_zoom_mas.svg"/></div>';
    html += '<div id="botonZoomMenos_'+id+'"><img class="classBotonZoomImg" src="' + prot + urlAPI + '/images/h_zoom_menos.svg"/></div>';
    html += '<div id="divNivel_'+id+'" class="classNivel">' + mapa.getZoom() + '</div>';
   //html += '</div>';

    $('#divControles_'+id).append(html);

    $("#botonZoomMas_"+id).addClass("classBoton").addClass("classBotonZoomMas");
    $("#botonZoomMas_"+id).hover(
        function() {$(this).addClass("classBotonHover")},
        function() {$(this).removeClass("classBotonHover")}
    );
    $("#botonZoomMenos_"+id).addClass("classBoton").addClass("classBotonZoomMenos");
    $("#botonZoomMenos_"+id).hover(
        function(){$(this).addClass("classBotonHover")},
        function(){$(this).removeClass("classBotonHover")}
    );
    //EVENTOS//
    //$('#botonZoomMas').click(map.zoomIn());

    $("#botonZoomMas_"+id).on('click',function(e){
        e.stopPropagation();
        mapa.zoomIn();
    });
    $("#botonZoomMenos_"+id).on('click',function(e){
        //map.toggleFullScreen();
        e.stopPropagation();
        mapa.zoomOut();
    });
    mapa.on("zoomend", function (e) {
        $("#divNivel_"+id).html(mapa.getZoom());
    });
}

function creaBotonExpandir (id,zoomControl,mapa){
    if ($('#divControles'+id).length == 0) {
        creaDivControles(id);
    }
    var html = '<div id="botonExpandir_'+id+'"><img style="width:28px;height:28px;" src="' + prot + urlAPI + '/images/h_expandir.svg"/></div>';
    $('#divControles_'+id).append(html);
    $('#botonExpandir_'+id).addClass("classBoton").addClass("classBotonExpandir");
    $('#botonExpandir_'+id).hover(
        function() {$(this).addClass("classBotonHover")},
        function() {$(this).removeClass("classBotonHover")}
    );
    if (zoomControl == false) {
        $('.classBotonExpandir').css('margin','0px');
    }
    //EVENTOS//
    $('#botonExpandir_'+id).on('click',function(){
        let capasids = "";
        //let tcapas = "";
        let capasVisor = [];

        mapa.eachLayer (function(layer){
          if (layer.idVisor !== undefined){
            if (layer.idVisor !== ""){
              capasVisor.push(layer.idVisor);
            }
          }
        });
        capasVisor.reverse();

        $.each(capasVisor, function( index, value ) {
          if (index == 0) {
            capasids += value;
            //tcapas += layer.opacidad;
          } else {
            capasids += "," + value;
            //tcapas += "," + layer.opacidad;
          }
        });

        var nivelZoom = mapa.getZoom();
        var xmin = mapa.getBounds().getWest();
        var ymin = mapa.getBounds().getSouth();
        var xmax = mapa.getBounds().getEast();
        var ymax = mapa.getBounds().getNorth();
        var coordsMin = proj4('EPSG:4326','EPSG:25830',[xmin,ymin]);
        var coordsMax = proj4('EPSG:4326','EPSG:25830',[xmax,ymax]);
        window.open( prot + "//visor.gva.es/visor?extension=" + (coordsMin[0]+1).toFixed(0) + "," + (coordsMin[1]+1).toFixed(0) + "," + (coordsMax[0]-1).toFixed(0) + "," + (coordsMax[1]-1).toFixed(0) + "&NivelZoom=" + nivelZoom + "&capasids=" + capasids,"_blank");
    });
}

function creaControlCoords (id, coordControl, mapa){
    var SRS = coordControl;
    var html = '<div id="divControlCoords_'+ id +'">';
    //html += 'ETRS89 UTM H30 X= Y=';
    html += '</div>';
		$( '#'+id ).find( ".leaflet-bottom.leaflet-left").append(html);
    //$(".leaflet-bottom.leaflet-left").append(html);
    $('#divControlCoords_'+id).addClass("leaflet-control");
		$('#divControlCoords_'+id).addClass("divControlCoords");
    mapa.addEventListener('mousemove', function(ev) {
        lat = ev.latlng.lat;
        lng = ev.latlng.lng;
        if (SRS == undefined || SRS == 25830){
            var coordsETRS89 = proj4('EPSG:4326','EPSG:25830',[lng,lat]);
            var html = '<table id="tablaCoords_'+id+'"><tr><td id="tdTextoETRS89">ETRS89 UTM H30</td>';
            html += '<td id="tdCoordX">X= ' + coordsETRS89[0].toLocaleString(undefined, {maximumFractionDigits:2}) + '</td>';
            html += '<td id="tdCoordY">Y = ' + coordsETRS89[1].toLocaleString(undefined, {maximumFractionDigits:2}) + '</td></tr></table>';
        } else if (SRS == 4326) {
            var html = '<table id="tablaCoords_'+id+'"><tr><td id="tdTextoWGS84">WGS84</td>';
            html += '<td id="tdCoordLat">lat = ' + lat.toLocaleString(undefined, {maximumFractionDigits:6}) + '</td>';
            html += '<td id="tdCoordLon">lon = ' + lng.toLocaleString(undefined, {maximumFractionDigits:6}) + '</td></tr></table>';
            //var html = 'WGS84 lat = ' + lat.toFixed(6) + ' lon = ' + lng.toFixed(6);
        }
        $("#divControlCoords_"+id).html(html);
    });
}

function creaBotonHome (id,zoomControl,extCV,mapa){
    if ($('#divControles_'+id).length == 0) {
        creaDivControles(id);
    }
    var html = '<div id="botonHome_'+id+'"><img style="width:26px;height:26px;" src="' + prot + urlAPI + '/images/home.svg"/></div>';
    $('#divControles_'+id).append(html);
    $('#botonHome_'+id).addClass("classBoton").addClass("classBotonHome");
    $('#botonHome_'+id).hover(
        function() {$(this).addClass("classBotonHover")},
        function() {$(this).removeClass("classBotonHover")}
    );
    if (zoomControl == false) {
        $('.classBotonHome').css('margin','0px');
    }
    //EVENTOS//
    $('#botonHome_'+id).on('click',function(e){
      e.stopPropagation();
      mapa.flyToBounds(extCV);
    });
}

function creaDivCabecera (id,titulo){
    if ($('#divControles_'+id).length == 0) {
      $('<link>')
      .appendTo('head')
      .attr({
          type: 'text/css',
          rel: 'stylesheet',
          href: prot + urlAPI + '/wg/idevAPI_widgets.css'
      });
    }
    var html = '<div id="cabecera_'+id+'" style="height: 40px;background: #00677f;z-index: 9999;position: absolute;top: 0;width: 100%;opacity: 0.7;display: flex;justify-content: center;align-items: center;">';
    html += '<h2 style="color: white;text-align: center;margin: 0;">'+titulo+'</h2>';
    html += '</div>';
    //$('#controles').append(html);
    $('#' + id).append(html);
    //$('.divControles').css('top','50px');
    $('.leaflet-top').css('top','40px');
}

function creaWidgetConsulta(mapa, colapsar,id){
  if ($("#cuadroConsulta-" + id).length > 0) {
    if (mapa.controlConsulta == undefined) {
      var selects = $("#cuadroConsulta-" + id);
      mapa.controlConsulta = L.control.consulta(selects[0],mapa,{position: 'topright', collapsed: colapsar}).addTo(mapa);

    }
  }
}

function creaBotonPosicion (id, mapa){
  L.control.locate(
    {
      strings: {
        title: MENSAJES.mensajePosicion,
        metersUnit: MENSAJES.unidadMetros,
        feetUnit: MENSAJES.unidadPies,
        popup: MENSAJES.distanciaAPunto,
        outsideMapBoundsMsg: MENSAJES.posicionFueraMapa
      },
      setView: 'always'
    }
  ).addTo(mapa);
  $(".classBotonPosicion").hover(
          function(){$(this).addClass("classBotonHover")},
          function(){$(this).removeClass("classBotonHover")}
  );
}

/////////////////////////////////////// BUSCADOR SOLR ///////////////////////////////////////////////////////////////////////////////////////////////////
function showFuentesBuscadorGeneral() {
  $("#fuentesBuscadorGeneral").show( "slow" );
}

function hideFuentesBuscadorGeneral() {
  $("#fuentesBuscadorGeneral").hide( "slow" );

  $("#buscador").autocomplete("search", $("#buscadorGeneral").val());

  if ($("#buscadorFuenteTodos").prop("checked")){
    $("#filtroFuenteBuscadorGeneralImg").attr("src", prot + urlAPI + "/images/solr_filtro.svg");
  } else{
    $("#filtroFuenteBuscadorGeneralImg").attr("src", prot + urlAPI + "/images/solr_filtro_relleno.svg");
  }
}

function selectAllFuentes(){
  checked = $("#fuentesBuscadorGeneral").find(':radio').prop("checked");
  $("#fuentesBuscadorGeneral").find(':checkbox').prop("checked", !checked);
}

function unselectAllFuentes(){
    if ($("#fuentesBuscadorGeneral input[type='checkbox']:checked").length>0) {
      $("#buscadorFuenteTodos").prop("checked", false);
    } else{
      $("#buscadorFuenteTodos").prop("checked", true);
    }
}

/////////////////////////////////////// BUSCADOR SOLR ///////////////////////////////////////////////////////////////////////////////////////////////////
function creaBuscador (mapa,idioma){
  //Se crea un "pane" para insertar resultados de de la búsqueda, con z-index = 610, por encima de los cluster (marker-pane con z-index=600)
	if (map.getPane("capaAnalisis") == undefined) {
		map.createPane("capaAnalisis");
		map.getPane("capaAnalisis").style.zIndex = 610;
	}
  /////// Construimos la base buscador extendiendo la clase control de leaflet///////
  L.Control.SearchBar = L.Control.extend({
      onAdd: function(mapa) {
        var className = 'control-searchBar',
            classNameContainer = 'leaflet-control-layers control-searchBar',
            container = this._container = L.DomUtil.create('div', classNameContainer);
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        var collapsed = true;
        var form = this._form = L.DomUtil.create('form', 'leaflet-control-layers-list control-searchBar');
        if (collapsed) {
          this._map.on('click', this.collapse, this);
        }
        var link = this._layersLink = L.DomUtil.create('a', 'leaflet-control-layers-toggle control-searchBar', container);
        link.href = '#';
        link.title = 'Buscador';
        if (L.Browser.touch) {
          L.DomEvent.on(link, 'click', L.DomEvent.stop);
          L.DomEvent.on(link, 'click', this.expand, this);
        } else {
          L.DomEvent.on(link, 'focus', this.expand, this);
        }
        if (!collapsed) {
          this.expand();
        }
        container.appendChild(form);

        var index = 0;
				if (idioma == 'va') {index=1;} 

        var html = "<div id='buscadorIzq' style='width: 20px; height: 20px;position: absolute;left: 4px;top: 4px;z-index: 1000;display:flex;align-items: center;justify-content: center;'>";
        html = html + "<div id='buscadorIzqNormal' style='display:flex;align-items: center; justify-content: center;width: 20px;'>";
        html = html +     "<img style='width:20px;'src='" + prot + urlAPI + "/images/buscar_localizacion.svg'></div>";
        html = html +  "<div id='buscadorIzqBorrar' style='display:none;width:20px;height:20px; align-items: center; justify-content: center;'>";
        html = html +  "  <img style='width:15px;'src='" + prot + urlAPI + "/images/buscar_localizacion_borrar.svg'></div>";
        html = html +  "</div>";
        if  ($(window).width() >=355) { 
          html = html +  "<input id='buscador' class='leaflet-control-layers-input control-searchBar' type='text' placeholder='" + MENSAJES.textoBuscador + "'>";
        }
        else {
          html = html +  "<input id='buscador' class='leaflet-control-layers-input control-searchBar' type='text' placeholder='" + MENSAJES.textoBuscador_movil + "'>";
        }
        //******** NUEVO SOLR ********
        html = html +  "<div id='filtroFuenteBuscadorGeneral' style='width:20px;height:20px; position: absolute;right: 1px;top: 6px;z-index: 1000; align-items: center; justify-content: center;' onclick='showFuentesBuscadorGeneral();'>";
        //html = html +  "<div id='filtroFuenteBuscadorGeneral' style='width:20px;height:20px; position: absolute;right: 1px;top: 6px;z-index: 1000; align-items: center; justify-content: center;'>";
        html = html +  "<img id='filtroFuenteBuscadorGeneralImg' style='width:18px;'src='" + prot + urlAPI + "/images/solr_filtro.svg'></div>";
			  html = html +  "<div id='fuentesBuscadorGeneral' style='display:none;'>";
        html = html +  "<input type='radio' id='buscadorFuenteTodos' checked='true' onclick='selectAllFuentes()' name='buscadorFuenteTodos'>";
				html = html +  "<label style='display:inline'>"+MENSAJES.rbTodos+"</label>";
				html = html +  "<fieldset id='fieldsetBuscador'>";
        html = html +  "<legend>"+MENSAJES.legendFuentes+"</legend>";
        for (var key in fuentesSolr) {
          var label = fuentesSolr[key].label.split(";")[index];
          html = html +"<input type='checkbox' id='buscadorFuente_" + key +"' value='"+fuentesSolr[key].value + "' onclick='unselectAllFuentes()'>" +
             "<label for='buscadorFuente_"+key+"' style='display:inline'>"+ label +"</label><br>";
        }

				html = html +  "</fieldset>";

				html = html +  "<div id='aceptarFuentesBuscadorGeneral' onClick='hideFuentesBuscadorGeneral();'>"+MENSAJES.btFiltrar+"</div>";
        //html = html +  "<div id='aceptarFuentesBuscadorGeneral'>"+MENSAJES.btFiltrar+"</div>";
				html = html + "</div></div>";

        $(form).append(html);
        return this._container;
      },

      onRemove: function(mapa) {
          // Nothing to do here
      },
      expand: function () {
        L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
        this._form.style.height = null;
        var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
        if (acceptableHeight < this._form.clientHeight) {
          L.DomUtil.addClass(this._form, 'leaflet-control-layers-scrollbar');
          this._form.style.height = acceptableHeight + 'px';
        } else {
          L.DomUtil.removeClass(this._form, 'leaflet-control-layers-scrollbar');
        }
        return this;
      },
      collapse: function () {
        L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
        return this;
      },
  });

  L.control.searchBar = function(opts) {
      return new L.Control.SearchBar(opts);
  }

	var puntoBusqueda;
  //////////Añadimos la funcionalidad al input////////////
  L.control.searchBar({ position: 'topright' }).addTo(mapa);
  $("#buscador").autocomplete({
      source: function(request, response){
				if(puntoBusqueda !== undefined){
					mapa.removeLayer(puntoBusqueda);
				}
          var urlQuery = servicioBusqueda +"?start=0&limit=40";
       
        var data = {
          consulta: request.term
        };

        if (!$("#buscadorFuenteTodos").prop("checked")){
          var fuentes = [];
          $("#fuentesBuscadorGeneral input[type='checkbox']:checked").each(function() {
              fuentes.push($(this).val());
          });

          data.fuentes = fuentes.join(",");
        }

        $.ajax({
          //url: prot +  "//descargas.icv.gva.es/server_api/buscador/solrclient.php?start=0&limit=10",
          url: prot + urlQuery,
          dataType: "json",
          data: data,
          success: function(data){
            var obj = [];
            //El resultado es un vector
            if (data.response.results.length !== undefined) {
              for (var i in data.response.results) {
                var item = data.response.results[i];
                  var reg =  {
                  label: item.nombre.length > 100 ? item.nombre.substring(0, 100) + "…" : item.nombre,
                  value: item.nombre,
                  clasificacion: item.clasificacion,
                  descripcion: item.descripcion,
                  epsg: epsgSolr, //definido en la configuracion
                  boundingbox: item.bbox
                }
                obj.push(reg);
              }
            //El resultado no es un vector (Referencia catastral)
            } else {
              var item = data.response.results;
              //Si hay un resultado, y no es nulo (Referencia catastral)
              if (item !== false) {
                if (item.link !== undefined) {
                  var enlace = item.link;
                  $.ajax({
                    url: proxyIDEVAPI + "?" + enlace,
                    dataType: "xml",
                    success: function (responsexml){
                      console.log(responsexml);
                      var direccion = responsexml.getElementsByTagName("ldt")[0].childNodes[0].nodeValue;
                      $("#buscadorDescripcion").text(direccion);
                    },
                    error: function(responsexml) {
                      var textoError = responsexml.ErrorCatastro;
                      $("#buscadorDescripcion").text(textoError);
                    }
                  });
                }
                var reg =  {
                  label: item.titulo,
                  value: item.titulo,
                  clasificacion: item.clasificacion,
                  descripcion: item.descripcion,
                  epsg: item.epsg,
                  boundingbox: item.boundingbox
                }
                obj.push(reg);
              }
            }
            response(obj);

          }
        });
      },
      minLength: 3,
      select: function(event, ui) {
        var bb = ui.item.boundingbox.split(',').map(parseFloat);
        var epsg = ui.item.epsg;
        //Si son coordenadas geográficas
        if (bb.length > 2) {  //Es un extent
          if (epsg == '4326') {	//EPSG:4326
            var coords3857Min = [bb[0],bb[1]];
            var coords3857Max = [bb[2],bb[3]];
          //Resto de EPSG hay que reproyectar
          } else {
            var coords3857Min = proj4('EPSG:' + epsg,'EPSG:4326',[bb[0],bb[1]]);
            var coords3857Max = proj4('EPSG:' + epsg,'EPSG:4326',[bb[2],bb[3]]);

          }
        } else {	//Es un punto (Catastro en EPSG:25830)
          if (epsg == '4326') {	//EPSG:4326
            var coords3857Min = [bb[0],bb[1]];
          //Si no, son EPSG:25830
          } else {
            var coords3857Min = proj4('EPSG:' + epsg,'EPSG:4326',[bb[0],bb[1]]);
          }
          var coords3857Max = coords3857Min;
        }
        if (coords3857Min[0]==coords3857Max[0]) {
          mapa.getPane("capaAnalisis").style.display = 'none';
          mapa.flyTo([coords3857Min[1],coords3857Min[0]], 19,{
            animate: true,
            duration: 2
          });
          	//No se visualiza el punto (pane "capaAnalisis") hasta que la animación del zoom se pare
          mapa.once('moveend', function() {
            mapa.getPane("capaAnalisis").style.display = 'block';
          });
					var latlng = [coords3857Min[1],coords3857Min[0]];

					puntoBusqueda = L.circleMarker(latlng,estiloPtoBusquedaSOLR).addTo(mapa);

        } else {
          mapa.flyToBounds([[coords3857Min[1],coords3857Min[0]],[coords3857Max[1],coords3857Max[0]]],{
            animate: true,
            duration: 2
          });
        }
        if ($("#buscadorIzqBorrar").css("display","none")){
          $("#buscadorIzqNormal").css("display","none");
          $("#buscadorIzqBorrar").css("display","flex");
        }

      },
      appendTo: ".control-searchBar",
    })
    .autocomplete("instance")._renderItem = function( ul,item ) {
      //var maxWidth = "360px";

      return $("<li>")
						.addClass("buscadorGeneralRes")
						.append(`
							<div>
								<span class="buscadorGeneralResLabel">${item.label}</span>
								<div class="buscadorGeneralResInferior">
									<span class="buscadorGeneralResClas">${item.clasificacion}</span>
									<span class="buscadorGeneralResDesc">${item.descripcion}</span>
								</div>
							</div>
						`)
						.appendTo(ul);
      /*
      return $( "<li>" )
        .append("<div style='padding:1px 0px 1px 1px;margin:0;max-width:" + maxWidth + ";'><span class='buscadorResLabel'>" + item.label + "</span><span class='buscadorResClas'>" + item.clasificacion + "</span><br><span id='buscadorDescripcion' class='buscadorResDesc'>" + item.descripcion + "</span></div>")
				.appendTo( ul );
      */
    };


    $("#buscadorIzqBorrar").click(function(){
    //$("#buscadorIzqBorrar").on( "click", function() {
      $("#buscador").val("");
      $("#buscador").focus();
      $("#buscadorIzqBorrar").css("display","none");
      $("#buscadorIzqNormal").css("display","flex");
      if(puntoBusqueda !== undefined){
        mapa.removeLayer(puntoBusqueda);
      }
    });
}
