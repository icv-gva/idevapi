// VARIABLES GLOBALES
let datos = [];
let columnasTabla = [];
let campos = [];
let layer = null;
let layers = [];
let contadorTablas = 0;
let alturaMapa = 0;

function crearTabla(layerInicio,entry){
   entry.className = 'spanTabla';

   let iconoTabla = L.DomUtil.create('img', "imgTabla");
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
      setTimeout(function () {
         $(iconoTabla).trigger("click");
      }, 200);
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
         alert('Ha ocurrido un error:', error);
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
   let idMapa = IDEVAPI[0].id;
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
   let tablaCapa = $('#tablaDeDatos').DataTable({
      data: datosTabla,
      columns: columnasTabla,
      select: 'single',
      scrollY: '120px',
      scrollCollapse: true,
      paging: false,
      responsive: true,
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
   ajustarAlturaTabla();
   tablaCapa.columns.adjust();
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
      // Agrega tipo de geometría, latitud y longitud
      row.push(data[i].geometry.type);
      let latitud = data[i].geometry.coordinates[1].toString().replace('.', ','); // Reemplaza punto por coma
      let longitud = data[i].geometry.coordinates[0].toString().replace('.', ','); // Reemplaza punto por coma
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
   $('#tablaDeDatos_wrapper').prepend('<div id="divTablaCabecera"></div>');
   
   // BOTON EXPORTAR A CSV
   if(layer.datosTabla.exportarCSV){
      let botonExportarCSV = $('<button id="botonExportarCSV" class="botonesTabla">'+ datatable.i18n('botonExportarCSV') +'</button>');
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
      let botonExportarGeoJSON = $('<button id="botonExportarGeoJSON" class="botonesTabla">'+ datatable.i18n('botonExportarGeoJSON') +'</button>');
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
   let botonZoomElementos = $('<button id="botonZoomElementos" class="botonesTabla">' + datatable.i18n('botonZoomElementos') + '</button>');
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
      let botonLimpiarFiltros = $('<button id="botonLimpiarFiltros" class="botonesTabla">' + datatable.i18n('botonLimpiarFiltros') + '</button>');
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
   $('.leaflet-bottom').css('margin-bottom', '0px');
   $("#tablaDeDatos").remove();
   
   $("#tablaDeDatos_wrapper").remove();
   $('#' + IDEVAPI[0].id).css('height', '100%');
   $('.ui-resizable-handle').remove();
   layer._map.invalidateSize();
   $('#divMinimizar').remove();
   $(document).off('click.ajustaTabla');

   window.removeEventListener("resize", handler);
   //$(window).off('resize.ajustaTabla');
   //$(window).off();
}

function resizeMapa() {
   $('#' + IDEVAPI[0].id).css('height', '60%');
   $("#" + IDEVAPI[0].id).resizable({
      handles: 's',
      stop: function() {
         layer._map.dragging.enable(); 
         stopResize();
      },
      resize: function(event, ui) {
         layer._map.dragging.disable();        
      }
   });  
   resizeInicial();
}

function stopResize(){
   ajustarAlturaTabla();
   
   // En caso de que la tabla sea muy pequeña
   if($('#tablaDeDatos_wrapper').height() < 200){
      $('#' + IDEVAPI[0].id).css('height', '40%');
      let parentHeight = $('#tablaDeDatos_wrapper').parent().height(); 
      let siblingHeight = $("#" + IDEVAPI[0].id).height(); 

      let newHeight = parentHeight - siblingHeight; 

      let margenNegativo = 160;
      $('#tablaDeDatos_wrapper').css('height', newHeight + 'px'); 
      $('.dataTables_scrollBody').css('height', newHeight - margenNegativo + 'px'); 
      $('.dataTables_scrollBody').css('max-height', ''); 
   }
}

function ajustarAlturaTabla() {
   
   var alturaVisualizable = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

   var alturaPagina = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
   );

   var alturaElemento = document.getElementById(mapa.id).offsetHeight;
   var alturaInfo = document.getElementById('tablaDeDatos_info').offsetHeight * 2;
   var alturaTotalVisible = Math.max(alturaVisualizable, alturaPagina) - alturaElemento - alturaInfo;

   document.getElementsByClassName('dataTables_scroll')[0].style.height = alturaTotalVisible + 'px';

   layer._map.invalidateSize();
   

}

function resizeInicial() {
   ajustarAlturaTabla(); 
   $('.leaflet-bottom').css('margin-bottom', '10px');
   crearBotonMinimizar();
}

function crearBotonMinimizar(){
   // Crea un div y metelo dentro del mapa
   let divMinimizar = document.createElement("div");
   divMinimizar.id = 'divMinimizar'; 
   let divMapa = $("#" + IDEVAPI[0].id);
   divMapa.append(divMinimizar);

   let divIconoMinimizar = document.createElement("div");
   divIconoMinimizar.id = 'divIconoMinimizar'; 
   divMinimizar.append(divIconoMinimizar);

   // Icono de minimizar
   let svgMinimizar = document.createElement("img");
   svgMinimizar.id = 'svgMinimizar'; 
   svgMinimizar.src = prot + urlAPI + "/images/minimizar.svg";
   divIconoMinimizar.append(svgMinimizar);

   $("#divMinimizar").on("click", function() {
      
      if ($("#tablaDeDatos_wrapper").height() == 0) {
         $("#tablaDeDatos_wrapper").height('100%');
         $("#" + IDEVAPI[0].id).height(alturaMapa + 'px');
         svgMinimizar.src = prot + urlAPI + "/images/minimizar.svg";     
      } else {
         svgMinimizar.src = prot + urlAPI + "/images/maximizar.svg";
         alturaMapa = $("#" + IDEVAPI[0].id).height();
         $("#tablaDeDatos_wrapper").height('0px');
         $("#" + IDEVAPI[0].id).height('100%');
         layer._map.invalidateSize();
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
   datos = await obtenerDatos();
   let tablaCapa = $('#tablaDeDatos').DataTable();
   tablaCapa.clear(); 
   tablaCapa.rows.add(datos); 
   tablaCapa.draw(); 
}
