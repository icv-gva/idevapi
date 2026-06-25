//Función que desplaza la extensión del mapa para mostrar el popup del Info (hacia el norte)
function desplazaMapaPopup (mapa,latlng,marco) {
  var coordsMapTopY = mapa.project(mapa.getBounds()._northEast).y;
  var coordsPopY = mapa.project(latlng).y;
  var coordsPopTop = coordsPopY -$(marco).parent().outerHeight()-50;
  var dif = coordsMapTopY - coordsPopTop;
  if (dif>0) {
    var centro = mapa.project(mapa.getCenter());
    var centroY = centro.y-dif;
    mapa.panTo(mapa.unproject([centro.x,centroY]),{animate: true}); // pan to new center
  }
}
//////////////////////////////////////////// POPUP Para servicios WMS /////////////////////////////////////////
//Modificar el popup recibido desde el servicio antes de mostrarlo
var MySource = L.WMS.Source.extend({
  identify: function (evt) {
    //Modificado para no capturar el Info con otros eventos activos
    if (!capturandoPuntoXY) {
        //Recoge las capas para cosntruir el GetFeatureInfo (parámetro "layers")
        var layers = this.getIdentifyLayers();  //['capa1','capa2']
        if (!layers.length) {
            return
        }
        controlGetFeatureInfo.numCapasInfo++;
        //evt.containerPoint = coordenadas pixel dentro del mapa (origen superior derecha)
        this.getFeatureInfo(evt.containerPoint,evt.latlng,layers,this.showFeatureInfo)
    }
  },

  getFeatureInfo: function (point, latlng, layers, callback) {//callback = this.showFeatureInfo
    //Prepara los parámetros del WMS
    var params = this.getFeatureInfoParams(point, layers),
        url = this._url + L.Util.getParamString(params, this._url);
    //Se realiza la petición GetFeatureInfo
    this.showWaiting();
    this.ajax(url, done);
    //Si no hay error en la respuesta
    function done(result) {
      this.hideWaiting();
      controlGetFeatureInfo.numCapasInfoRes++;
      //Reiniciamos al inicio del click en pantalla las class del ancho para el popup "popupInfoWMS"
      if (popupInfoWMS._contentNode !== undefined && controlGetFeatureInfo.numCapasInfoRes==1) {
        reiniciaAnchoInfo(popupInfoWMS._contentNode);
      }
      if (result == "" || result ==" " || result == null) {
        this.mostrarInfo(latlng, controlGetFeatureInfo.infos);
        return;
      } else {
          var html1 = document.createElement('html');
          html1.innerHTML = result;
          var txtBody = $($(html1).find('body:first')[0].innerHTML).text().trim();
          if (txtBody !== "") {

            //Modificar el popup si es necesario, si no lo devuelve sin cambios
            html1 = modificarPopup(html1, this.options.modificarPopup);
            var text = this.parseFeatureInfo($(html1).html(), url);
            if(result == "error"){
              callback.call(this, latlng, text)
            } else {
              //console.log(html2);
              callback.call(this, latlng, text);
              //callback.call(this, latlng, iframe);
            }
          }
      }
    }
  },

  showFeatureInfo: function (latlng, info) {
    if (!this._map) {
      return
    }
    controlGetFeatureInfo.infos.push({
      zindex: Number(this.options.pane.split("|")[2]),
      htmlInfo: info
    });
    //Si el número de respuestas GetFeatureInfo iguala a la del número de capas WMS con GetFeatureInfo activado
    if (controlGetFeatureInfo.numCapasInfo == controlGetFeatureInfo.numCapasInfoRes) {
      this.mostrarInfo(latlng, info);
    }

  },

  mostrarInfo: function (latlng, info) {
    if (controlGetFeatureInfo.infos.length>0) {
      //Ordena el vector de los Infos por orden de capa
      controlGetFeatureInfo.infos.sort(ordenaArrayObject('zindex', true, parseInt));
      var HTML = "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'/><title>Info IDEVAPI</title></head><body>";
      for(var i = 0; i < controlGetFeatureInfo.infos.length; i++){
        HTML += "<iframe id='info_" + i + "' scrolling='no' style='border:0px'></iframe>";
        HTML += "</iframe>";
      }
      HTML += "</body></html>";
      popupInfoWMS.setLatLng(latlng).setContent(HTML);
      popupInfoWMS.openOn(map);
      //Se añade el contenido a los iframes
      for(var i = 0; i < controlGetFeatureInfo.infos.length; i++){
        var iframes = $(".leaflet-popup-content").find("iframe#info_" + i);
        $.each(iframes, function(j, el) {
          el.srcdoc =  controlGetFeatureInfo.infos[i].htmlInfo;
        });
      }

      //Recorre cada iframe para redimensionar la altura al contenido
      var iframes = $(".leaflet-popup-content").find("iframe");
      $(iframes).each(function(i) {
        //Se ejecuta la función cuando se carga contenido. No se carga el CSS, va después, por eso se hace un pequeño SetTimeout
        this.onload = function(){
          var $this = this;
          $($this).css("width","100%");
          setTimeout(function(){
            var alturaF = $($this.contentWindow.document.body).outerHeight(true);//Altura del contenido del iframe, con márgenes
            $($this).height(alturaF);
            if (iframes.length-1 == i) {
              desplazaMapaPopup(map,latlng,$this); //(mapa,iframe)
            }
            //En algunos casos hay que redimensionar de nuevo el iframe
            alturaF = $($this.contentWindow.document.body).outerHeight(true);
            if ($($this).height() !== alturaF) {
              $($this).height(alturaF);
            }
          }, 50);
        }
      });
    }
    //Reiniamos valores de control del GetFeatureInfo para el próximo click
    this.reinicioContador();
  },

  reinicioContador: function () {
    if (controlGetFeatureInfo.numCapasInfo == controlGetFeatureInfo.numCapasInfoRes) {
          controlGetFeatureInfo = {};
          controlGetFeatureInfo.numCapasInfo = 0;
          controlGetFeatureInfo.numCapasInfoRes = 0;
          controlGetFeatureInfo.infos =[];
    }
  }
});

