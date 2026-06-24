// VARIABLES GLOBALES
let datos = [];
let columnasTabla = [];
let campos = [];
let layer = null;
let layers = [];
let contadorTablas = 0;
let alturaMapa = 0;
let tablaResizeObserver = null;
let tablaAjusteProgramado = false;

function crearTabla(layerInicio,entry){
   entry.className = 'idevapi-span-tabla';

   let iconoTabla = L.DomUtil.create('img', "idevapi-img-tabla");
   iconoTabla.src = prot + urlAPI + "/images/toc_tabla.svg";
   iconoTabla.id = 'iconoTabla' + contadorTablas;
   entry.appendChild(iconoTabla);
   layer = layerInicio;
   layer.layerId = 'layer' + contadorTablas;
   
   layers.push(layer); 

   contadorTablas++;
   
   L.DomEvent.on(iconoTabla, 'click', function(ev) {
      // SETEAMOS LA LAYER A PARTIR DE LA ID DEL ICONO ELEGIDO
      let iconoId = ev.target.id;
      let layerIndex = parseInt(iconoId.replace('iconoTabla', ''));
      layer = layers[layerIndex];
      main();   
   });

   //Se abre o se cierra la tabla desde el inicio
   if (layerInicio.datosTabla.visibleInicio) {
      // Esperar a que DataTables esté disponible (puede haber diferencia de
      // timing entre la carga de jQuery y DataTables en caché fría)
      var _intentosDT = 0;
      var _maxIntentosDT = 50; // máximo 5 segundos
      var _esperarDT = setInterval(function () {
         _intentosDT++;
         if (typeof $.fn.DataTable === 'function' ||
             (typeof jQuery !== 'undefined' && typeof jQuery.fn.DataTable === 'function')) {
            clearInterval(_esperarDT);
            $(iconoTabla).trigger('click');
         } else if (_intentosDT >= _maxIntentosDT) {
            clearInterval(_esperarDT);
            console.warn('idevAPI_tabla: DataTables no disponible tras 5s, tabla no abierta automáticamente.');
         }
      }, 100);
   }
}

async function main (){
   if(!$("#tablaDeDatos").length && !$("#cargandoMapa_" + mapa.id).is(":visible")){
      try {    
         if (layer.datosTabla.campos.length > 0) {
            $("#cargandoMapa_" + mapa.id).show();
            await obtenerDatos();  
            inicializarContenedorTabla(); 
            incializarColumnasTabla();         
            crearDataTable(datos);
            $("#cargandoMapa_" + mapa.id).hide();
         } else {
            $("#cargandoMapa_" + mapa.id).hide();
            alert('No se han definido campos para la tabla');
         }
      } catch (error) {
         $("#cargandoMapa_" + mapa.id).hide();
         console.error('idevAPI_tabla - error en main():', error);
         alert('Ha ocurrido un error: ' + error);
      }
   } else {
      eliminarTabla();
   }
}

async function obtenerDatos() {  
   if (layer.tipoServicio == "WMS") {
       return new Promise((resolve, reject) => {
           $.ajax({
               url: formatearURL(layer.datosTabla.url) || formatearURL(layer.url),
               type: 'GET',
               data: {
                  service: 'WFS',
                  version: '2.0.0',
                  request: 'GetFeature',
                  typeName: layer._name,
                  srsName: 'EPSG:4326',
                  outputFormat: 'application/json; subtype=geojson'
               },
               dataType: 'json',
               success: function(data) {
                  datos = data.features;
                  resolve();
               },
               error: (error) => {
                  reject(new Error('Error al obtener datos de la capa WMS'));
               }
           });
       });
   } else{
      let datosGeoJSON = layer.toGeoJSON();
      datos = datosGeoJSON.features;
      return Promise.resolve(datos);
   }
}

function formatearURL(url){
   let urlSinParametros = new URL(url);
   urlSinParametros.search = "";
   return urlSinParametros.toString();
}

function inicializarContenedorTabla() {
   // CREAMOS CONTENEDOR TABLA
   let divTablaDatos = document.createElement("table");
   divTablaDatos.id = "tablaDeDatos";      
   // NOTE (PAUPER, 2026-03-16): usar mapaId del layer para soportar multi-mapa. Antes: IDEVAPI[0].id
   let idMapa = layer.datosTabla.mapaId || IDEVAPI[0].id;
   let divMapa = $("#" + idMapa);
   divMapa.after(divTablaDatos);
}