//////////////////////////////////////////// POPUP Para capas GeoJSON /////////////////////////////////////////
function creaHTMLCabecera (nombreCampo,valor,mostrarTitulo){
  if (mostrarTitulo){
    txtColSpan = " colspan='2'";
    txtNomCampo = "<span class='cabeceraTitulo'>" + nombreCampo + "</span><span>: </span>";
  } else {
    txtColSpan = "";
    txtNomCampo = "";
  }
  var html = "<tr><td class='cabecera'" + txtColSpan + ">" + txtNomCampo + "<span class='cabeceraValor'>" + valor + "</span></td></tr>";
  return html;
}

//Crea el Info a partir del TEMPLATE
function creaTemplatePopupGeoJSON (feature,tablaInfo) {

  // Función para reemplazar los valores en el template
  function replaceTemplate(template, properties, idioma) {
    if (Array.isArray(template)) {
        template = idioma === "va" ? template[1] : template[0];
    }
    return template.replace(/\[([^\]]+)\]/g, (match, p1) => {
        return properties[p1] || '';
    });
  }

  // Reemplazar los valores en el template
  const html = replaceTemplate(tablaInfo.template, feature.properties, IDEVAPI_global.idioma);

  return html;
}

//Crea la tabla info de elementos que se insertará en un HTML (Crea una tabla)
function creaTablaPopupGeoJSON (feature,tablaInfo) {
	if(tablaInfo.estilo == 'ICV'){
    var html = "<table class='tablaInfoICV'>";
  } else if (tablaInfo.estilo == 'GVA') {
		var html = "<table class='tablaInfoGVA'>";
	} else {
		var html = "<table class='tablaInfo'>";
	}
  ///////////// CABECERA //////////
  if (tablaInfo.mostrarNombreCampos){txtColSpan = " colspan='2'";} else {txtColSpan = "";}
  if (tablaInfo.titulo !== "IDEVAPI_Valor" && tablaInfo.titulo !== "") {
    html += "<tr><td class='cabecera'" + txtColSpan + ">" + tablaInfo.titulo + "</td></tr>";
  }
  var cont = 0;
  //***********************************************************************************************************
	//**** SI HAY definidos ALIAS, la tabla se crea con los alias
  //***********************************************************************************************************
  if (feature.propertiesAlias !== undefined) {
		var numCamposAlias = Object.keys(feature.propertiesAlias).length;
		for (var i in feature.propertiesAlias) {
      var nombreCampo;
      var valorEnlace = "";
      //Se asignan las clases del valor del campo
      var estiloExtra = "";
      var estiloExtra2 = "";
      if (feature.estiloCampo !== undefined) {
        if (feature.estiloCampo[i] !== undefined) {
          var estiloExtra = " style='" + feature.estiloCampo[i] + "'";
          var estiloExtra2 = feature.estiloCampo[i];
        }
      }
      //**
			if (i.indexOf("enlaceIncrustado|") !== -1) {
        if (i.split("|")[3] !== undefined) {
          nombreCampo = i.split("|")[3];
        } else {
          nombreCampo = "";
        }
      } else if (i.indexOf("enlaceVentana|") !== -1) {
        if (i.split("|").length == 4) {
          nombreCampo = i.split("|")[2];
          valorEnlace = i.split("|")[3];
        } else {
          nombreCampo = i;
        }
      } else {
        if (i.split("|").length == 2) {
          nombreCampo = i.split("|")[0];
          valorEnlace = i.split("|")[1];
        } else {
          nombreCampo = i;
        }
      }
      //*************************************************************** El campo no contiene ningún valor *********************************************************************
      if ((feature.propertiesAlias[i] == null) || (feature.propertiesAlias[i] == "null")) {
				html += "<tr>";
				if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
				html += "<td class='tValor'" + estiloExtra +"></td></tr>";
      //**************************************************************** Imagen o vídeo incrustado en la tabla ****************************************************************
			} else if (i.indexOf("enlaceIncrustado|") !== -1) {
				//SI el contenido del enlace NO es vacío
				if ((feature.propertiesAlias[i].toString().indexOf("http://") !== -1) || (feature.propertiesAlias[i].toString().indexOf("https://") !== -1)) {
					var tipoEnlace = i.split("|")[1];
					var tamanyoAncho = i.split("|")[2].split(",")[0];
					var tamanyoAlto = i.split("|")[2].split(",")[1];

					//SI sólo se muestra el enlace
					if (numCamposAlias == 1) {
            //IMAGEN
						if (tipoEnlace == "img") {
							//Solo imagen
              //Si no se rellena Alias, se realiza colspan y no se muestra título para la foto
              if (nombreCampo == "") {
                html += "<tr>";
                //if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
                if (tablaInfo.mostrarNombreCampos) {
                  html += "<td colspan=2 class='tValor' style='text-align: center;" + estiloExtra2 + "'><img src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></td></tr>";
                } else {
                  html += "<td class='tValor' style='text-align: center;" + estiloExtra2 + "'><img src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></td></tr>";
                }
              } else {
                html += "<tr>";
                if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
                html += "<td class='tValor' style='text-align: center;" + estiloExtra2 + "'><img src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></td></tr>";
              }
            //VIDEO
						} else if (tipoEnlace == "vid") {
							html += "<tr><td class='tValor' style='text-align: center;" + estiloExtra2 + "'><video controls src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></video></td></tr>";
							//html += "<tr><td class='tablaValor'><video controls style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'><source src='" + feature.propertiesAlias[i] + "' type='video/mp4'></video></td></tr>";
						}

					//SI se muestran varios campos junto al enlace
					} else {
            //IMAGEN
						if (tipoEnlace == "img") {
							//Campo con imagen, junto a otros campos
              if (nombreCampo == "") {
                html += "<tr>";
							  //if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
                html += "<td colspan=2 class='tValor' style='text-align: center;" + estiloExtra2 + "'><img src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></td></tr>";
              } else {
                html += "<tr>";
                if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
                html += "<td class='tValor' style='text-align: center;" + estiloExtra2 + "'><img src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;align:center;'></td></tr>";
              }
            //VIDEO
						} else if (tipoEnlace == "vid"){
							html += "<tr>";
							if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
							html += "<td class='tValor' style='text-align: center;" + estiloExtra2 + "'><video controls src='" + feature.propertiesAlias[i] + "' style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'></video></td></tr>";
							//html += "<tr><td class='tablaNombre'>" + nombreCampo + "</td><td class='tablaValor'><video controls style='width:" + tamanyoAncho + "px;height:" + tamanyoAlto + "px;'><source src='" + feature.propertiesAlias[i] + "' type='video/mp4'></video></td></tr>";
						}
					}
				//SI el contenido del enlace es vacío
				} else {
          if (IDEVAPI_global.idioma != 'va') {var msjSinContenido = "Sin contenido";} else {var msjSinContenido = "Sense contingut";}
					if (numCamposAlias == 1) {
						//Campo enlaceIDEV sin enlace
						html += "<tr><td class='tValor'" + estiloExtra +">" + msjSinContenido + "</td></tr>";
					} else {
						html += "<tr>";
						if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
						html += "<td class='tValor'" + estiloExtra +">" + msjSinContenido + "</td></tr>";
					}
				}
      //**************************************************************** Imagen o vídeo con enlace que se abrirá con ventana independiente y tamaño concreto ****************************************************************
      } else if (i.indexOf("enlaceVentana|") !== -1) {
        //SI el contenido del enlace NO es vacío
				if ((feature.propertiesAlias[i].toString().indexOf("http://") !== -1) || (feature.propertiesAlias[i].toString().indexOf("https://") !== -1)) {
          var w = i.split("|")[1].split(",")[0];
					var h = i.split("|")[1].split(",")[1];
          var left = (screen.width/2)-(w/2);
          var top = (screen.height/2)-(h/2)
          //Campo ENLACE Normal
          html += "<tr>";
          if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
          var funcionAbreVentana = "window.open('" + feature.propertiesAlias[i] + "','EnlaceVentanaIDEV','toolbar=no, location=no, directories=no, titlebar=no,status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width="+w+", height="+h+", top="+top+", left="+left+"');";
          //Campo ENLACE: Si no hay nombre para el enlace
          if (valorEnlace == "") {
            html += "<td class='tValor'" + estiloExtra +"><div class='idevapiEnlace' onclick=\"" + funcionAbreVentana + "\">" + nombreCampo + "</a></td></tr>";
          //Campo ENLACE: Si hay definido un texto para el enlace (caracter "|" después del alias del campo)
          } else {
            html += "<td class='tValor'" + estiloExtra +"><div class='idevapiEnlace' onclick=\"" + funcionAbreVentana + "\">" + valorEnlace + "</a></td></tr>";
          }
        //SI el contenido del enlace está vacío
        } else {
          if (IDEVAPI_global.idioma != 'va') {var msjSinContenido = "Sin contenido";} else {var msjSinContenido = "Sense contingut";}
					if (numCamposAlias == 1) {
						//Campo enlaceIDEV sin enlace
						html += "<tr><td class='tValor'" + estiloExtra +">" + msjSinContenido + "</td></tr>";
					} else {
						html += "<tr>";
						if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
						html += "<td class='tValor'" + estiloExtra +">" + msjSinContenido + "</td></tr>";
					}
        }
      //**************************************************************** Imagen o vídeo con enlace que se abrirá con ventana independiente ****************************************************************
			} else if ((feature.propertiesAlias[i].toString().indexOf("http://") !== -1) || (feature.propertiesAlias[i].toString().indexOf("https://") !== -1))  {
				//Campo ENLACE Normal
				html += "<tr>";
				if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
        //Campo ENLACE: Si no hay nombre para el enlace
        if (valorEnlace == "") {
          html += "<td class='tValor'" + estiloExtra +"><a href='" + feature.propertiesAlias[i] + "' target='_blank'>" + nombreCampo + "</a></td></tr>";
        //Campo ENLACE: Si hay definido un texto para el enlace (caracter "|" después del alias del campo)
        } else {
          html += "<td class='tValor'" + estiloExtra +"><a href='" + feature.propertiesAlias[i] + "' target='_blank'>" + valorEnlace + "</a></td></tr>";
        }
      //**************************************************************** Campo normal ****************************************************************
			} else {
				//Campo Normal
        if (cont == 0 && tablaInfo.titulo == "IDEVAPI_Valor") {
          //Es el título de la tabla (Cabecera de la tabla)
          html += creaHTMLCabecera (nombreCampo,feature.propertiesAlias[i],tablaInfo.mostrarNombreCampos);
        } else {
          html += "<tr>";
          if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + nombreCampo + "</td>"};
          html += "<td class='tValor'" + estiloExtra +">" + feature.propertiesAlias[i] + "</td></tr>";
        }
			}
      cont++;
		}
		html += "</table>";
  //*******************************************************************************************************************************
	//**** SI NO HAY ALIAS, se crean con los properties originales
  //********************************************************************************************************************************
	} else {
		for (var i in feature.properties) {
      //Se asignan las clases del valor del campo
      var estiloExtra = "";
      var estiloExtra2 = "";
      if (feature.estiloCampo !== undefined) {
        if (feature.estiloCampo[i] !== undefined) {
          var estiloExtra = " style='" + feature.estiloCampo[i] + "'";
          var estiloExtra2 = feature.estiloCampo[i];
        }
      }
      //Si el campo es de valor nulo
			if (feature.properties[i] == null) {
        html += "<tr>";
				if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + i + "</td>";};
				html += "<td class='tValor'" + estiloExtra +"></td></tr>";
      //Si el campo tiene un enlace
			} else if ((feature.properties[i].toString().indexOf("http://") !== -1) || (feature.properties[i].toString().indexOf("https://") !== -1)) {
        html += "<tr>";
        if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + i + "</td>";};
				html += "<td class='tValor'" + estiloExtra +"><a href='" + feature.properties[i] + "' target='_blank'>Enlace</a></td></tr>";
			//Si es un Campo Normal
      } else {
        if (cont == 0 && tablaInfo.titulo == "IDEVAPI_Valor") {
          //Es el título de la tabla (Cabecera de la tabla)
          html += creaHTMLCabecera (i,feature.properties[i],tablaInfo.mostrarNombreCampos);
        } else {
          html += "<tr>";
          if (tablaInfo.mostrarNombreCampos){html += "<td class='tNombre'>" + i + "</td>";};
          html += "<td class='tValor'" + estiloExtra +">" + feature.properties[i] + "</td></tr>";
        }
			}
      cont++;
		}
		html += "</table>";
	}
  return html;
}


//Modifica el ancho de la Tabla del Info. Añade el estilo correspondiente a la ventana popup

function modificaAnchoInfo(ancho) {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        observer.disconnect(); // Desconectar el observador para evitar recursion

        let actualPopup = $(mutation.addedNodes[0]).find(".leaflet-popup-content");

        if (ancho <= 125){
          $(actualPopup).addClass('leaflet-popup-content-ancho100');
        } else if (ancho > 125 && ancho <= 175) {
          $(actualPopup).addClass('leaflet-popup-content-ancho150');
        } else if (ancho > 175 && ancho <= 225){
          $(actualPopup).addClass('leaflet-popup-content-ancho200');
        } else if (ancho > 225 && ancho <= 275){
          $(actualPopup).addClass('leaflet-popup-content-ancho250');
        } else if (ancho > 275 && ancho <= 325){
          $(actualPopup).addClass('leaflet-popup-content-ancho300');
        } else {
          $(actualPopup).addClass('leaflet-popup-content-ancho350');
        }

        //Para el Info de los WMS, que puede tener varios anchos, se deja el más ancho
        let anchos = [];
        let classList = $(actualPopup).attr('class').split(/\s+/);
        $.each(classList, function(index, item) {
          var anchoRecorrido = Number(item.substr(item.length - 3));
          if (!isNaN(anchoRecorrido)) {
            anchos.push(anchoRecorrido);
            anchos.sort(function(a, b) {return a - b;});
          }
        });
        //Recorre todos los class y deja solo el último (el más ancho)
        for(let i = 0; i < anchos.length-1; i++){
          $(actualPopup).removeClass('leaflet-popup-content-ancho' + anchos[i]);
        }
      }
    });
  });

  observer.observe(document.querySelector(".leaflet-popup-pane"), { childList: true });
}