function incializarColumnasTabla() {
   columnasTabla = [];
   campos = layer.datosTabla.campos;
   
   for (let campo of campos) {
      let aliasTraduccion = campo.alias;

      if (campo.alias !== undefined) {
         if (IDEVAPI_global.idioma === "es") {
            aliasTraduccion = campo.alias.split(";")[0];
         } else if (IDEVAPI_global.idioma === "va") {
            aliasTraduccion = campo.alias.split(";")[1];
         }
      }
      // SI TIPO CAMPO EXISTE Y ÉS URL, MUESTRA UN "HYPERLINK"
      columnasTabla.push({
         title: aliasTraduccion || campo.campo,
         data: `properties.${campo.campo}`,
         render: function(value, type, row) {
             if (type === 'display' && campo.tipo === "url") {
                 if (typeof value === 'string') {
                     // Select the appropriate valor_url based on the language
                     const urlSegment = campo.valor_url.split(";");
                     const linkText = IDEVAPI_global.idioma === "es" ? urlSegment[1] : urlSegment[0];
                     return `<a href="${value}" target="_blank">${linkText}</a>`;
                  }
               }
             return value && typeof value !== 'object' ? value : ''; // Default rendering for non-URL fields
         }
     });
   }
}

function crearDataTable(datosTabla) {
   // Usar el jQuery que tenga DataTables registrado. En páginas con jQuery
   // externo cargado antes de idevAPI_core.js, window.$ puede apuntar al
   // jQuery externo (sin DataTables), mientras que window.jQuery apunta al
   // jQuery interno que sí tiene DataTables.
   var _jq = (typeof $.fn.DataTable === 'function') ? $ :
             (typeof jQuery !== 'undefined' && typeof jQuery.fn.DataTable === 'function') ? jQuery : $;
   if (typeof _jq.fn.DataTable !== 'function') {
      throw new TypeError('DataTables no está registrado en jQuery. Comprueba que la librería está cargada correctamente.');
   }
   let tablaCapa = _jq('#tablaDeDatos').DataTable({
      data: datosTabla,
      columns: columnasTabla,
      select: 'single',
      scrollY: '120px',
      scrollX: true,
      scrollCollapse: true,
      paging: false,
      responsive: false,
      dom: 'tpir',
      language:{
         url: prot + urlAPI + "/js/dataTables_" + IDEVAPI_global.idioma + ".json",
         select:{
            rows:{
                  0: MENSAJES.sinSeleccion,
                  1: MENSAJES.conSeleccion
               }
            }
      },
      initComplete: function () {
         dataTableInitComplete(tablaCapa);    
         ajustarColumnasOnClick(tablaCapa);    
         ajustarColumnasOnResize(tablaCapa);
      }

   });

   tablaCapa.on('draw.idevapiTabla', function () {
      gestionarScrollHorizontalTabla(tablaCapa);
   });
}

function ajustarColumnasOnClick(tablaCapa){
   // Funció per ajustar columnes al tenir click a la web
   $(document).on('click.ajustaTabla', function() {
      var ajusteTimeout;

      if (ajusteTimeout) {
          clearTimeout(ajusteTimeout);
      }
      ajusteTimeout = setTimeout(function() {
          tablaCapa.columns.adjust();
      }, 500);
  });
}

// Declarar 'handler' en un ámbito accesible para ambas funciones
let handler;

function ajustarTablaHandler(tablaCapa) {
   ajustarAlturaWrapperTabla();
   ajustarAlturaTabla();
   gestionarScrollHorizontalTabla(tablaCapa);
   tablaCapa.columns.adjust();
}