function reiniciaAnchoInfo(contenidoPopup) {
  if (contenidoPopup !== undefined) {
    if ($(contenidoPopup).hasClass('leaflet-popup-content-ancho100')) {
      $(contenidoPopup).removeClass('leaflet-popup-content-ancho100');
    }
    if ($(contenidoPopup).hasClass('leaflet-popup-content-ancho150')) {
      $(contenidoPopup).removeClass('leaflet-popup-content-ancho150');
    }
    if ($(contenidoPopup).hasClass('leaflet-popup-content-ancho200')) {
      $(contenidoPopup).removeClass('leaflet-popup-content-ancho200');
    }
    if ($(contenidoPopup).hasClass('leaflet-popup-content-ancho250')) {
      $(contenidoPopup).removeClass('leaflet-popup-content-ancho250');
    }
    if ($(contenidoPopup).hasClass('leaflet-popup-content-ancho300')) {
      $(contenidoPopup).removeClass('leaflet-popup-content-ancho300');
    }
  }
}
//////////////////////////////////////////// POPUP Para capas GeoJSON /////////////////////////////////////////
//Crea el HTML DEL INFO de los elementos de las capas GeoJSON
function popupGeoJSON (feature, layer, tablaInfo) {
  if (tablaInfo.template !== null) {
    var html = creaTemplatePopupGeoJSON(feature,tablaInfo);
  } else {
    var html = creaTablaPopupGeoJSON(feature,tablaInfo);
  }
	let html1 = document.createElement('html');
	html1.innerHTML = html;
	html1 = modificarPopup(html1, {url:feature.urlCapa, titulo:feature.tituloCapa, tipo:"GeoJSON"});
  function cambiaEstilo(tablaInfo){
    modificaAnchoInfo(tablaInfo.ancho);
  }

  let popupPersonalizado = L.popup().setContent(html1);
  //Se añade el objeto opoup a la capa para que se pueda usar cuando haga falta.
  layer.popupPers = popupPersonalizado;

  layer.on("click",function(e){
    L.DomEvent.stopPropagation(e);
    cambiaEstilo(tablaInfo);
    //Función que se ejecuta cuando "Capturar en pantalla" de Zoom a XY está activo. captura las coordenadas del punto, y realiza buffer si está activo
    if (capturandoPuntoXY) {
      eventoClicCapturarXY(e);  //idevAPI_zoomXY.js
    //Si no está capturando XY, abre la info del elemento (hace un bindPopup a mano)
    } else {
        this.popupPers.setLatLng(e.latlng).addTo(map).openOn(map);
    }
  });
}

///////////////////////////////////////////// MODIFICARPOPUP //////////////////////////////////////////////////////////
// Modifica el info creado para adaptarlo a particularidades que se requieren para determinados servicios de mapas

function modificarPopup (html1, opciones){

  if(opciones == undefined){opciones = {url:'', titulo:''}}
  if(opciones.url == undefined){opciones.url = ''}
  if(opciones.titulo == undefined){opciones.titulo = ''}
  if(opciones.tipo == undefined){opciones.tipo = ''}
  opciones.url = opciones.url.replace(/https?:\/\//i, "");
  opciones.url = opciones.url.replace(/http?:\/\//i, "");
  //Se elimina el margen de 8 px por defecto del PopupInfo
  //$(html1).find("body").css("margin","0px");
  if(opciones.tipo == "GeoJSON"){
    $(html1).find("body").addClass("bodyInfo");
  }
  //$(html1).find("body").addClass("bodyInfo");
  ////////////////////////////////////////////////// Caso particular LABORA /////////////////////////////////////
  if(opciones.url == "carto.icv.gva.es/arcgis/services/tm_empleo/labora/MapServer/WmsServer" || opciones.url == "carto.icv.gva.es/arcgis/services/tm_empleo/labora/MapServer/WMSServer"){
    var tablaNombre =  html1.getElementsByClassName('tNombre');
    var tablaValor =  html1.getElementsByClassName('tValor');
    if(opciones.titulo == "Punt Labora" || opciones.titulo == "Punto Labora" ){
      for (var i = 0; i < tablaNombre.length; i++) {
        if (tablaNombre[i].innerHTML == "Nombre" || tablaNombre[i].innerHTML == "Nom"){
          var tituloPopup = opciones.titulo + ": " + tablaValor[i].innerHTML;
          if (IDEVAPI_global.idioma != 'es') {
            tablaNombre[i].innerHTML = "Nom";
          }
        } else if (tablaNombre[i].innerHTML == "Dirección"){
          if (IDEVAPI_global.idioma != 'es') {
            tablaNombre[i].innerHTML = "Direcció";
          }
        } else if (tablaNombre[i].innerHTML == "Municipio"){
          if (IDEVAPI_global.idioma != 'es') {
            tablaNombre[i].innerHTML = "Municipi";
          }
        }
      }
    } else if(opciones.titulo == "Labora formación" || opciones.titulo == "Labora formació"){
      for (var i = 0; i < tablaNombre.length; i++) {
        if (tablaNombre[i].innerHTML == "Municipi"){
          var tituloPopup = opciones.titulo + ": " + tablaValor[i].innerHTML;
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Espacio";
          } else {
            tablaNombre[i].innerHTML = "Espai";
          }
        }else if (tablaNombre[i].innerHTML == "Espacio" || tablaNombre[i].innerHTML == "Espai"){
          var tituloPopup = opciones.titulo + ": " + tablaValor[i].innerHTML;
        } else if (tablaNombre[i].innerHTML == "email"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Correo";
          } else {
              tablaNombre[i].innerHTML = "Correu";
          }
        } else if (tablaNombre[i].innerHTML == "Activitats"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Actividades";
          }
        } else if (tablaNombre[i].innerHTML == "Direcció"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Dirección";
          }
        } else if (tablaNombre[i].innerHTML == "Telèfon"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Teléfono";
          }
        }
      }
    } else {
      for (var i = 0; i < tablaNombre.length; i++) {
        if (tablaNombre[i].innerHTML == "Centre"){
          var tituloPopup = opciones.titulo + ": " + tablaValor[i].innerHTML;
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Espacio";
          } else {
            tablaNombre[i].innerHTML = "Espai";
          }
        } else if (tablaNombre[i].innerHTML == "Espacio" || tablaNombre[i].innerHTML == "Espai"){
          var tituloPopup = opciones.titulo + ": " + tablaValor[i].innerHTML;
        } else if (tablaNombre[i].innerHTML == "Domicili"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Dirección";
          } else {
              tablaNombre[i].innerHTML = "Direcció";
          }
        } else if (tablaNombre[i].innerHTML == "email"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Correo";
          } else {
              tablaNombre[i].innerHTML = "Correu";
          }
        } else if (tablaNombre[i].innerHTML == "Telèfon"){
          if (IDEVAPI_global.idioma == 'es') {
            tablaNombre[i].innerHTML = "Teléfono";
          }
        }
      }
    }

    var h5 = html1.getElementsByTagName('h5');
    if(h5.length == 0){
      var tabla = html1.getElementsByTagName('table')[0];
      tabla.insertAdjacentHTML('beforebegin', '<h5></h5>');
    }

    h5 = html1.getElementsByTagName('h5')[0];
    h5.innerHTML = tituloPopup;
    h5.style.cssText = "font-size:120%;";
    var tablaTr = html1.getElementsByTagName('tr');
    var l = tablaTr.length;
    if (l > 0){
      var parent = tablaTr[0].parentNode;
      for (var i = 0; i < l; i++) {
        if(tablaTr[i].innerHTML.indexOf("tablaCabecera") != -1){
          parent.removeChild(tablaTr[i]);
          l--;
          i--;
        } else if (tablaTr[i].innerHTML.indexOf("ObjectId") != -1) {
          parent.removeChild(tablaTr[i]);
          l--;
          i--;
        } else if (tablaTr[i].innerHTML.indexOf("Shape") != -1) {
          parent.removeChild(tablaTr[i]);
          l--;
          i--;
        } else if (tablaTr[i].innerHTML.indexOf("Código") != -1) {
          parent.removeChild(tablaTr[i]);
          l--;
          i--;
        }
      }
    }

  ////////////////////////////////////////////////// Caso particular ELECCIONES 2019 /////////////////////////////////////
  } else if(opciones.url == 'terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_generales_2019.map' ||
    opciones.url == 'terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_europeas_2019.map' ||
    opciones.url == 'terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_locales_2019.map' ||
    opciones.url == 'terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_autonomicas_2019.map'
  ){
    var campoNombre = html1.getElementsByClassName('IWMSTNombre');
    var campoValor = html1.getElementsByClassName('IWMSTValor');
    var campoCabecera = html1.getElementsByClassName('IWMSCabecera');
    for (var i = 0; i < campoNombre.length; i++) {
      if (campoNombre[i].innerHTML == "Dades electorals"){
        if (IDEVAPI_global.idioma == 'es') {
          campoNombre[i].innerHTML = "Datos electorales";
        }
      } else if (campoNombre[i].innerHTML == "Abstencions"){
        if (IDEVAPI_global.idioma == 'es') {
          campoNombre[i].innerHTML = "Abstenciones";
        }
      }
    }

    for (var i = 0; i < campoValor.length; i++) {
      if(campoValor[i].children.length > 0){
        if (IDEVAPI_global.idioma == 'es') {
          campoValor[i].children[0].innerText = "Pulsa aquí"
        }
      }
    }

    for (var i = 0; i < campoCabecera.length; i++) {
      if (IDEVAPI_global.idioma == 'es') {
        var textoInicial = campoCabecera[i].innerText;
        campoCabecera[i].innerText = "Municipio: " + campoCabecera[i].innerText.substr(9);
      }
    }
    
  ////////////////////////////////////////////////// Caso particular INFO CATASTRO /////////////////////////////////////
  //Se crea un nuevo HTML con los datos devueltos del GetFeatureInfo
  } else if (opciones.url.indexOf("ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS") !== -1){
    var enlaceFicha = $(html1).find("a").html();
    //Si El getFeatureInfo devuelve un <p>Referencia catastral de la parcela:</p> -> respuesta normal
    if ($(html1).find("p").html() == "Referencia catastral de la parcela:") {
      var href =$(html1).find("a").attr('href');
      var HTMLEnlace = "";
      if (enlaceFicha == undefined) {
        HTMLEnlace = "<div style='font-family:RobotoBold'> Sin datos</div>";
      } else {
        HTMLEnlace = "<a target='_blank' href='" + href + "' style='font-family:RobotoBold'>" + enlaceFicha + "</a>";
      }
      if (opciones.tablaInfo.estilo == "GVA"){
        var cssTabla = URLFicherosWeb + "geomapserver/estilos/getfeatureinfo_html_gva.css";
      } else if (opciones.tablaInfo.estilo == "ICV"){
        var cssTabla = URLFicherosWeb + "geomapserver/estilos/getfeatureinfo_html_icv.css";
      } else if (opciones.tablaInfo.estilo == "gris"){
        var cssTabla = URLFicherosWeb + "geomapserver/estilos/getfeatureinfo_html.css";
      } else {
        var cssTabla = URLFicherosWeb + "geomapserver/estilos/getfeatureinfo_html_icv.css";
      }
        var txtHTML = "<head><link rel='stylesheet' href='" + cssTabla + "'></head>";
      txtHTML += "<body class='MSBodyInfo'>";
      txtHTML += "<table class='MSTablaInfo'>";
      txtHTML += "<tr><td colspan=2 class='MSCabeceraInfo'><span class='MSCabeceraTitulo'></span><span></span><span class='MSCabeceraValor'>Información Catastral (D.G. Catastro)</span></td></tr>";
      txtHTML += "<tr><td class='MSTablaNombre'>Referencia de parcela</td><td class='MSTablaValor'>" + HTMLEnlace + "</td></tr>";
      var html1 = document.createElement('html');
      html1.innerHTML = txtHTML;
    //Si el servicio al realizar GetFeatureInfo tiene algún tipo de error
    } else {
      var txtHTML = "<head><link rel='stylesheet' href='" + URLFicherosWeb + "geomapserver/estilos/getfeatureinfo_html_icv.css'></head>";
      txtHTML += "<body style='font-family:Roboto;margin:0;font-size:12px;'><div>Existe algún error en el servicio WMS de Catastro</div></body>";
      var html1 = document.createElement('html');
      html1.innerHTML = txtHTML;
    }
  }

  // CAMBIO DEL ESTILO DEL GETFEATUREINFO EN CASO DE SERVICIOS WMS  ////////////////////////////////////////////////////////////////////
  ///////////////////////// Cambia nombres de campos si hay definido Alias, esconde nombres de campos y crea cabeceras para las capas WMS de AGS y MS /////////////////////////
  if (opciones.tipo == "WMS") {

    //Si se eliminan los nombres de los campos
    if (!opciones.tablaInfo.mostrarNombreCampos) {
      var celdasNomCampo = $(html1).find("td.AGSTablaNombre,td.MSTablaNombre,span.MSCabeceraTitulo");
      var spanCabeceraPtos = $(html1).find("span.MSCabeceraTitulo").next(); //Span donde se encuentra el carácter ":" de la cabecera
      for (var i = 0; i < celdasNomCampo.length; i++) {
        celdasNomCampo[i].remove();
        spanCabeceraPtos.remove();
      }
    //Si NO se eliminan los nombres de los campos, y existen ALIAS
    } else if (opciones.tablaInfo.alias !== undefined){
      var celdas = $(html1).find("td.AGSTablaNombre,td.MSTablaNombre,span.MSCabeceraTitulo");
      var l = celdas.length;

      if (l>0) {
        //Recorre filas del HTML
        for (var i = 0; i < l; i++) {
          var hayCoincidencia = false;
          txtCampo = $(celdas[i]).html();
          //Recorre alias definidos por el usuario
          for (var j in opciones.tablaInfo.alias) {
            if (txtCampo == j) {
              $(celdas[i]).html(opciones.tablaInfo.alias[j]);
              hayCoincidencia = true;
              break;
            }
          }
          //Si no existe correspondencia con la lista de Alias, se borra la fila (elemento TR padre más cercano) en la tabla original del GeoFeatureInfo
          if (!hayCoincidencia) {
            $(celdas[i]).closest('tr').remove();
          }
        }
      }
    }
    //Si hay definido un ESTILO para la tabla, se aplica el CSS
    if (opciones.tablaInfo.estilo !== "") {
      //Modifica estilo del HTML de AGS
      if (opciones.url.indexOf("/arcgis/") !== -1) {
        var txtHtml = "";
        if (opciones.tablaInfo.estilo == "GVA"){
          txtHtml = $(html1).html().replace('border: 1px solid rgb(0,103,127);', 'border: 1px solid rgb(200,15,46);');
          txtHtml = txtHtml.replace('background-color: rgb(0,103,127);', 'background-color: rgb(200,15,46);');
          txtHtml = txtHtml.replace('border: 1px solid rgb(80,80,80);', 'border: 1px solid rgb(200,15,46);');
          txtHtml = txtHtml.replace('background-color: rgb(80,80,80);', 'background-color: rgb(200,15,46);');
        } else if (opciones.tablaInfo.estilo == "ICV"){
          txtHtml = $(html1).html().replace('border: 1px solid rgb(200,15,46);', 'border: 1px solid rgb(0,103,127);');
          txtHtml = txtHtml.replace('background-color: rgb(200,15,46);', 'background-color: rgb(0,103,127);');
          txtHtml = txtHtml.replace('border: 1px solid rgb(80,80,80);', 'border: 1px solid rgb(0,103,127);');
          txtHtml = txtHtml.replace('background-color: rgb(80,80,80);', 'background-color: rgb(0,103,127);');
        } else if (opciones.tablaInfo.estilo == "gris"){
          txtHtml = $(html1).html().replace('border: 1px solid rgb(200,15,46);', 'border: 1px solid rgb(80,80,80);');
          txtHtml = txtHtml.replace('background-color: rgb(200,15,46);', ' background-color: rgb(80,80,80);');
          txtHtml = txtHtml.replace('border: 1px solid rgb(0,103,127);', 'border: 1px solid rgb(80,80,80);');
          txtHtml = txtHtml.replace('background-color: rgb(0,103,127);', 'background-color: rgb(80,80,80);');
        }
      //Modifica ESTILO del HTML de MS
      } else {
        var txtHtml = "";
        if (opciones.tablaInfo.estilo == "GVA"){
          txtHtml = $(html1).html().replace(/getfeatureinfo_html_icv.css/g, 'getfeatureinfo_html_gva.css');
          txtHtml = txtHtml.replace(/getfeatureinfo_html.css/g, 'getfeatureinfo_html_gva.css');
        } else if (opciones.tablaInfo.estilo == "ICV"){
          txtHtml = $(html1).html().replace(/getfeatureinfo_html_gva.css/g, 'getfeatureinfo_html_icv.css');
          txtHtml = txtHtml.replace(/getfeatureinfo_html.css/g, 'getfeatureinfo_html_icv.css');
        } else if (opciones.tablaInfo.estilo == "gris"){
          txtHtml = $(html1).html().replace(/getfeatureinfo_html_gva.css/g, 'getfeatureinfo_html.css');
          txtHtml = txtHtml.replace(/getfeatureinfo_html_icv.css/g, 'getfeatureinfo_html.css');
        }
      }
      var html1 = document.createElement('html');
      html1.innerHTML = txtHtml;
    }
    ///////// Modificamos ancho popup ////////////////
    //Si hay definida una anchura del Info, se cambia (por defecto 300px / 250px para móviles de menos de 350px de ancho)
    modificaAnchoInfo(opciones.tablaInfo.ancho);
    ////////////////////////////////////////////////////////

    //En caso de AGS y haya un titulo configurado, se añade CABECERA a la tabla
    if (opciones.tablaInfo.titulo !== "") {
      // AGS //
      if (opciones.url.indexOf("/arcgis/") !== -1) {
        //Caso de que la primera fila haga de cabecera (solo AGS)
        if (opciones.tablaInfo.titulo == "IDEVAPI_Valor") {
          var tablas = $(html1).find('table');
          for (var i = 0; i < tablas.length; i++) {
            var nomCampo = $(tablas[i]).find("td:first").html();
            var nomValor = $(tablas[i]).find("td:last").html();
            var nuevaCabecera = $('<td colspan=2 class="AGSCabeceraInfo"><span class="AGSCabeceraTitulo">' + nomCampo + '</span><span>: </span><span class="AGSCabeceraValor">' + nomValor + '</span></td>');
            $(tablas[i]).find("tr:first").remove();
            $(tablas[i]).find("tbody").prepend(nuevaCabecera);
          }
        //AGS - Caso de que el nombre de la capa o cualquier otro título personalizado haga de CABECERA (IDEVAPI_Capa)
        } else {
          var tablas = $(html1).find('table');
          for (var i = 0; i < tablas.length; i++) {
            var nuevaCabecera = $('<td colspan=2 class="AGSCabeceraInfo"><span class="AGSCabeceraTitulo"></span><span class="AGSCabeceraValor">' + opciones.tablaInfo.titulo + '</span></td>');
            $(tablas[i]).find("tbody").prepend(nuevaCabecera);
          }
        }
      //MS - Caso de que el nombre de la capa o cualquier otro título personalizado haga de CABECERA (IDEVAPI_Capa)
      } else if (opciones.url.indexOf("/arcgis/") == -1){
        //En caso de MS no contempla "IDEVAPI_Valor" ya que de por sí MS tiene cabecera
        if (opciones.tablaInfo.titulo !== "IDEVAPI_Valor") {
          var tablas = $(html1).find('table');
          for (var i = 0; i < tablas.length; i++) {
            var spanCabeceraTitulo = $(tablas[i]).find("span.MSCabeceraTitulo");
            if ($(spanCabeceraTitulo).length > 0) {
              var campoCabecera = $(tablas[i]).find("span.MSCabeceraTitulo").html();
              var valorCabecera =$(tablas[i]).find("span.MSCabeceraValor").html();
              var nuevaCabecera = $('<tr><td colspan=2 class="MSCabeceraInfo"><span class="MSCabeceraTitulo"></span><span class="MSCabeceraValor">' + opciones.tablaInfo.titulo + '</span></td></tr>');
              var nuevaFila = $('<tr><td class="MSTablaNombre">' + campoCabecera + '</td><td class="MSTablaValor">' + valorCabecera + '</td></tr>');
              $(tablas[i]).find("tr:first").remove();
              $(tablas[i]).find("tbody").prepend(nuevaFila);
              $(tablas[i]).find("tbody").prepend(nuevaCabecera);
            }
          }
        }
      }
    }
  }

  //Siempre devolver html1
  return html1;
}