function gestionarScrollHorizontalTabla(tablaCapa) {
   var wrapperEl = document.getElementById('tablaDeDatos_wrapper');
   var bodyEl = document.querySelector('#tablaDeDatos_wrapper .dataTables_scrollBody');
   var tablaBodyEl = document.querySelector('#tablaDeDatos_wrapper .dataTables_scrollBody table');
   var headInnerEl = document.querySelector('#tablaDeDatos_wrapper .dataTables_scrollHeadInner');
   var headTableEl = headInnerEl ? headInnerEl.querySelector('table') : null;

   if (!wrapperEl || !bodyEl) {
      return;
   }

   var aplicarModoAncho = function () {
      var aplicarModoFillWidth = function () {
         wrapperEl.classList.remove('idevapi-tabla-scroll-x');
         wrapperEl.classList.add('idevapi-tabla-fill-width');

         bodyEl.style.setProperty('overflow-x', 'hidden', 'important');
         bodyEl.style.scrollLeft = 0;

         var anchoObjetivo = bodyEl.clientWidth + 'px';
         if (headInnerEl) {
            headInnerEl.style.width = anchoObjetivo;
            headInnerEl.style.minWidth = anchoObjetivo;
         }
         if (headTableEl) {
            headTableEl.style.width = anchoObjetivo;
            headTableEl.style.minWidth = anchoObjetivo;
         }
         if (tablaBodyEl) {
            tablaBodyEl.style.width = anchoObjetivo;
            tablaBodyEl.style.minWidth = anchoObjetivo;
         }
      };

      var aplicarModoScrollX = function () {
         wrapperEl.classList.add('idevapi-tabla-scroll-x');
         wrapperEl.classList.remove('idevapi-tabla-fill-width');

         bodyEl.style.setProperty('overflow-x', 'auto', 'important');

         if (headInnerEl) {
            headInnerEl.style.width = '';
            headInnerEl.style.minWidth = '';
         }
         if (headTableEl) {
            headTableEl.style.width = '';
            headTableEl.style.minWidth = '';
         }
         if (tablaBodyEl) {
            tablaBodyEl.style.width = '';
            tablaBodyEl.style.minWidth = '';
         }
      };

      // Ajuste previo para medir overflow de forma fiable.
      if (tablaCapa && tablaCapa.columns) {
         tablaCapa.columns.adjust();
      }

      // Histéresis para evitar quedarse en modo scroll por residuales de pocos px.
      var UMBRAL_SALIR_SCROLL_PX = 18;
      var UMBRAL_ENTRAR_SCROLL_PX = 34;
      var anchoTabla = tablaBodyEl ? tablaBodyEl.scrollWidth : bodyEl.scrollWidth;
      var overflowPx = Math.max(0, anchoTabla - bodyEl.clientWidth);
      var estabaEnScroll = wrapperEl.classList.contains('idevapi-tabla-scroll-x');
      var debeTenerScroll = estabaEnScroll ? (overflowPx > UMBRAL_SALIR_SCROLL_PX) : (overflowPx > UMBRAL_ENTRAR_SCROLL_PX);

      if (!debeTenerScroll) {
         aplicarModoFillWidth();
      } else {
         aplicarModoScrollX();
      }

      if (tablaCapa && tablaCapa.columns) {
         tablaCapa.columns.adjust();
      }

      // Antirresidual: si tras ajustar solo sobran pocos px, forzar fill y ocultar scroll.
      var RESIDUAL_MAX_PX = 8;
      var overflowFinalPx = Math.max(0, bodyEl.scrollWidth - bodyEl.clientWidth);
      if (wrapperEl.classList.contains('idevapi-tabla-scroll-x') && overflowFinalPx <= RESIDUAL_MAX_PX) {
         aplicarModoFillWidth();
         if (tablaCapa && tablaCapa.columns) {
            tablaCapa.columns.adjust();
         }
      }

      // Bloqueo final: tras los ajustes de DataTables, forzar ocultación del scroll
      // en modo fill-width para evitar residuales de 1-2 px.
      var lockFinalOverflow = function () {
         if (!document.getElementById('tablaDeDatos_wrapper')) {
            return;
         }

         if (!wrapperEl.classList.contains('idevapi-tabla-fill-width')) {
            return;
         }

         bodyEl.style.setProperty('overflow-x', 'hidden', 'important');
         bodyEl.scrollLeft = 0;

         var overflowLockPx = Math.max(0, bodyEl.scrollWidth - bodyEl.clientWidth);

         // Si el residuo es pequeño, mantenemos modo fill sin scroll.
         if (overflowLockPx <= 16) {
            wrapperEl.classList.remove('idevapi-tabla-scroll-x');
            wrapperEl.classList.add('idevapi-tabla-fill-width');
            return;
         }

         // Si realmente no cabe (overflow grande), restaurar modo scroll.
         if (overflowLockPx > 48) {
            aplicarModoScrollX();
            if (tablaCapa && tablaCapa.columns) {
               tablaCapa.columns.adjust();
            }
         }
      };

      if (typeof window.requestAnimationFrame === 'function') {
         window.requestAnimationFrame(function () {
            setTimeout(lockFinalOverflow, 0);
         });
      } else {
         setTimeout(lockFinalOverflow, 0);
      }
   };

   if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(aplicarModoAncho);
   } else {
      setTimeout(aplicarModoAncho, 0);
   }
}