//////////////////////////////////////////// POPUP Para capas GeoJSON (Cuando hay Cluster de más de 1 elemento) /////////////////////////////////////////
function popupGeoJSONCluster(markerCluster,tablaInfo){
  //Si NO está activo el spiderfy
  if(!markerCluster.options.spiderfyOnMaxZoom) {
    //Entra si NO está activado el Spiderfy -> Se asigna al click sobre el cluster un popup con todos los elementos del cluster
    markerCluster.on('clusterclick', function(a){
      if (capturandoPuntoXY) {
        eventoClicCapturarXY(a);  //idevAPI_zoomXY.js
      //Si no está capturando XY, abre la info del elemento (hace un bindPopup a mano)
      } else {
        if (a.layer._zoom == markerCluster._map.options.maxZoom){
          //Si el zoom es el máximo que permite el mapa, abre el popup (Si no hará zoom al clúster hasta que sea zoom máximo)
          var html = "";
          var num = a.layer._markers.length;
          var cont = 0;
          for (feat in a.layer._markers){
            if (tablaInfo.template !== null) {
              html += creaTemplatePopupGeoJSON(a.layer._markers[feat].feature,tablaInfo);
            } else {
              html += creaTablaPopupGeoJSON(a.layer._markers[feat].feature,tablaInfo);
            }
            if (cont != num-1) {
              html += "<div style='height:5px;'></div>";
            }
            cont++;
          }
          var html1 = document.createElement('html');
          html1.innerHTML = html;
          html1 = modificarPopup(html1, {url:a.layer._markers[feat].feature.urlCapa, titulo:a.layer._markers[feat].feature.tituloCapa, tipo:"GeoJSON"});
          //as we have the content, we should add the popup to the map add the coordinate that is inherent in the cluster:
          var popup = L.popup({
              'maxWidth': '450px',
              'className' : 'bindPopup'
            })
            .setLatLng([a.layer._cLatLng.lat, a.layer._cLatLng.lng])
            .setContent(html1)
            .openOn(map);
        }
      }
    });
  //Si está activo el Spiderfy
  } else {
    markerCluster.on('clusterclick', function(a){
      if (a.target._spiderfied !== null){
        if (capturandoPuntoXY) {
          L.DomEvent.stopPropagation(a);
          eventoClicCapturarXY(a);  //idevAPI_zoomXY.js
        }
      }
    });
  }
}

function IDEVAPI_obtenerDatosElemento(idInternoCapa, callback) {
//window.obtenerDatosElemento = function(idInternoCapa, callback) {
  let capaMapa = IDEVAPI[0].capas.find(x => x.idInterno === idInternoCapa);
  
  if(capaMapa) {
    if (capaMapa.tipo == "GeoJSON") {
      esperarCapasGeoJson().then(() => {
        let capas = obtenerCapasGeoJson();

        capas.forEach(layer => {
          if (layer.idInterno === idInternoCapa) {
            layer.on({
              click: element => {
                callback(element.layer.feature);
              }
            });
          }
        });
      });
    }
  }
}