function programarAjusteTabla(tablaCapa) {
   if (tablaAjusteProgramado) {
      return;
   }

   tablaAjusteProgramado = true;
   var ejecutar = function () {
      tablaAjusteProgramado = false;
      if (!document.getElementById('tablaDeDatos_wrapper')) {
         return;
      }

      ajustarTablaHandler(tablaCapa);
   };

   if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(ejecutar);
   } else {
      setTimeout(ejecutar, 0);
   }
}

function activarObservadoresTabla(tablaCapa) {
   var wrapperEl = document.getElementById('tablaDeDatos_wrapper');
   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   var mapEl = document.getElementById(idMapa);
   var contenedorEl = mapEl && mapEl.parentElement ? mapEl.parentElement : null;

   if (typeof ResizeObserver !== 'undefined') {
      if (tablaResizeObserver) {
         tablaResizeObserver.disconnect();
      }

      tablaResizeObserver = new ResizeObserver(function () {
         programarAjusteTabla(tablaCapa);
      });

      if (wrapperEl) {
         tablaResizeObserver.observe(wrapperEl);
      }
      if (mapEl) {
         tablaResizeObserver.observe(mapEl);
      }
      if (contenedorEl) {
         tablaResizeObserver.observe(contenedorEl);
      }
   }
}

// Crear la versión debounced de la función
//const debouncedResizeHandler = debounce(ajustarTablaHandler, 200);

function ajustarColumnasOnResize(tablaCapa){
   // Añade el manejador de eventos para redimensionar la ventana usando debounce
   handler = function() {
      ajustarTablaHandler(tablaCapa);
   };
   window.addEventListener("resize", handler);
}

function dataTableInitComplete(datatable) {
   crearfiltroGlobal();
   crearfiltroPorCampo(datatable);
   crearBotones(datatable);
   resizeMapa();
   activarObservadoresTabla(datatable);
   programarAjusteTabla(datatable);
   funcionalidadZoomAElemento(datatable);
}

function crearfiltroGlobal() {
   if(!layer.datosTabla.filtroGlobal)
      $('.dataTables_filter').hide();
}

function crearfiltroPorCampo(datatable) {
   if(layer.datosTabla.filtros && window.innerWidth > 768){
      let filtros = layer.datosTabla.filtros;
      $('<tr id="filtrosPersonalizados">').appendTo('.dataTables_scrollHead thead');
      let th;
      
      let i = 0;
      datatable.columns().every(function () {
         let columna = this;
         let title = columna.header().textContent;
         let campo = campos[i].campo;
     
         if (filtros.includes(campo)) {
             th = $('<th><input type="text" placeholder="Buscar ' + title + '" /></th>').appendTo('.dataTables_scrollHead thead tr:last');
     
             $('input', th).on('keyup change clear', function () {
                 if (columna.search() !== this.value) {
                     columna
                         .search(this.value)
                         .draw();
                 }
             });
         }
         else {
             th = $('<th></th>').appendTo('.dataTables_scrollHead thead tr:last');
         }
         i++;
     });

     // Reajustamos columnas si se han añadido filtros
     datatable.columns.adjust().draw();
   }
}

function normalizeGeoJSON(data) {
   // Convert the GeoJSON data to a UTF-8 string
   let jsonString = JSON.stringify(data);
   let utf8String = new TextDecoder('utf-8').decode(new TextEncoder().encode(jsonString));
   return JSON.parse(utf8String);
}

function createCSVFromDatatable(data) {
   data = normalizeGeoJSON(data); // Normaliza el GeoJSON

   let exportFields = layer.datosTabla.exportarCampos;
   let headerGeometry = Object.keys(data[0].geometry);
   let headerProperties = exportFields || Object.keys(data[0].properties); // Si exportarCampos es null, exporta todo

   // Agrega el BOM al inicio para que Excel reconozca correctamente UTF-8
   let csv = "\uFEFF";

   // Encabezados CSV
   let csvHeaders = headerProperties.join(';') + ';tipo_geometria;latitud;longitud\n';
   csv += csvHeaders;

   // Filas CSV
   for (let i = 0; i < data.length; i++) {
      const row = [];
      for (const property of headerProperties) {
         let value = data[i].properties[property];
         if (typeof value === 'string') {
            value = value.normalize('NFC'); // Normaliza la cadena
            value = value.replace(/"/g, '""'); // Escapa comillas dobles
            if (value.includes(';') || value.includes('\n')) {
               value = `"${value}"`; // Encierra en comillas dobles si es necesario
            }
         }
         row.push(value);
      }
      // Agrega tipo de geometría y coordenadas cuando sea posible.
      // En WMS hay capas con geometrías no puntuales (p.ej. MultiPolygon).
      let geometry = data[i].geometry || {};
      let geometryType = geometry.type || '';
      let latitud = '';
      let longitud = '';

      if (geometryType === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
         if (typeof geometry.coordinates[1] === 'number') {
            latitud = geometry.coordinates[1].toString().replace('.', ',');
         }
         if (typeof geometry.coordinates[0] === 'number') {
            longitud = geometry.coordinates[0].toString().replace('.', ',');
         }
      }

      row.push(geometryType);
      row.push(latitud);
      row.push(longitud);

      csv += row.join(';') + '\n';
   }

   let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
   return blob;
}

function createGeoJSONFromDatatable(data) {
   //let exportFields = layer.filtro.exportarCampos;
   let exportFields = layer.datosTabla.exportarCampos;

   let features = [];
   for (const element of data) {
       let filteredProperties = {};
       
       // If exportarCampos is specified, filter properties to include only those fields in
       if (exportFields && exportFields.length > 0) {
           for (const key of exportFields) {
               filteredProperties[key] = element.properties[key];
           }
       } else {
           // If exportarCampos is null, include all properties
           filteredProperties = element.properties;
       }

       features.push({
           type: 'Feature',
           geometry: element.geometry,
           properties: filteredProperties
       });
   }

   let geojson = {
      type: 'FeatureCollection',
      features: features
   };
   let blob = new Blob([JSON.stringify(geojson)], {type: 'application/json'});
   return blob;
}

function crearBotones(datatable) {
   // DIV CABECERA
   $('#tablaDeDatos_wrapper').addClass('idevapi-root');
   $('#tablaDeDatos_wrapper').prepend('<div id="divTablaCabecera"></div>');
   
   // BOTON EXPORTAR A CSV
   if(layer.datosTabla.exportarCSV){
      let botonExportarCSV = $('<button id="botonExportarCSV" class="idevapi-botones-tabla">'+ datatable.i18n('botonExportarCSV') +'</button>');
      $('#divTablaCabecera').prepend(botonExportarCSV);

      $('#botonExportarCSV').on('click', function() {
         let data = datatable.rows({ filter: 'applied' }).data().toArray();
         let blob = createCSVFromDatatable(data);
         let url = URL.createObjectURL(blob);
         let a = document.createElement('a');
         a.href = url;
         a.download = 'export.csv';
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
      });
   }

   // BOTON EXPORTAR A GEOJSON
   if(layer.datosTabla.exportarGeoJSON){
      let botonExportarGeoJSON = $('<button id="botonExportarGeoJSON" class="idevapi-botones-tabla">'+ datatable.i18n('botonExportarGeoJSON') +'</button>');
      $('#divTablaCabecera').prepend(botonExportarGeoJSON);
   
      $('#botonExportarGeoJSON').on('click', function() {
         let data = datatable.rows({ filter: 'applied' }).data().toArray();
         let blob = createGeoJSONFromDatatable(data);
         let url = URL.createObjectURL(blob);
         let a = document.createElement('a');
         a.href = url;
         a.download = 'export.geojson';
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
      });
   }
   

   // BOTONES ZOOM ELEMENTOS FILTRADOS
   let botonZoomElementos = $('<button id="botonZoomElementos" class="idevapi-botones-tabla">' + datatable.i18n('botonZoomElementos') + '</button>');
   $('#divTablaCabecera').prepend(botonZoomElementos);

   $('#botonZoomElementos').on('click', function() {                   
      let data = datatable.rows({ filter: 'applied' }).data().toArray();
      let bounds = new L.LatLngBounds();
      for (const element of data) {
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
         layer._map.invalidateSize();
         map.fitBounds(bounds);
      }
      else{
         alert('No hi ha elements filtrats o no tenen coordenades');
      }                     
   });

   // BOTON LIMPIAR FILTROS
   if(layer.datosTabla.filtros || layer.datosTabla.filtroGlobal){
      let botonLimpiarFiltros = $('<button id="botonLimpiarFiltros" class="idevapi-botones-tabla">' + datatable.i18n('botonLimpiarFiltros') + '</button>');
      $('#divTablaCabecera').prepend(botonLimpiarFiltros);

      $('#botonLimpiarFiltros').on('click', function() {                   
         $('#filtrosPersonalizados th').each(function() {
            $('input', this).val('');
         });
                  
         datatable.columns().every(function() {
            this.search('');
         });

         datatable.search('').draw(); 
         
      });
   }

   // BOTON CERRAR TABLA
   let closeButton = $('<button id="cerrarTablaButton">&times;</button>');
   $('#divTablaCabecera').prepend(closeButton);

   closeButton.on('click', function() {    
      eliminarTabla();    
   }); 
}

function eliminarTabla(){
   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   $('.leaflet-bottom').css('margin-bottom', '0px');
   $("#tablaDeDatos").remove();
   
   $("#tablaDeDatos_wrapper").remove();
   $('#' + idMapa).css('height', '100%');
   $('.ui-resizable-handle').remove();
   layer._map.invalidateSize();
   $('#divMinimizar').remove();
   $(document).off('click.ajustaTabla');
   $(document).off('mousedown.resizeHandle');
   $(document).off('mouseup.resizeHandle');

   if (tablaResizeObserver) {
      tablaResizeObserver.disconnect();
      tablaResizeObserver = null;
   }

   window.removeEventListener("resize", handler);
   //$(window).off('resize.ajustaTabla');
   //$(window).off();
}

function resizeMapa() {
   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   $('#' + idMapa).css('height', '60%');
   $("#" + idMapa).resizable({
      handles: 's',
      stop: function(event, ui) {
         event.stopPropagation();
         event.preventDefault();
         layer._map.dragging.enable(); 
         
         // Si la tabla está minimizada, resetear su altura para evitar inconsistencias visuales
         if ($("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada')) {
            $("#tablaDeDatos_wrapper").css('height', '');
         } else {
            stopResize();
         }
      },
      resize: function(event, ui) {
         // No hacer nada si la tabla está minimizada
         if ($("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada')) {
            return;
         }
         layer._map.dragging.disable();        
      }
   });
   
   // Prevenir que eventos del handle burbujeen al mapa
   $(document).on('mousedown.resizeHandle', '.ui-resizable-handle', function(event) {
      event.stopPropagation();
   });
   $(document).on('mouseup.resizeHandle', '.ui-resizable-handle', function(event) {
      event.stopPropagation();
   });  
   ajustarAlturaWrapperTabla();
   resizeInicial();
}

function ajustarAlturaWrapperTabla() {
   // No ajustar si la tabla está minimizada
   if ($("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada')) {
      return;
   }

   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   var mapEl = document.getElementById(idMapa);
   var wrapperEl = document.getElementById('tablaDeDatos_wrapper');

   if (!mapEl || !wrapperEl || !mapEl.parentElement) {
      return;
   }

   var parentHeight = mapEl.parentElement.clientHeight;
   var mapHeight = mapEl.offsetHeight;

   if (!parentHeight || parentHeight <= 0) {
      return;
   }

   var wrapperHeight = parentHeight - mapHeight;
   if (wrapperHeight < 90) {
      wrapperHeight = 90;
   }

   wrapperEl.style.height = wrapperHeight + 'px';
}

function stopResize(){
   // No ajustar si la tabla está minimizada
   if ($("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada')) {
      return;
   }

   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   ajustarAlturaWrapperTabla();
   ajustarAlturaTabla();
   
   // En caso de que la tabla sea muy pequeña
   if($('#tablaDeDatos_wrapper').height() < 100){
      $('#' + idMapa).css('height', '40%');
      ajustarAlturaWrapperTabla();
      ajustarAlturaTabla();
   }
}

function ajustarAlturaTabla() {
   // No ajustar si la tabla está minimizada
   if ($("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada')) {
      return;
   }

   var alturaVisualizable = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

   var alturaPagina = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
   );

   var alturaElemento = document.getElementById(mapa.id).offsetHeight;
   var wrapperEl = document.getElementById('tablaDeDatos_wrapper');
   var infoEl = document.getElementById('tablaDeDatos_info');
   var botonesEl = document.getElementById('divTablaCabecera');
   var headEl = document.querySelector('.dataTables_scrollHead');

   var alturaInfo = infoEl ? infoEl.offsetHeight : 0;
   var botonesHeight = botonesEl ? botonesEl.offsetHeight : 0;
   var headHeight = headEl ? headEl.offsetHeight : 0;

   var scrollContainers = document.getElementsByClassName('dataTables_scroll');
   if (!scrollContainers || scrollContainers.length === 0) {
      layer._map.invalidateSize();
      return;
   }

   var scrollContainer = scrollContainers[0];

   // Espacio total disponible para el wrapper cuando no hay altura explícita.
   var alturaTotalVisible = Math.max(alturaVisualizable, alturaPagina) - alturaElemento;

   // Preferimos la altura real del wrapper para soportar bien el resize manual.
   var wrapperHeight = wrapperEl && wrapperEl.clientHeight ? wrapperEl.clientHeight : alturaTotalVisible;

   // Reservar en el wrapper el espacio de cabecera de botones y pie de info.
   var RESERVED_GAP = 0;
   var scrollHeight = wrapperHeight - botonesHeight - alturaInfo - RESERVED_GAP;
   if (scrollHeight < 60) {
      scrollHeight = 60;
   }
   scrollContainer.style.height = scrollHeight + 'px';

   // La altura del body es la del scroll menos el thead fijo de DataTables.
   var bodyHeight = scrollHeight - headHeight;
   if (bodyHeight < 50) bodyHeight = 50; // minimum

   var bodyEl = document.getElementsByClassName('dataTables_scrollBody')[0];
   if (bodyEl) {
      bodyEl.style.height = bodyHeight + 'px';
      bodyEl.style.maxHeight = '';
   }

   // Let DataTables recalculate column widths after the height change
   // Solo si la tabla es visible (no minimizada)
   try {
      var wrapperEl = document.getElementById('tablaDeDatos_wrapper');
      if (wrapperEl && wrapperEl.style.display !== 'none' && typeof $ !== 'undefined' && $.fn && $.fn.DataTable && $('#tablaDeDatos').length) {
         var dt = $('#tablaDeDatos').DataTable();
         if (dt && dt.columns) dt.columns.adjust();
      }
   } catch (e) {
      console.warn('ajustarAlturaTabla: could not adjust DataTable columns', e);
   }

   layer._map.invalidateSize();

}

function resizeInicial() {
   ajustarAlturaWrapperTabla();
   ajustarAlturaTabla(); 
   $('.leaflet-bottom').css('margin-bottom', '10px');
   crearBotonMinimizar();
}

function crearBotonMinimizar(){
   // Crea un div y metelo dentro del mapa
   var idMapa = (layer && layer.datosTabla && layer.datosTabla.mapaId) ? layer.datosTabla.mapaId : IDEVAPI[0].id;
   
   // Remover si ya existe (prevenir duplicates)
   $('#divMinimizar').off('click.minimizar').remove();
   
   // Guardar la altura inicial del mapa (para poder restaurar)
   alturaMapa = $("#" + idMapa).height();
   
   let divMinimizar = document.createElement("div");
   divMinimizar.id = 'divMinimizar'; 
   let divMapa = $("#" + idMapa);
   divMapa.append(divMinimizar);

   // SVG inline con flecha hacia abajo (minimizar)
   let svgMinimizar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svgMinimizar.setAttribute('viewBox', '0 0 24 24');
   svgMinimizar.setAttribute('width', '24');
   svgMinimizar.setAttribute('height', '24');
   svgMinimizar.setAttribute('fill', 'white');
   svgMinimizar.setAttribute('style', 'display: block; margin: 0 auto;');
   svgMinimizar.id = 'svgMinimizar';
   
   let pathMinimizar = document.createElementNS("http://www.w3.org/2000/svg", "path");
   pathMinimizar.setAttribute('d', 'M4 8 L12 16 L20 8 Z');
   svgMinimizar.appendChild(pathMinimizar);
   
   divMinimizar.appendChild(svgMinimizar);

   $("#divMinimizar").on("click.minimizar", function(event) {
      event.stopPropagation();
      event.preventDefault();
      var isMinimized = $("#tablaDeDatos_wrapper").hasClass('idevapi-tabla-minimizada');
      console.log('divMinimizar clicked, isMinimized:', isMinimized, 'alturaMapa:', alturaMapa);
      
      // Maximizar (restaurar)
      if (isMinimized) {
         console.log('Maximizando a altura:', alturaMapa);
         $("#tablaDeDatos_wrapper").removeClass('idevapi-tabla-minimizada');
         $("#tablaDeDatos_wrapper").css('display', 'block').css('height', 'auto');
         $("#" + idMapa).height(alturaMapa + 'px');
         ajustarAlturaWrapperTabla();
         ajustarAlturaTabla();
         // Cambiar a flecha hacia abajo (minimizar)
         $("#svgMinimizar path").attr('d', 'M4 8 L12 16 L20 8 Z');
         $(".leaflet-bottom").css('margin-bottom', '10px');
         layer._map.invalidateSize();
         // Reactivar resize
         $("#" + idMapa).resizable("enable");
         // Resetear posición del botón
         $("#divMinimizar").css('bottom', '-20px');
      } 
      // Minimizar
      else {
         console.log('Minimizando, guardando altura:', $("#" + idMapa).height());
         alturaMapa = $("#" + idMapa).height();
         $("#tablaDeDatos_wrapper").addClass('idevapi-tabla-minimizada');
         $("#tablaDeDatos_wrapper").css('display', 'none');
         $("#" + idMapa).css('height', '100%');
         // Desactivar resize
         $("#" + idMapa).resizable("disable");
         // Cambiar a flecha hacia arriba (maximizar)
         $("#svgMinimizar path").attr('d', 'M4 16 L12 8 L20 16 Z');
         $(".leaflet-bottom").css('margin-bottom', '0px');
         layer._map.invalidateSize();
         // Desplazar botón hacia abajo (eje Y)
         $("#divMinimizar").css('bottom', '-24px');
      }
   });
}

function funcionalidadZoomAElemento(datatable) {
   $('#tablaDeDatos tbody').on('click', 'tr', function () {
      let datosElemento = datatable.row(this).data();

      if (datosElemento.geometry) {
         if (datosElemento.geometry.type === "Point" || datosElemento.geometry.type === "MultiPoint") {
            let coordenadas = datosElemento.geometry.coordinates;
            if (datosElemento.geometry.type === "MultiPoint") {
               coordenadas = datosElemento.geometry.coordinates[0];
            }
            layer._map.invalidateSize();
            layer._map.setView([coordenadas[1], coordenadas[0]], 15);             
         } else if (datosElemento.geometry.type === "MultiPolygon") {
            let geojsonLayer = L.geoJSON(datosElemento.geometry);
            layer._map.fitBounds(geojsonLayer.getBounds());
            layer._map.invalidateSize();                    
         } 
      } 
   }); 
}

async function actualizarDatosTabla(){
   if (!$('#tablaDeDatos').length) { return; }
   datos = await obtenerDatos();
   var _jqAct = (typeof $.fn.DataTable === 'function') ? $ :
                (typeof jQuery !== 'undefined' && typeof jQuery.fn.DataTable === 'function') ? jQuery : $;
   let tablaCapa = _jqAct('#tablaDeDatos').DataTable();
   tablaCapa.clear(); 
   tablaCapa.rows.add(datos); 
   tablaCapa.draw(); 
}
