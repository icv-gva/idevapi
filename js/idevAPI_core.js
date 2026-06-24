// ******************************* CONSTRUIR LA URL A LA API ********************************************
// ********** HTTP o HTTPS *********************
var prot = location.protocol;
// Si cargamos el archivo en local ponemos el protocolo a http
if ((prot !== "http:") && (prot !== "https:")) { prot = "http:"; };

// ********** URL DOMINIO *********************
//Recoje la URL donde se encuentra el script idevAPI_core.js
var scripts = document.getElementsByTagName("script");
var srcCore;
for (var i = 0; i < scripts.length; i++) {
	if (scripts[i].src.indexOf("js/idevAPI_core") !== -1) {
		srcCore = scripts[i].src;
		break;
	}
}

// ---- Entry point: jsdelivr -> GVA -> local -> safe-degradation fallback ----
function detectLoadFamily(srcCore) {
	var family;
	family = resolveJsdelivr(srcCore); if (family) return family;
	family = resolveGVA(srcCore);      if (family) return family;
	family = resolveLocal(srcCore);    if (family) return family;
	return { urlAPI: "../../idevapi", URLVersion: "" };
}

// jsdelivr: tag-agnostic. Matches @1.3.19, @1.3.20, @1.3.21, @1.3, @1, @latest.
function resolveJsdelivr(srcCore) {
	var m = srcCore.match(/(https?:)?(\/\/cdn.jsdelivr.net\/gh\/[^/]+\/[^/]+@[^/]+)/);
	if (m) return { urlAPI: m[2], URLVersion: "" };
	return null;
}

// GVA: 6 sub-environments, grouped legacy-path-first then modern-hostname-first.
function resolveGVA(srcCore) {
	if (srcCore.indexOf("idevapi.gva.es/desa/") !== -1)  return { urlAPI: "//idevapi.gva.es/desa",  URLVersion: "/1.3" };
	if (srcCore.indexOf("idevapi.gva.es/pre/")  !== -1)  return { urlAPI: "//idevapi.gva.es/pre",   URLVersion: "/1.3" };
	if (srcCore.indexOf("idevapi.gva.es/api/")  !== -1)  return { urlAPI: "//idevapi.gva.es/api",   URLVersion: "/1.3" };
	if (srcCore.indexOf("geoidevapi-dsa.gva.es") !== -1) return { urlAPI: "//geoidevapi-dsa.gva.es", URLVersion: "/1.3" };
	if (srcCore.indexOf("geoidevapi-pre.gva.es") !== -1) return { urlAPI: "//geoidevapi-pre.gva.es", URLVersion: "/1.3" };
	if (srcCore.indexOf("geoidevapi.gva.es")    !== -1)  return { urlAPI: "//geoidevapi.gva.es",    URLVersion: "/1.3" };
	return null;
}

// Local (pattern beta): conservative — only the literal "idevapi/js/idevAPI_core" shape.
function resolveLocal(srcCore) {
	var m = srcCore.match(/^(.*\/)idevapi\/js\/idevAPI_core/);
	if (m) return { urlAPI: "../../idevapi", URLVersion: "" };
	return null;
}

var family = detectLoadFamily(srcCore);
var urlAPI = family.urlAPI;
var URLVersion = family.URLVersion;

// ********** URL DEFINITIVA *********************
urlAPI += URLVersion;

// ******************************* CÓDIGO MINIMIZADO o NO ********************************************
//Carga el código minimizado o no, dependiendo de si se carga "idevAPI_core-min.js" o "idevAPI_core.js"
function getScriptName() {
	var error = new Error()
		, source
		, lastStackFrameRegex = new RegExp(/.+\/(.*?):\d+(:\d+)*$/)
		, currentStackFrameRegex = new RegExp(/getScriptName \(.+\/(.*):\d+:\d+\)/);

	if ((source = lastStackFrameRegex.exec(error.stack.trim())) && source[1] != "")
		return source[1];
	else if ((source = currentStackFrameRegex.exec(error.stack.trim())))
		return source[1];
	else if (error.fileName != undefined)
		return error.fileName;
}
//Por defecto sufijo -min para cargar librerías, a no ser que idevAPI_core.js no tenga sufijo "-min"
var sufMin = "-min";
if (getScriptName().indexOf("-min.js") == -1) { sufMin = ""; }
// ************************************* VERSIONES LIBRERÍAS *********************************************
var llDir = "lf_194"; //Directorio librerías leaflet
var IDEVAPIVersion = "1.3.21";	//Versión menor para evitar caché en el cliente en nuevas versiones

////////////////////// VARIABLES GLOBALES POR DEFECTO /////////////////////////////////////////////////////////////////////
var capaConsulta = null;
var map;
var MapaBase = {};
var mapas_id = [];
var popupInfoWMS;
var controlGetFeatureInfo = {};
controlGetFeatureInfo.numCapasInfo = 0;
controlGetFeatureInfo.numCapasInfoRes = 0;
controlGetFeatureInfo.infos = [];
//controlGetFeatureInfo.zindex =[];

//****************************************** CARGA SÍNCRONA DE ESTILOS Y LIBRERÍAS JAVASCRIPT NECESARIAS ************************************************************************
// Cargar jQuery dinámicamente
//document.writeln(`<script src='` + prot + urlAPI + `/jq_3.6.0/jquery-3.6.0.min.js'><\/script>`);
// Añadir etiqueta <meta> Adapta la escala para pantallas de mobiles y tablets//
var meta = document.createElement('meta');
meta.name = "viewport";
meta.content = "width=device-width, initial-scale=1.0,maximum-scale=1.0,user-scalable=no";
document.getElementsByTagName("head")[0].appendChild(meta);

var IDEVAPI, IDEVAPI_global;
var allLibrariesLoaded = false;
var allAPIExecuted = false; // Guarda para evitar la doble inicialización del mapa

function loadScript(url) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = url;
		script.onload = () => {
			//console.log(`Script loaded: ${url}`);
			resolve();
		};
		script.onerror = () => reject(new Error(`Script load error: ${url}`));
		document.head.appendChild(script);
	});
}

function loadCSS(url) {
	return new Promise((resolve, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = url;
		link.onload = () => {
			//console.log(`CSS loaded: ${url}`);
			resolve();
		};
		link.onerror = () => reject(new Error(`CSS load error: ${url}`));
		document.head.appendChild(link);
	});
}

// Detecta qué funcionalidades necesita la configuración del usuario
function detectFeatures() {
	var feat = { timeDimension: false, dataTables: false, print: false, measure: false };
	if (!window.IDEVAPI || !Array.isArray(window.IDEVAPI)) { return feat; }
	for (var p = 0; p < IDEVAPI.length; p++) {
		if (IDEVAPI[p].controlTiempo && IDEVAPI[p].controlTiempo.activo === true) { feat.timeDimension = true; }
		if (IDEVAPI[p].controlImpresion) { feat.print = true; }
		if (IDEVAPI[p].controlMedicion) { feat.measure = true; }
		if (IDEVAPI[p].capas) {
			for (var i = 0; i < IDEVAPI[p].capas.length; i++) {
				if (IDEVAPI[p].capas[i].tabla) { feat.dataTables = true; }
			}
		}
	}
	return feat;
}

async function loadLibraries() {
	var base = `${prot}${urlAPI}`;
	var v = `?v=${IDEVAPIVersion}`;

	// Fase A: jQuery primero (Select2, DataTables y jQuery UI dependen de él)
	await loadScript(`${base}/lib/jq_3.7.1/jquery-3.7.1-min.js`);

	// Esperar a que IDEVAPI esté definido en window. Cuando jQuery está en caché,
	// su onload puede resolverse como microtask antes de que el parser HTML procese
	// el <script> inline donde el usuario define IDEVAPI (race condition con detectFeatures).
	if (!window.IDEVAPI || !Array.isArray(window.IDEVAPI)) {
		await new Promise(function (resolve) {
			var _checkIdevapi = setInterval(function () {
				if (window.IDEVAPI && Array.isArray(window.IDEVAPI)) {
					clearInterval(_checkIdevapi);
					resolve();
				}
			}, 10);
			setTimeout(function () { clearInterval(_checkIdevapi); resolve(); }, 2000);
		});
	}

	// Detectar funcionalidades necesarias
	var feat = detectFeatures();

	// Fase B: leaflet.js en solitario — todos los plugins de Leaflet dependen de L
	await loadScript(`${base}/${llDir}/leaflet.js`);

	// Fase C: leaflet.markercluster + todo lo independiente de markercluster, en paralelo
	// layersupport.js (Fase D) usa L.MarkerClusterGroup, que lo define markercluster
	await Promise.all([
		// ── leaflet.markercluster (necesita L de Fase B) ──
		loadScript(`${base}/${llDir}/plugins/markerCluster/leaflet.markercluster.js`),
		// ── CSS ──
		loadCSS(`${base}/css/idevAPI_estilos${sufMin}.css${v}`),
		loadCSS(`${base}/lib/select2_4.1.0/select2.min.css`),
		// ── Vendor core (independientes de L y de markercluster) ──
		loadScript(`${base}/lib/proj4js-2.15.0/proj4.js`),
		loadScript(`${base}/lib/select2_4.1.0/select2.min.js`),
		loadScript(`${base}/lib/jq-ui-1.12.1/jquery-ui.min.js`),
		loadScript(`${base}/lib/jq-ui-1.12.1/jquery.ui.touch-punch.min.js`),
		loadScript(`${base}/lib/turf_6.5.0/turf.min.js`),
		// ── Patches ──
		loadScript(`${base}/js/patches/iso8601-parser${sufMin}.js${v}`),
		loadScript(`${base}/js/patches/ajax-adapter${sufMin}.js${v}`),
		// ── Módulos IDEVAPI (no usan L ni markercluster en su ejecución inmediata) ──
		loadScript(`${base}/js/idevAPI_config.js${v}`),
		loadScript(`${base}/js/idevAPI_general${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_capas_GeoJSON${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_consulta${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_filtro${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_leyenda${sufMin}.js${v}`)
	]);

	// Fase D: plugins que necesitan L + L.MarkerClusterGroup, i18n Select2, módulos IDEVAPI con L, esri-leaflet
	var promisesD = [
		// ── Select2 i18n (necesita Select2 de Fase C) ──
		loadScript(`${base}/lib/select2_4.1.0/i18n/es.js`),
		loadScript(`${base}/lib/select2_4.1.0/i18n/ca.js`),
		// ── Plugins Leaflet (necesitan L; layersupport también necesita L.MarkerClusterGroup de Fase C) ──
		loadScript(`${base}/${llDir}/plugins/leaflet.wms${sufMin}.js${v}`),
		loadScript(`${base}/${llDir}/plugins/layersupport.js`),
		loadScript(`${base}/${llDir}/plugins/proj4leaflet.js`),
		loadScript(`${base}/${llDir}/plugins/layersTree/L.Control.Layers.TreeRadio.js`),
		loadScript(`${base}/${llDir}/plugins/layersTree/L.Control.Layers.Tree.js`),
		loadScript(`${base}/${llDir}/plugins/controlOpacity/L.Control.Opacity.js`),
		loadScript(`${base}/${llDir}/plugins/widgetsPersonalizados/L.Control.Leyenda.js`),
		loadScript(`${base}/${llDir}/plugins/widgetsPersonalizados/L.Control.Consulta.js`),
		loadScript(`${base}/${llDir}/plugins/gestureHandling/leaflet-gesture-handling.min.js`),
		loadScript(`${base}/${llDir}/plugins/locatePosition/L.Control.Locate.js`),
		loadScript(`${base}/${llDir}/plugins/syncMaps/L.Map.Sync.js`),
		// ── ESRI Leaflet base (esri-leaflet-vector depende de éste, va en Fase E) ──
		loadScript(`${base}/${llDir}/plugins/esri-leaflet-vector/esri-leaflet${sufMin}.js`),
		// ── Módulos IDEVAPI que usan L ──
		loadScript(`${base}/js/idevAPI_idioma${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_popup${sufMin}.js${v}`),
		loadScript(`${base}/js/idevAPI_tabla${sufMin}.js${v}`),
		// ── Widgets ──
		loadScript(`${base}/wg/idevAPI_widgets${sufMin}.js${v}`),
		loadScript(`${base}/wg/idevAPI_zoomXY${sufMin}.js${v}`)
	];

	// ── Grupos condicionales Fase D ──
	if (feat.dataTables) {
		promisesD.push(loadScript(`${base}/lib/dataTables_1.10.21/datatables${sufMin}.js`));
	}
	if (feat.print) {
		promisesD.push(
			loadScript(`${base}/${llDir}/plugins/leafletPrint/leaflet.browser.print.js`),
			loadScript(`${base}/${llDir}/plugins/leafletPrint/leaflet.browser.print.utils.js`),
			loadScript(`${base}/${llDir}/plugins/leafletPrint/leaflet.browser.print.sizes.js`)
		);
	}
	if (feat.measure) {
		promisesD.push(loadScript(`${base}/${llDir}/plugins/leaflet.measure/leaflet-measure${sufMin}.js`));
	}
	if (feat.timeDimension) {
		// moment y NonTiledLayer no dependen de markercluster; timedimension.src.js necesita moment → Fase E
		promisesD.push(
			loadScript(`${base}/${llDir}/plugins/timedimension/NonTiledLayer.js`),
			loadScript(`${base}/${llDir}/plugins/timedimension/moment.js`),
			loadCSS(`${base}/${llDir}/plugins/timedimension/leaflet.timedimension.control.css`)
		);
	}

	await Promise.all(promisesD);

	// Fase E: dependencias de segundo orden
	// esri-leaflet-vector requiere esri-leaflet (Fase D)
	// timedimension.src.js requiere moment + Leaflet (ambos de Fase D/B)
	var promisesE = [
		loadScript(`${base}/${llDir}/plugins/esri-leaflet-vector/esri-leaflet-vector${sufMin}.js`)
	];
	if (feat.timeDimension) {
		promisesE.push(loadScript(`${base}/${llDir}/plugins/timedimension/leaflet.timedimension.src.js`));
	}

	return Promise.all(promisesE);
}

// Definir la función iniciarIdevAPI
function iniciarIdevAPI(IDEVAPIParam, IDEVAPI_globalParam) {
	IDEVAPI = IDEVAPIParam;
	IDEVAPI_global = IDEVAPI_globalParam;
	if (allLibrariesLoaded && !allAPIExecuted) {
		executeIdevAPI();
	}
}

//var controlCapas = {};

//////// Función principal de llamada desde la aplicación  creada por el usuario ////////////////////////////////////////////////////////////
//****************************************** CARGA SÍNCRONA DE ESTILOS Y LIBRERÍAS JAVASCRIPT NECESARIAS ************************************************************************
function executeIdevAPI() {
	if (allAPIExecuted) return; // Evitar re-ejecución
	allAPIExecuted = true;
	//console.log("Entra en executeIdevAPI");
	//console.log(IDEVAPI);
	//console.log(IDEVAPI_global);
	var returnMaps = [];
	var sincronizar = [];
	var controlCapas = {};

	//Definir proyecciones
	proj4.defs('EPSG:25830', "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");
	proj4.defs('EPSG:25831', "+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs");
	proj4.defs('EPSG:23030', "+proj=utm +zone=30 +ellps=intl +towgs84=-131.032,-100.251,-163.354,-1.2438,-0.0195,-1.1436,9.39 +units=m +no_defs");
	proj4.defs('EPSG:23031', "+proj=utm +zone=31 +ellps=intl +towgs84=-131.032,-100.251,-163.354,-1.2438,-0.0195,-1.1436,9.39 +units=m +no_defs");

	proj4.defs['OGC:CRS84'] = proj4.defs['EPSG:4326'];

	/////////////////////// IDEVAPI_global  ///////////////////////////////////////////////
	if (IDEVAPI_global == undefined) { IDEVAPI_global = {} };
	if (IDEVAPI_global.idioma == undefined) { IDEVAPI_global.idioma = 'va' };
	if (IDEVAPI_global.sincronizar !== undefined) { sincronizar = IDEVAPI_global.sincronizar } else { sincronizar = [] };

	///////////////////// PARÁMETROS URL //////////////////////////////////////////////////
	//Función para leer parametros de la url compatible con IE 11
	$.paramsQuery = function (name) {
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (results == null) { return null; } else { return decodeURI(results[1]) || 0; }
	}
	//////////////////Selecionar el archivo de IDIOMA adecuado///////////////////
	if ($.paramsQuery('idioma') !== null) {
		IDEVAPI_global.idioma = $.paramsQuery('idioma');
	}
	//Pasa el idioma a ISO 639-2 para la petición getFeatureInfo "language"
	if (IDEVAPI_global.idioma == "es") { var idiomaISO639_2 = "spa"; } else { var idiomaISO639_2 = "cat"; }
	//Almacena los textos de "idevAPI_idiomas.js" en MENSAJES según el idioma
	MENSAJES = recursoIdiomas[IDEVAPI_global.idioma];

	//////// Bucle en caso de haber varios componentes de mapa //////////////////////////////////////////////////////////////////////////////////////

	for (var p = 0; p < IDEVAPI.length; p++) {

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//Añadimos CARGANDO MAPA, por defecto
		var htmlCargandoCapa = "";
		htmlCargandoCapa += '<div id="cargandoMapa_' + IDEVAPI[p].id + '" class="idevapi-cargandoMapa"></div>';
		$('#' + IDEVAPI[p].id).append(htmlCargandoCapa);
		// Asegurar que el contenedor tenga la clase idevapi-root para el aislamiento CSS
		$('#' + IDEVAPI[p].id).addClass('idevapi-root');
		$("#cargandoMapa_" + IDEVAPI[p].id).show();

		popupInfoWMS = L.popup().setContent('');
		//.openOn(map);

		//////////////////////INICIALIZACION PARAMETROS POR DEFECTO/////////////////////////////////////////////////////////////////////////////
		if (IDEVAPI[p].id == undefined) { IDEVAPI[p].id = "mapaIDEV" };
		var definidoCoordInicio = true;
		if (IDEVAPI[p].coordInicio == undefined) {
			definidoCoordInicio = false;
			IDEVAPI[p].coordInicio = [39.34, -0.35]
		};
		if (IDEVAPI[p].zoomInicio == undefined) {
			IDEVAPI[p].zoomInicio = 8
		};
		var definidoExtCV = true;
		if (IDEVAPI[p].extCV == undefined) {
			definidoExtCV = false;
			IDEVAPI[p].extCV = [[37.832, -0.41], [40.794, -0.4]];//El ancho de la extensión es fino para ajustar el mapa a lo alto de la CV
		};
		if (IDEVAPI[p].zoomMaximo == undefined) { IDEVAPI[p].zoomMaximo = 20; } else if (IDEVAPI[p].zoomMaximo > 20) { IDEVAPI[p].zoomMaximo = 20; };
		if (IDEVAPI[p].zoomMinimo == undefined) { IDEVAPI[p].zoomMinimo = 0; }
		else if (IDEVAPI[p].zoomMinimo < 0) {
			IDEVAPI[p].zoomMinimo = 0;
		}
		else if (IDEVAPI[p].zoomMinimo > IDEVAPI[p].zoomMaximo) {
			IDEVAPI[p].zoomMinimo = IDEVAPI[p].zoomMaximo;
		};
		if (IDEVAPI[p].zoomBloqueo == undefined) { IDEVAPI[p].zoomBloqueo = L.Browser.mobile };
		if (IDEVAPI[p].mapabase == undefined) { IDEVAPI[p].mapabase = "ORTOFOTO" };
		if (IDEVAPI[p].capas == undefined) { IDEVAPI[p].capas = null };
		if (IDEVAPI[p].controlZoom == undefined) { IDEVAPI[p].controlZoom = true };
		if (IDEVAPI[p].controlCoords == undefined) {
			IDEVAPI[p].controlCoords = true;
		} else if (IDEVAPI[p].controlCoords == true) {
			IDEVAPI[p].controlCoords = !L.Browser.mobile;	//Si es móvil de desactiva
		};
		if (IDEVAPI[p].controlCoordsSRS == undefined) { IDEVAPI[p].controlCoordsSRS = 25830 };
		if (IDEVAPI[p].controlXYSRS == undefined) { IDEVAPI[p].controlXYSRS = 25830 };
		if (IDEVAPI[p].controlXYAbierto == undefined) { IDEVAPI[p].controlXYAbierto = false };
		if (IDEVAPI[p].consultaMunicipio == undefined) { IDEVAPI[p].consultaMunicipio = false };
		if (IDEVAPI[p].tipoArbol == undefined || IDEVAPI[p].tipoArbol == null || IDEVAPI[p].tipoArbol == "" || IDEVAPI[p].tipoArbol == "null") { IDEVAPI[p].tipoArbol = "Checkbox" };
		if (IDEVAPI[p].TOCColapsar == undefined || IDEVAPI[p].TOCColapsar == null || IDEVAPI[p].TOCColapsar == "" || IDEVAPI[p].TOCColapsar == "null") { IDEVAPI[p].TOCColapsar = false };
		if (IDEVAPI[p].estiloVentanas == undefined) { IDEVAPI[p].estiloVentanas = "ICV" };
		if (IDEVAPI[p].estiloSelect == undefined || IDEVAPI[p].estiloSelect == null || IDEVAPI[p].estiloSelect == "" || IDEVAPI[p].estiloSelect == "null") { IDEVAPI[p].estiloSelect = "ICV" };

		////////////////INICIALIZAR PARAMETROS URL////////////////////////////////
		var definidaExtensionQuery = false;
		if (IDEVAPI[p].URLParams == true) {
			if ($.paramsQuery('lat') !== null && $.paramsQuery('lon') !== null) {
				definidaExtensionQuery = true;
				var latlon = [parseFloat($.paramsQuery('lat')), parseFloat($.paramsQuery('lon'))];
				if ($.paramsQuery('epsg') !== null) {
					switch ($.paramsQuery('epsg')) {
						case "25830":
							latlon = [parseFloat($.paramsQuery('lon')), parseFloat($.paramsQuery('lat'))];
							var y = proj4('EPSG:25830', 'EPSG:4326', latlon)[0];
							var x = proj4('EPSG:25830', 'EPSG:4326', latlon)[1];
							latlon = [x, y];
							break;
						case "4326":
							break;
						case "3857":
							latlon = [parseFloat($.paramsQuery('lon')), parseFloat($.paramsQuery('lat'))];
							var y = proj4('EPSG:3857', 'EPSG:4326', latlon)[0];
							var x = proj4('EPSG:3857', 'EPSG:4326', latlon)[1];
							latlon = [x, y];
							break;
						case undefined:
							break;
						default:
							alert(MENSAJES.ErrorSistemaReferencia + $.paramsQuery('epsg'));
					}
				}
				IDEVAPI[p].coordInicio = latlon;
			}

			if ($.paramsQuery('zoom') !== null) {
				definidaExtensionQuery = true;
				IDEVAPI[p].zoomInicio = parseInt($.paramsQuery('zoom'));
			}
			if ($.paramsQuery('id') !== null) {
				IDEVAPI[p].id = $.paramsQuery('id');
			}
		};
		//////////////////////INICIALIZACION MOVIL/////////////////////////////////////////////////////////////////////////////
		if (screen.width < 750) {
			//var height = $(window).height();
			//$('#' + IDEVAPI[p].id).height(height-30);
			//colapsar_capas=true;
			IDEVAPI[p].TOCColapsar = true;
		}
		//console.log($( '#'+IDEVAPI[p].id ));
		//$('#'+IDEVAPI[p].id).css("height","100%");
		///////////////////// INICIALIZACIÓN ELEMENTOS ////////////////////////////////////////////////////////////////////////////

		////////////////////////////////////ESTABLECER IDS CAPAS//////////////////////////////////////////////////////////////////
		var capasIds = IDEVAPI[p].capas;
		if (capasIds !== undefined && capasIds !== null) {
			for (var i = 0; i < capasIds.length; i++) {
				if (capasIds[i].idInterno === undefined) {
					capasIds[i].idInterno = "capa" + i;
				}
			}
		}

		//////////////  SELECT  /////////////////////////////////////////////////

		if (IDEVAPI_global.idioma == "va") {
			var txtPlaceholderSelect2 = "Introduïsca valor..."; var txtCounterMultipleSelect2 = "seleccionats";
			var txtCounterIndividualSelect2 = "seleccionat"; var txtPlaceHolderMultiple = "Escriu per buscar";
		}
		else if (IDEVAPI_global.idioma == "es") {
			var txtPlaceholderSelect2 = "Introduzca valor..."; var txtCounterMultipleSelect2 = "seleccionados";
			var txtCounterIndividualSelect2 = "seleccionado"; var txtPlaceHolderMultiple = "Escribe para buscar";
		}
		else { var txtPlaceholderSelect2 = "Introduïsca valor..."; var txtCounterMultipleSelect2 = "seleccions"; var txtCounterIndividualSelect2 = "seleccionat"; }
		// Añade la clase SELECT2 a las CONSULTAS definidas
		if (IDEVAPI_global.idioma == "va") { var idiomaSelect2 = "ca" } else { var idiomaSelect2 = "es" }
		if (IDEVAPI[p].consultas !== undefined) {
			IDEVAPI[p].consultas.forEach(function (consulta) {
				for (i = 0; i < consulta.selects.length; i++) {
					//Si existe el select2
					if ($('#' + consulta.selects[i])) {
						$('#' + consulta.selects[i]).select2({
							language: idiomaSelect2,
							placeholder: txtPlaceholderSelect2,
							selectionCssClass: 'idevapi-root',
							dropdownCssClass: 'idevapi-root',
							allowClear: true
						});
						//Se realiza focus al abrir el select
						$('#' + consulta.selects[i]).on('select2:open', function (e) {
							const selectId = e.target.id;
							$(".select2-search__field[aria-controls='select2-" + selectId + "-results']").each(function (key, value,) {
								value.focus();
							});
						});
					}
				}
			});
		}

		function formatStateMultiple(state) {
			if (!state.id) return state.text;
			var $state = state.text;
			if (state.selected == true) {
				var $state = $('<span class="idevapi-selected-span"><a class="idevapi-selected-text">' + state.text + '</a><div class="idevapi-check-selected"></div></span>');
			} else {
				state.selected = false;
			}
			return $state;
		};

		function formatStateSimple(state) {
			if (!state.id) return state.text;
			var $state = state.text;
			if (state.selected == true) {
				var $state = $('<span class="idevapi-selected-span"><a class="idevapi-selected-text">' + state.text + '</a></span>');
			} else {
				state.selected = false;
			}
			return $state;
		};

		if (IDEVAPI[p].capas !== undefined && IDEVAPI[p].capas !== null) {
			IDEVAPI[p].capas.forEach(function (capa) {
				if (capa.tipo !== undefined && capa.tipo == "GeoJSON") {
					if (capa.filtro !== undefined) {
						if (capa.filtro.selects !== undefined) {
							capa.filtro.selects.forEach(function (sel) {
								//Si existe el select					
								if ($('#' + sel.select)) {
									// Habilitar o no seleccion multiple
									if (sel.tipo === 'multiple') {
										$('#' + sel.select).select2({
											language: idiomaSelect2,
											placeholder: txtPlaceholderSelect2,
											selectionCssClass: 'idevapi-root',
											dropdownCssClass: 'idevapi-root',
											allowClear: false,
											multiple: true,
											templateResult: formatStateMultiple
										});
									} else {
										$('#' + sel.select).select2({
											language: idiomaSelect2,
											placeholder: txtPlaceholderSelect2,
											selectionCssClass: 'idevapi-root',
											dropdownCssClass: 'idevapi-root',
											allowClear: true,
											templateResult: formatStateSimple
										});
									}

									//Se realiza focus al abrir el select
									$('#' + sel.select).on('select2:open', function (e) {
										const selectId = e.target.id;
										$(".select2-search__field[aria-controls='select2-" + selectId + "-results']").each(function (key, value,) {
											value.focus();
										});
									});

								}
							});

							(function (p) {
								$(document).ready(function () {
									// Cambiamos el placeholder de los selectores multiples al seleccionarlos
									var textAreas = document.querySelectorAll('.select2-search__field');

									textAreas.forEach(function (textArea) {
										textArea.addEventListener('click', function (event) {
											event.target.placeholder = txtPlaceHolderMultiple;
										});

									});

									// Cambiamos el placeholder de los selectores para indicar que se puede escribir para buscar
									$('.select2-hidden-accessible').on('select2:select', function (e) {
										setTimeout(function () {
											$(this).next('.select2-container').find('.select2-search__field').attr('placeholder', txtPlaceHolderMultiple);
										}.bind(this), 100);
									});

									// Añadir el icono de flecha (abrir select) para los multiselectores
									if (IDEVAPI && IDEVAPI[p]) {
										var mapElement = document.getElementById(IDEVAPI[p].id);
										if (mapElement) {
											// Togle class 'idevapi-has-selections' when items are selected
											$(mapElement).find('select[multiple]').on('change', function () {
												var $container = $(this).next('.select2-container');
												if ($(this).val() && $(this).val().length > 0) {
													$container.addClass('idevapi-has-selections');
												} else {
													$container.removeClass('idevapi-has-selections');
												}
											});

											var elements = mapElement.querySelectorAll('.select2-selection--multiple');

											for (var i = 0; i < elements.length; i++) {
												if (!elements[i].querySelector('.select2-selection__arrow')) {
													var newSpan = document.createElement('span');
													newSpan.className = 'select2-selection__arrow';
													newSpan.setAttribute('role', 'presentation');

													var flecha = document.createElement('b');
													flecha.setAttribute('role', 'presentation');
													flecha.className = 'idevapi-dropdown-multiple';

													newSpan.appendChild(flecha);
													elements[i].appendChild(newSpan);
												}
											}
										}
									}

								});
							})(p);
						}
						if (capa.filtro.inputs !== undefined) {
							capa.filtro.inputs.forEach(function (input) {
								//Si existe el input					
								if ($('#' + input.id)) {
									$('#' + input.id).addClass("idevapi-root");
									let svgRefresh = '<img src="' + prot + urlAPI + '/images/refresh.svg" width="14" height="14" style="opacity: 0.6;" />';

									// Se crea el input NUMÉRICO
									if (input.tipo === 'numero') {
										let valorMax = input.valorMax;
										let valorMin = input.valorMin;
										let decimales = input.decimales;
										$('#' + input.id).addClass("idevapi-input-filtro");
										$('#' + input.id).html(`
									<div class="idevapi-input-contenedor">
										<input class="idevapi-input-filtro-txt" type="text" oninput="validarInputNumerico(this,`+ valorMax + `,` + valorMin + `,` + decimales + `)" placeholder="` + txtPlaceholderSelect2 + `" />
										<img src="` + prot + urlAPI + `/images/select2_limpiar.svg" class="idevapi-input-clear-icon" style="visibility: hidden;" />
									</div>
									<div class="idevapi-input-refresh-filtro" title="Refrescar">
										` + svgRefresh + `
									</div>
								`);
										// Se crea el input TEXTO
									} else if (input.tipo === 'texto') {
										$('#' + input.id).addClass("idevapi-input-filtro");
										$('#' + input.id).html(`
									<div class="idevapi-input-contenedor">
										<input class="idevapi-input-filtro-txt" type="text" oninput="toggleClearIcon(this)" placeholder="`+ txtPlaceholderSelect2 + `" />
										<img src="` + prot + urlAPI + `/images/select2_limpiar.svg" class="idevapi-input-clear-icon" style="visibility: hidden;" />
									</div>
									<div class="idevapi-input-refresh-filtro" title="Refrescar">
										` + svgRefresh + `
									</div>
								`);
										// Se crea el input FECHA
									} else if (input.tipo === 'fecha') {
										$('#' + input.id).addClass("idevapi-input-filtro-fecha");
										$('#' + input.id).html(`
									<div class="idevapi-input-contenedor-fecha">
										<input type="date" class="idevapi-input-filtro-fecha-txt" oninput="toggleClearIcon(this)"/>
										<input type="date" class="idevapi-input-filtro-fecha-txt" oninput="toggleClearIcon(this)"/>
										<img src="` + prot + urlAPI + `/images/select2_limpiar.svg" class="idevapi-input-clear-icon-fecha" style="visibility: hidden;" />
									</div>
									<div class="idevapi-input-refresh-filtro" title="Refrescar">
										` + svgRefresh + `
									</div>
								`);
									}

								}
							});
						}
					}
				}
			});
		}

		/////////////////// Clase MAPA  ////////////////////////////////////////////////////////////////////////////////////////////////

		map = L.map(IDEVAPI[p].id, {
			//layers: [mapaBase],
			//continuousWorld: true,
			//worldCopyJump: false,
			zoomControl: false,
			maxZoom: IDEVAPI[p].zoomMaximo,
			minZoom: IDEVAPI[p].zoomMinimo,
			center: IDEVAPI[p].coordInicio,
			zoom: IDEVAPI[p].zoomInicio,
			gestureHandling: IDEVAPI[p].zoomBloqueo,
			gestureHandlingOptions: {
				duration: 2000
			}
			//scrollWheelZoom: true	//Si false, no funciona zoom con rueda si no entras en el mapa (para poder navegar por la página)
			//fullscreenControl: true
		});

		// Añadimos la clase idevapi-root al contenedor del mapa para que se apliquen los estilos
		$('#' + IDEVAPI[p].id).addClass("idevapi-root");

		if (IDEVAPI[p].controlTiempo && IDEVAPI[p].controlTiempo.activo === true) {
			let timeDimension = new L.timeDimension({
				timeInterval: IDEVAPI[p].controlTiempo.inicio + "/" + IDEVAPI[p].controlTiempo.fin,
				period: IDEVAPI[p].controlTiempo.periodo,
				formatDate: IDEVAPI[p].controlTiempo.formatoFecha
			});

			map.timeDimension = timeDimension;
			map.timeDimensionControl = true;

			var timeDimensionControl = new L.Control.TimeDimension(IDEVAPI[p].controlTiempo.timeDimensionControlOptions);
			map.addControl(timeDimensionControl);

			// NOTE (PAUPER, 2026-03-25): Reposicionar barra de tiempo a la derecha del control de mapa base
			// Los estilos fijos (position, left, bottom, z-index) de .leaflet-bar-timecontrol están en idevAPI_estilos.css
			// La barra se reparenta al contenedor del mapa para que position:absolute sea relativo a él
			// El colapso se gestiona por JS según el espacio disponible (no por viewport media query)
			(function (mapId) {
				function ajustaEscalaConBarra() {
					var mapContainer = document.getElementById(mapId);
					if (!mapContainer) return;

					var tdEl = mapContainer.querySelector('.leaflet-bar-timecontrol');
					var scaleEl = mapContainer.querySelector('.leaflet-control-scale');
					if (!tdEl || !scaleEl) return;

					// Reparentar al contenedor del mapa para que position:absolute sea relativo a él
					// (en su posición original está dentro de .leaflet-bottom.leaflet-left)
					if (tdEl.parentNode !== mapContainer) {
						mapContainer.appendChild(tdEl);
					}

					// Gestión del colapso: expandir primero para medir el ancho real
					tdEl.classList.remove('idevapi-tiempo-colapsado');
					var expandedWidth = tdEl.scrollWidth || tdEl.offsetWidth;
					// Espacio disponible = ancho del mapa - left de la barra (96px) - 10px margen derecho
					var availableWidth = mapContainer.offsetWidth - 96 - 10;
					if (expandedWidth > availableWidth) {
						// No cabe expandido: colapsar
						tdEl.classList.add('idevapi-tiempo-colapsado');
					}

					// Medir la altura final y subir la escala encima (+ 5px de separación)
					// La barra empieza a bottom: 25px
					var tdHeight = tdEl.offsetHeight;
					if (tdHeight > 0) {
						scaleEl.style.bottom = (25 + tdHeight + 1) + 'px';
						scaleEl.style.left = '95px';
					}
				}
				// Ejecutar tras renderizado inicial (el control tarda un tick en pintarse)
				setTimeout(ajustaEscalaConBarra, 100);
				// Re-ajustar si el mapa cambia de tamaño
				map.on('resize', ajustaEscalaConBarra);
			})(IDEVAPI[p].id);
		}


		/////////////////// CREACIÓN DE LAYERGROUP DE LAS CAPAS BASE  ////////////////////////////////////////////////////////////////////////////////////////
		for (var i in capasBase) {
			//Título
			var tituloV = capasBase[i].titulo.split("|");
			var titulo = "";
			if (tituloV.length > 1) {
				if (IDEVAPI_global.idioma == "va") { titulo = tituloV[1]; } else if (IDEVAPI_global.idioma == "es") { titulo = tituloV[0]; } else { if (tituloV[2] !== undefined) { titulo = tituloV[2]; } }
			} else {
				titulo = capasBase.titulo;
			}
			//Mapa Base "Sin_Fondo"
			if (capasBase[i].capas.length == 0) {
				MapaBase[i] = L.layerGroup();
				MapaBase[i].id = i + ";";
				MapaBase[i].titulo = titulo;
				MapaBase[i].origen = "base";
				MapaBase[i].opacidad = 1;
				break;
			}

			var grupoBase = L.layerGroup();

			for (var j = 0; j < capasBase[i].capas.length; j++) {
				var nomCapaOrigen = capasBase[i].capas[j];
				var url = capasBaseFuentes[nomCapaOrigen].url;
				var capaSer = capasBaseFuentes[nomCapaOrigen].capa;
				var tileMatrixSet = capasBaseFuentes[nomCapaOrigen].tilematrixset;

				//Crea los Panes
				if (map.getPane("capaBase|" + i + "|" + j + "|200") == undefined) {
					map.createPane("capaBase|" + i + "|" + j + "|200");
					map.getPane("capaBase|" + i + "|" + j + "|200").style.zIndex = 200 + j;
				}

				//Capas Base TileVector
				if (capasBaseFuentes[nomCapaOrigen].isVectorTile === true) {
					var datasource_name = capasBaseFuentes[nomCapaOrigen].datasource_name;
					var capa = new L.esri.Vector.vectorTileLayer("", { styleUrl: url, datasource_name: datasource_name, pane: "capaBase|" + i + "|" + j + "|200" });
				}
				//Capas Base WMS
				else if (capasBaseFuentes[nomCapaOrigen].tilematrixset == undefined) {
					var source = L.WMS.source(url, {
						pane: "capaBase|" + i + "|" + j + "|200",
						maxZoom: 20,
						format: "image/png",
						transparent: true,
						opacity: 1,
						version: '1.3.0',
						info_format: "text/html",
						feature_count: "150",
						language: idiomaISO639_2,
						identify: false
					});
					var capa = source.getLayer(capaSer);
					capa.bringToBack();

				}
				//Capas Base WMTS
				else {
					var capa = new L.tileLayer(url + "?service=WMTS&request=GetTile&version=1.0.0&layer=" + capaSer + "&style=default&TileMatrixSet=" + tileMatrixSet + "&TileMatrix={z}&TileRow={y}&TileCol={x}", {
						pane: "capaBase|" + i + "|" + j + "|200",
						maxZoom: 20
					});
				}
				grupoBase.addLayer(capa);
			}

			MapaBase[i] = grupoBase;
			MapaBase[i].id = i + ";";
			MapaBase[i].titulo = titulo;
			MapaBase[i].origen = "base";
			MapaBase[i].opacidad = 1;
		}

		//////////////////// LISTADO DE MAPAS BASE //////////////////////////////////////////////////////////////////////////////////////
		var ListadoMapasBase = {};
		if (IDEVAPI[p].mapabaseDisponibles == undefined) {
			ListadoMapasBase[MapaBase["Imagen"].titulo] = MapaBase["Imagen"];
			ListadoMapasBase[MapaBase["Ortonomenclator"].titulo] = MapaBase["Ortonomenclator"];
			ListadoMapasBase[MapaBase["Hibrido"].titulo] = MapaBase["Hibrido"];
			ListadoMapasBase[MapaBase["Relieve"].titulo] = MapaBase["Relieve"];
			ListadoMapasBase[MapaBase["Topografico"].titulo] = MapaBase["Topografico"];
			ListadoMapasBase[MapaBase["Gris"].titulo] = MapaBase["Gris"];
			ListadoMapasBase[MapaBase["Basico"].titulo] = MapaBase["Basico"];
			ListadoMapasBase[MapaBase["Nocturno"].titulo] = MapaBase["Nocturno"];
			ListadoMapasBase[MapaBase["Sin_Fondo"].titulo] = MapaBase["Sin_Fondo"];
		} else {
			var ListadoMapabaseDisponibles = IDEVAPI[p].mapabaseDisponibles.split(",");
			$.each(ListadoMapabaseDisponibles, function (i, mapabase) {
				switch (mapabase) {
					case "IMAGEN":
						ListadoMapasBase[MapaBase["Imagen"].titulo] = MapaBase["Imagen"];
						break;
					case "HIBRIDO":
						ListadoMapasBase[MapaBase["Hibrido"].titulo] = MapaBase["Hibrido"];
						break;
					case "RELIEVE":
						ListadoMapasBase[MapaBase["Relieve"].titulo] = MapaBase["Relieve"];
						break;
					case "TOPOGRAFICO":
						ListadoMapasBase[MapaBase["Topografico"].titulo] = MapaBase["Topografico"];
						break;
					case "GRIS":
						ListadoMapasBase[MapaBase["Gris"].titulo] = MapaBase["Gris"];
						break;
					case "BASICO":
						ListadoMapasBase[MapaBase["Basico"].titulo] = MapaBase["Basico"];
						break;
					case "SIN_FONDO":
						ListadoMapasBase[MapaBase["Sin_Fondo"].titulo] = MapaBase["Sin_Fondo"];
						break;
					case "ORTONOMENCLATOR":
						ListadoMapasBase[MapaBase["Ortonomenclator"].titulo] = MapaBase["Ortonomenclator"];
						break;
					case "NOCTURNO":
						ListadoMapasBase[MapaBase["Nocturno"].titulo] = MapaBase["Nocturno"];
						break;
					default:
				}
			});
		}
		//////////////////// Mapa base de inicio //////////////////////////////////////////////////////////////////////////////////////
		switch (IDEVAPI[p].mapabase) {
			case "IMAGEN": mapaBase = MapaBase["Imagen"];
				break;
			case "HIBRIDO": mapaBase = MapaBase["Hibrido"];
				break;
			case "RELIEVE": mapaBase = MapaBase["Relieve"];
				break;
			case "TOPOGRAFICO": mapaBase = MapaBase["Topografico"];
				break;
			case "GRIS": mapaBase = MapaBase["Gris"];
				break;
			case "BASICO": mapaBase = MapaBase["Basico"];
				break;
			case "SIN_FONDO": mapaBase = MapaBase["Sin_Fondo"];
				break;
			case "ORTONOMENCLATOR": mapaBase = MapaBase["Ortonomenclator"];
				break;
			case "NOCTURNO": mapaBase = MapaBase["Nocturno"];
				break;
			default: mapaBase = MapaBase["Imagen"];
		}

		//Añade el mapaBase de inicio
		map.addLayer(mapaBase);
		//////////////////////////////////////////////////////////////////////////////////////////////////////

		//Variable para almacenar las CAPAS
		var controlCapa = controlCapas[IDEVAPI[p].id] = {};

		if (IDEVAPI[p].extInicio !== undefined) {
			//Si el mapa está en un div no visible, no funciona la función fitBounds (realiza un zoom al mundo)
			//el parámetro extInicio no funciona cuando el mapa no es visible (se centra según "center" y "zoom")
			if (map._size.x !== 0 && map._size.y !== 0) {
				//Si no ha definido un zoom o coordenadas por parámetros, ajusta según extInicio
				if (definidaExtensionQuery == false) {
					map.fitBounds(IDEVAPI[p].extInicio);
				}
			}
		}
		map.id = IDEVAPI[p].id;
		map.coordInicio = IDEVAPI[p].coordInicio;
		map.zoomInicio = IDEVAPI[p].zoomInicio;
		mapas_id.push({ mapa: map, id: IDEVAPI[p].id });

		returnMaps.push(map);
		//Remarcar limite municipio
		var capaConsultaMunicipio = null;
		if (IDEVAPI[p].consultaMunicipio == true) {
			anyadeConsultaClick(map, capaConsultaMunicipio);
		}

		var TreeControlOptions = {
			//collapsed: colapsar_capas,
			collapsed: IDEVAPI[p].TOCColapsar,
			sortFunction: function (layerA, layerB, nameA, nameB) {
				//console.log(layerA + " " + layerB + " " + nameA + " " + nameB);
				return [nameA, nameB].sort();
			}
		}

		controlCapa.GCapasWMS = L.layerGroup().addTo(map);
		controlCapa.GCapasWMTS = L.layerGroup().addTo(map);
		controlCapa.GCapasTree = L.layerGroup();
		controlCapa.contadorPromesas = 0;
		controlCapa.promesas = [];
		controlCapa.mapa = map;
		controlCapa.GCapasGeoJSON = [];
		controlCapa.capasNormal = [];
		controlCapa.capasArbol = [];
		controlCapa.capasOpacidad = {};
		controlCapa.tocKeySinNivel2 = "__IDEVAPI_TOC_SIN_NIVEL2__";
		controlCapa.registraCapaSueltaTOC = function (tipoArbolParam, tituloCapaParam, capaParam, ordenParam) {
			registraCapaSueltaTOC(controlCapa.servicios, tipoArbolParam, tituloCapaParam, capaParam, ordenParam);
		};
		controlCapa.numCapasCargadas = 0;
		controlCapa.colapsarLeyenda = IDEVAPI[p].colapsarLeyenda;
		controlCapa.colapsarConsultas = IDEVAPI[p].colapsarConsultas;
		if (IDEVAPI[p].consultas === undefined) { controlCapa.consultas = []; } else { controlCapa.consultas = IDEVAPI[p].consultas; }
		if (IDEVAPI[p].filtros === undefined) { controlCapa.filtros = []; } else { controlCapa.filtros = IDEVAPI[p].filtros; }
		if (IDEVAPI[p].puntos == undefined) { IDEVAPI[p].puntos = []; }
		if (IDEVAPI[p].capasFijas == undefined) { IDEVAPI[p].capasFijas = []; }

		// NOTE (PAUPER, 2026-03-16): I-02 implementado — capasFijas
		// Capas incluidas en IDEVAPI.capas que siempre son visibles y no se muestran en el TOC.
		// Formato: capasFijas: [{capa: "nombre_capa", servicio: "nombre_servicio"}]
		if (IDEVAPI[p].capasFijas.length > 0 && IDEVAPI[p].capas !== undefined) {
			IDEVAPI[p].capasFijas.forEach(function (capaFija) {
				IDEVAPI[p].capas.forEach(function (capa) {
					var coincideServicio = (capaFija.servicio === undefined) ||
						(capa.servicio && (
							capa.servicio === capaFija.servicio ||
							capa.servicio.id === capaFija.servicio
						));
					var coincideCapa = (capa.capas === capaFija.capa) || (capa.titulo === capaFija.capa);
					if (coincideServicio && coincideCapa) {
						// Forzar siempre visible, nunca en el TOC
						capa.TOCVisible = false;
						capa.TOCNivel1 = null;
						capa.TOCNivel2 = null;
						capa.visibleInicio = true;
						capa._esCapaFija = true; // marca interna para evitar toggle en leyenda
					}
				});
			});
		}

		$('.leaflet-control-layers').undelegate();

		////////////////  SE AÑADEN WIDGETS AL MAPA  ///////////////////////////////////////////////////////////////////////////////////
		if (IDEVAPI[p].controlZoom) { creaBotonesZoom(IDEVAPI[p].id, map); }
		if (IDEVAPI[p].controlExpandir) { creaBotonExpandir(IDEVAPI[p].id, IDEVAPI[p].controlZoom, map); }
		if (IDEVAPI[p].controlCoords) { creaControlCoords(IDEVAPI[p].id, IDEVAPI[p].controlCoordsSRS, map); }
		if (IDEVAPI[p].controlHome) { creaBotonHome(IDEVAPI[p].id, IDEVAPI[p].controlZoom, IDEVAPI[p].extCV, map); }
		if (IDEVAPI[p].controlPosicion) { creaBotonPosicion(IDEVAPI[p].id, map); }
		if (IDEVAPI[p].controlBuscador !== undefined) { if (IDEVAPI[p].controlBuscador) { creaBuscador(map, IDEVAPI_global.idioma); } }
		if (IDEVAPI[p].controlTitle !== undefined) { creaDivCabecera(IDEVAPI[p].id, IDEVAPI[p].controlTitle); }
		if (IDEVAPI[p].controlImpresion !== undefined && !L.Browser.mobile) {
			if (L.BrowserPrint && L.BrowserPrint.Utils) {
				if (L.WMS && L.WMS.Layer) {
					L.BrowserPrint.Utils.registerLayer(L.WMS.Layer, 'L.WMS.Layer', function (layer, utils) {
						var sourceUrl = layer._source ? layer._source._url : layer.url;
						var sourceOptions = layer._source ? utils.cloneOptions(layer._source.options) : utils.cloneOptions(layer.options);
						var source = L.WMS.source(sourceUrl, sourceOptions);
						// Bugfix: Inyectar onRemove en L.WMS.Source si no existe, 
						// para evitar que printMap.remove() crashee con 't.onRemove is not a function'
						if (typeof source.onRemove !== 'function') {
							source.onRemove = function () {
								if (this._overlay) { this._overlay.remove(); }
							};
						}
						return source.getLayer(layer.options.name || layer.options.layers || layer._name);
					});
				}
				if (L.esri && L.esri.Vector && L.esri.Vector.vectorTileLayer) {
					L.BrowserPrint.Utils.registerLayer(L.esri.Vector.VectorTileLayer, 'L.esri.Vector.VectorTileLayer', function (layer, utils) {
						return L.esri.Vector.vectorTileLayer("", utils.cloneOptions(layer.options));
					});
				}
			}
			var tituloControl = IDEVAPI[p].controlTitle;
			if (tituloControl !== undefined) {
				var tituloV = tituloControl.split(";");
				if (tituloV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { tituloControl = tituloV[1]; }
					else if (IDEVAPI_global.idioma == "es") { tituloControl = tituloV[0]; }
					else { if (tituloV[2] !== undefined) { tituloControl = tituloV[2]; } else { tituloControl = tituloV[0]; } }
				}
			}

			L.control.browserPrint({
				title: MENSAJES.mensajeImpresion,
				printModes: ["Landscape", "Portrait", "Auto"],
				controlTitle: tituloControl,
				mapaId: IDEVAPI[p].id
			}).addTo(map);

			// Bugfix: Al cancelar o terminar la impresión, leaflet.browser.print quita la clase del body pero a veces el mapa original no recupera bien sus dimensiones
			map.on(L.BrowserPrint.Event.PrintEnd, function (e) {
				setTimeout(function () {
					map.invalidateSize();
				}, 200);
			});
			map.on(L.BrowserPrint.Event.PrintCancel, function (e) {
				setTimeout(function () {
					map.invalidateSize();
				}, 200);
			});
		}

		//controlMedicion
		if (IDEVAPI[p].controlMedicion) {
			var opcionesMedir = {
				position: "topleft",
				activeColor: 'rgb(0, 60, 255)',
				completedColor: 'rgb(0, 60, 255)',
				captureZIndex: 10000,
				primaryLengthUnit: 'meters',
				secondaryLengthUnit: 'kilometers',
				primaryAreaUnit: 'sqmeters',
				secondaryAreaUnit: 'hectares',
				decPoint: ',',
				thousandsSep: '.'
			}
			var measureControl = L.control.measure(opcionesMedir);
			measureControl.addTo(map);
			traduceElementosWidget("vMedir");
		}		//Wigdget Añadir punto zoomXY
		if (IDEVAPI[p].controlXY) {
			//Se crea un "pane" para insertar resultados de Análisis, con z-index = 610, por encima de los cluster (marker-pane con z-index=600)
			if (map.getPane("capaAnalisis") == undefined) {
				map.createPane("capaAnalisis");
				map.getPane("capaAnalisis").style.zIndex = 710;
			}
			var divVentanaXYId = "divVentanaXY_" + IDEVAPI[p].id;
			var divVentanaXY = document.createElement("div");
			divVentanaXY.id = divVentanaXYId;
			// No ocultamos el contenedor externo para no interferir con la lógica de jQuery UI
			var templatePath = "/wg/templates/zoomXY.html";
			// Si urlAPI ya tiene protocolo o es local, no le concatenamos prot
			var fullTemplateURL = (urlAPI.indexOf("://") !== -1 || urlAPI.indexOf("file://") !== -1) ? urlAPI + templatePath : prot + urlAPI + templatePath;

			document.getElementById(IDEVAPI[p].id).appendChild(divVentanaXY);
			//Función que añade contenido a la página y ejecuta función al cargar el template
			var despuesLoad = function (estilo, dId, map, mapaId, srsInicial, abrirDialogo) {
				return function () {
					var $container = $("#" + dId);
					var $dialog = $container.find("#vZoomXY");
					$dialog.dialog({
						autoOpen: false,
						resizable: false,
						width: "auto",
						height: "auto",
						closeText: "",
						appendTo: "#" + mapaId,
						position: { my: "center top", at: "center top+50", of: "#" + mapaId, collision: "fit fit" },
						zIndex: 5000
					});

					// Obtener el wrapper .ui-dialog generado por jQuery UI (NO el contenido #vZoomXY)
					var $dialogWidget = $dialog.dialog("widget");

					// Confinar el diálogo dentro del contenedor del mapa
					$dialogWidget.draggable("option", "containment", "#" + mapaId);

					// Evitar que los eventos del diálogo propaguen a Leaflet (previene drag del mapa)
					L.DomEvent.disableClickPropagation($dialogWidget[0]);

					// Cuando se inicia drag desde la barra de título, desactivar drag del mapa
					$dialogWidget.find(".ui-dialog-titlebar").on("mousedown", function () {
						// Traer al frente
						$dialogWidget.css("zIndex", 10000);

						if (map && map.dragging) {
							map.dragging.disable();
							$(document).one("mouseup.zoomXYEnd_" + mapaId, function () {
								if (map && map.dragging) map.dragging.enable();
							});
						}
					});

					// Aplicar SRS inicial antes de inicializaZoomXY
					var srsVal = String(srsInicial || '25830');
					var srsValidos = ['25830', '25831', '23030', '23031', '4326D', '4326S'];
					if (srsValidos.indexOf(srsVal) === -1) { srsVal = '25830'; }
					$("#zZoomXYSRS").val(srsVal);
					$("#vZoomXYCoordXY").css('display', (srsVal === '4326D' || srsVal === '4326S') ? 'none' : 'block');
					$("#vZoomXYCoordGeoDec").css('display', srsVal === '4326D' ? 'block' : 'none');
					$("#vZoomXYCoordGeoSex").css('display', srsVal === '4326S' ? 'block' : 'none');

					inicializaZoomXY();
					modificaEstiloVentanas($dialog, estilo);  //idevAPI_general.js - ahora pasamos el objeto jQuery
					traduceElementosWidget("vZoomXY");
					//Añadimos SRC de las imágenes
					$("#zoomXYImagenBorrar").attr("src", prot + urlAPI + "/images/borrar_p.png");
					$("#ZoomXYImagenCaptura").attr("src", prot + urlAPI + "/images/h_zoomXY_pantalla.svg");
					$("#zoomXYImagenZoom").attr("src", prot + urlAPI + "/images/zoom_p.png");
					// Crear botón ZoomXY después de que el dialog jQuery UI esté completamente inicializado
					creaBotonZoomXY(mapaId, map);
					if (abrirDialogo === true) {
						abreVentanaZoomXY(mapaId, map);
					}
				}
			}
			$("#" + divVentanaXYId).load(fullTemplateURL, despuesLoad(IDEVAPI[p].estiloVentanas, divVentanaXYId, map, IDEVAPI[p].id, IDEVAPI[p].controlXYSRS, IDEVAPI[p].controlXYAbierto));
		}


		////////////////////// CAPAS //////////////////////////////////////////////////////////////////
		//**** Recorre las capas definidas por el usuario para añadirlas al mapa *********/
		controlCapa.servicios = {};
		controlCapa.promesas[controlCapa.contadorPromesas] = new Promise(function (resolve, reject) { resolve(); });
		controlCapa.contadorPromesas++;
		var tipoArbol = IDEVAPI[p].tipoArbol;
		controlCapa.tipoArbol = tipoArbol;

		$.each(IDEVAPI[p].capas, function (i, capa) {
			//Si se trata de un servicio definido por el usuario
			if (typeof capa.servicio === 'object' && capa.servicio !== null) {
				if (capa.servicio.url == undefined || capa.servicio.url == null || capa.servicio.url == "" || capa.servicio.url == "null") {
					alert(MENSAJES.ErrorURLCapa);
					return;
				}
				if (capa.servicio.origen == undefined || capa.servicio.origen == null || capa.servicio.origen == "" || capa.servicio.origen == "null") {
					if (capa.servicio.url.indexOf("terramapas.icv.gva.es") !== -1) {
						capa.servicio.origen = "MS";
					} else if (capa.servicio.url.indexOf("carto.icv.gva.es") !== -1) {
						capa.servicio.origen = "AGS";
					} else if (capa.servicio.url.toLowerCase().indexOf("geojson") !== -1 || capa.servicio.url.indexOf("IDEVAPI_Local") !== -1 || capa.servicio.url.indexOf("local") !== -1) {
						capa.servicio.origen = "GeoJSON";
					} else {
						capa.servicio.origen = "BD";
					}
				}
				if (capa.servicio.id == undefined || capa.servicio.id == null || capa.servicio.id == "" || capa.servicio.id == "null") {
					capa.servicio.id = capa.servicio.origen + randomNumberFromRange(0, 10000);
				}
				if (capa.servicio.idVisor == undefined || capa.servicio.idVisor == null || capa.servicio.idVisor == "" || capa.servicio.idVisor == "null") {
					capa.servicio.idVisor = "";
				}
				if (capa.servicio.formato == undefined || capa.servicio.formato == null || capa.servicio.formato == "" || capa.servicio.formato == "null") {
					if (capa.servicio.origen == "MS" || capa.servicio.origen == "AGS" || capa.servicio.origen == "GS") {
						capa.servicio.formato = "image/png";
					}
				}
				//capa.servicioOrigen = capa.servicio.origen;
				//Si se trata de un servicio definido en idevAPI_config.js
			} else {
				var servicioConfig = capa.servicio;
				delete capa.servicio;
				servicioConfig = servicioConfig.replace(/\s+/g, ''); //Guarda los datos relativos al servicio y elimina los espacios en blanco (2)
				if (capasIDEV[servicioConfig] == undefined) {
					capasIDEV[servicioConfig] = ["GeoJSON", "local", null];
				}
				capa.servicio = {};
				capa.servicio.id = servicioConfig;
				capa.servicio.url = capasIDEV[servicioConfig][1].split("|")[0];
				capa.servicio.formato = capasIDEV[servicioConfig][2];
				capa.servicio.origen = capasIDEV[servicioConfig][0];
			}

			if (capa.servicio.version == undefined || capa.servicio.version == null || capa.servicio.version == "" || capa.servicio.version == "null") {
				capa.servicio.version = "1.3.0";
			}
			if (capa.servicio.estilo == undefined || capa.servicio.estilo == null || capa.servicio.estilo == "" || capa.servicio.estilo == "null") {
				capa.servicio.estilo = "";
			}
			if (capa.servicio.usarProxy == undefined || capa.servicio.usarProxy == null || capa.servicio.usarProxy == "" || capa.servicio.usarProxy == "null") {
				capa.servicio.usarProxy = false;
			}
			if (capa.servicio.datos == undefined || capa.servicio.datos == null || capa.servicio.datos == "" || capa.servicio.datos == "null") {
				capa.servicio.datos = "";
			}
			//// Título de la capa ////////////
			var tituloTodo = capa.titulo;
			var tituloTodoV = tituloTodo.split(";");
			capa.titulo = "";
			if (tituloTodoV.length > 1) {
				if (IDEVAPI_global.idioma == "va") { capa.titulo = tituloTodoV[1]; } else if (IDEVAPI_global.idioma == "es") { capa.titulo = tituloTodoV[0]; } else { if (tituloTodoV[2] !== undefined) { capa.titulo = tituloTodoV[2]; } }
			} else {
				capa.titulo = tituloTodo;
			}
			/////// URL o id. servicio de origen ///////////
			//var capas = capa.capas;
			if (capa.capas == undefined || capa.capas == null || capa.capas == "" || capa.capas == "null") {
				capa.capas = null;
			}
			capa.capasAGS = "";
			if (capa.capas != null && capa.capas.split(",").length > 1) {
				capa.capasAGS = capa.capas.split(",")[1];
				capa.capas = capa.capas.split(",")[0];
			}
			//Opacidad de la capa
			if (capa.opacidad == undefined || capa.opacidad == null || capa.opacidad == "" || capa.opacidad == "null") {
				capa.opacidad = 1;
			}
			if (Number.isNaN(Number(capa.opacidad))) { capa.opacidad = 1; }
			///////////// Visible TOC //////////////////
			if (capa.TOCVisible != false && (capa.TOCVisible == undefined || capa.TOCVisible == null || capa.TOCVisible == "" || capa.TOCVisible == "null")) {
				capa.TOCVisible = true;
			}
			//////////// Niveles TOC /////////
			//var grupo = capa[5];
			if (capa.TOCNivel1 !== undefined && capa.TOCNivel1 !== null && capa.TOCNivel1 !== "" && capa.TOCNivel1 !== "null") {
				var grupo = capa.TOCNivel1;
				var grupoTodoV = grupo.split(";");
				capa.TOCNivel1 = "";
				if (grupoTodoV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { capa.TOCNivel1 = grupoTodoV[1]; } else if (IDEVAPI_global.idioma == "es") { capa.TOCNivel1 = grupoTodoV[0]; } else { if (grupoTodoV[2] !== undefined) { capa.TOCNivel1 = grupoTodoV[2]; } }
				} else {
					capa.TOCNivel1 = grupo;
				}
				if (typeof capa.TOCNivel1 === "string" && capa.TOCNivel1.trim() === "") {
					capa.TOCNivel1 = null;
				}
			} else {
				capa.TOCNivel1 = null;
			}
			if (capa.TOCNivel2 !== undefined && capa.TOCNivel2 !== null && capa.TOCNivel2 !== "" && capa.TOCNivel2 !== "null") {
				var nombreServicio = capa.TOCNivel2;
				var servicioTodoV = nombreServicio.split(";");
				capa.TOCNivel2 = "";
				if (servicioTodoV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { capa.TOCNivel2 = servicioTodoV[1]; } else if (IDEVAPI_global.idioma == "es") { capa.TOCNivel2 = servicioTodoV[0]; } else { if (servicioTodoV[2] !== undefined) { capa.TOCNivel2 = servicioTodoV[2]; } }
				} else {
					capa.TOCNivel2 = nombreServicio;
				}
				if (typeof capa.TOCNivel2 === "string" && capa.TOCNivel2.trim() === "") {
					capa.TOCNivel2 = null;
				}
			} else {
				capa.TOCNivel2 = null;
			}
			///////////// Grupo TOC Desplegado //////////////////
			if (capa.TOCDesplegado === undefined || capa.TOCDesplegado === null || capa.TOCDesplegado === "" || capa.TOCDesplegado === "null") {
				capa.TOCDesplegado = false;
			} else {
				capa.TOCDesplegado = (capa.TOCDesplegado === true || capa.TOCDesplegado === "true");
			}
			///////////// Capa Visible Inicialmente //////////////////
			if (capa.visibleInicio != false && (capa.visibleInicio == undefined || capa.visibleInicio == null || capa.visibleInicio == "" || capa.visibleInicio == "null")) {
				if (IDEVAPI[p].tipoArbol == "Checkbox") {
					capa.visibleInicio = true;
				} else {
					capa.visibleInicio = false;
				}
			}

			///// WIDGET Control de OPACIDAD /////////
			if (capa.wgOpacidad != true && (capa.wgOpacidad == undefined || capa.wgOpacidad == null || capa.wgOpacidad == "" || capa.wgOpacidad == "null")) {
				capa.wgOpacidad = false;
			}
			///// TABLA INFO /////
			if (capa.tablaInfo == undefined || capa.tablaInfo == null || capa.tablaInfo == "" || capa.tablaInfo == "null") {
				capa.tablaInfo = { activo: false };
			}
			if (capa.tablaInfo.activo != false && (capa.tablaInfo.activo == undefined || capa.tablaInfo.activo == null || capa.tablaInfo.activo == "" || capa.tablaInfo.activo == "null")) {
				capa.tablaInfo.activo = true;
			}
			///////////// Habilitar/deshabilitar INFO //////////////////
			// Estilo
			if (capa.tablaInfo.estilo == undefined || capa.tablaInfo.estilo == null || capa.tablaInfo.estilo == "" || capa.tablaInfo.estilo == "null") {
				capa.tablaInfo.estilo = "";
			}
			// Mostrar NombreCampos
			if (capa.tablaInfo.mostrarNombreCampos != false && (capa.tablaInfo.mostrarNombreCampos == undefined || capa.tablaInfo.mostrarNombreCampos == null || capa.tablaInfo.mostrarNombreCampos == "" || capa.tablaInfo.mostrarNombreCampos == "null")) {
				capa.tablaInfo.mostrarNombreCampos = true;
			}
			// Titulo
			if (capa.tablaInfo.titulo == undefined || capa.tablaInfo.titulo == null || capa.tablaInfo.titulo == "" || capa.tablaInfo.titulo == "null") {
				capa.tablaInfo.titulo = "";
			} else if (capa.tablaInfo.titulo == "IDEVAPI_Capa") {
				capa.tablaInfo.titulo = capa.titulo;
			} else {
				var tituloV = capa.tablaInfo.titulo.split(";");
				if (tituloV.length > 1) {
					if (IDEVAPI_global.idioma == "va") { capa.tablaInfo.titulo = tituloV[1]; } else if (IDEVAPI_global.idioma == "es") { capa.tablaInfo.titulo = tituloV[0]; } else { if (tituloV[2] !== undefined) { capa.tablaInfo.titulo = tituloV[2]; } }
				}
			}
			// ALIAS. Deja solo los campos y valores del idioma del visor
			if ((capa.tablaInfo.alias !== undefined) && (capa.tablaInfo.alias !== "")) {
				var aliasAux = {};
				for (var prop in capa.tablaInfo.alias) {
					//Cambia Propiedad (campo) según idioma
					var idiomaProp = "";
					var prefijo = "";
					var sufijo = "";
					var formatoCampo = "";

					if (prop.split("|").length > 1) {
						var valoresCampos = prop.split("|")[0]; //Cogemos solo los valores de los campos (No cogemos las propiedades)
						var propCampo = prop.split("|")[1]; //Cogemos solo los valores de los campos (No cogemos las propiedades)
						//prefijo = propCampo.split(";")[0];
						//sufijo = propCampo.split(";")[1];
						formatoCampo = "|" + propCampo;
					} else {
						var valoresCampos = prop;
					}
					var valoresCamposV = valoresCampos.split(";");
					if (valoresCampos.split(";").length > 1) {
						if (IDEVAPI_global.idioma == "es") { idiomaProp = valoresCamposV[0] + formatoCampo; } else if (IDEVAPI_global.idioma == "va") { idiomaProp = valoresCamposV[1] + formatoCampo; } else { idiomaProp = valoresCamposV[1] + formatoCampo; }
					} else {
						//Si no hay definido varios campos
						idiomaProp = valoresCampos + formatoCampo;
					}


					//Cambia el alias definido según idioma
					var aliasCamposV = capa.tablaInfo.alias[prop].split(";");
					var alias = "";
					if (aliasCamposV.length > 1) {
						if (IDEVAPI_global.idioma == "va") { alias = aliasCamposV[1]; } else if (IDEVAPI_global.idioma == "es") { alias = aliasCamposV[0]; } else { if (aliasCamposV[2] !== undefined) { alias = aliasCamposV[2]; } }
					} else {
						alias = capa.tablaInfo.alias[prop];
					}
					//Se rellenan valores nuevos en aliasAux
					aliasAux[idiomaProp] = alias;
				}
				//Se machaca la propiedad "alias" que tenía todos los campos por idiomas, con el nombre del campo que toca (solo el idioma actual del visor)
				capa.tablaInfo.alias = aliasAux;
			}
			// ESTILO CAMPO. Define el nombre del CLASS a aplicar al texto del campo
			if ((capa.tablaInfo.estiloCampo !== undefined) && (capa.tablaInfo.estiloCampo !== "")) {
				var estiloCampoAux = {};
				for (var prop in capa.tablaInfo.estiloCampo) {
					//Cambia Propiedad (campo) según idioma
					var idiomaProp = "";
					if (prop.split(";").length > 1) {
						if (IDEVAPI_global.idioma == "es") { idiomaProp = prop.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { idiomaProp = prop.split(";")[1]; } else { idiomaProp = prop.split(";")[1]; }
					} else {
						//Si no hay definido varios campos
						idiomaProp = prop;
					}

					//Se rellenan valores de los estilos
					estiloCampoAux[idiomaProp] = capa.tablaInfo.estiloCampo[prop];
				}
				//Se machaca la propiedad "alias" que tenía todos los campos por idiomas, con el nombre del campo que toca (solo el idioma actual del visor)
				capa.tablaInfo.estiloCampo = estiloCampoAux;
			}
			if (capa.tablaInfo.ancho == undefined || capa.tablaInfo.ancho == null || capa.tablaInfo.ancho == "" || capa.tablaInfo.ancho == "null") {
				capa.tablaInfo.ancho = 300;
			}
			if (capa.tablaInfo.ancho < 0) {
				capa.tablaInfo.ancho = 300;
			}
			if (capa.tablaInfo.template == undefined || capa.tablaInfo.template == null || capa.tablaInfo.template == "" || capa.tablaInfo.template == "null") {
				capa.tablaInfo.template = null;
			}
			//////// LEYENDA //////////
			if (capa.leyenda == undefined || capa.leyenda == null || capa.leyenda == "" || capa.leyenda == "null") {
				capa.leyenda = { activo: false };
			}
			//Mostrar Leyenda
			if (capa.leyenda.activo != false && (capa.leyenda.activo == undefined || capa.leyenda.activo == null || capa.leyenda.activo == "" || capa.leyenda.activo == "null")) {
				capa.leyenda.activo = true;
			}
			//Tipo Leyenda (por defecto "")
			if (capa.leyenda.tipo == undefined || capa.leyenda.tipo == null || capa.leyenda.tipo == "" || capa.leyenda.tipo == "null") {
				capa.leyenda.tipo = "";
			}
			//Título Leyenda (por defecto capa). Si es "", no se muestra título de la leyenda
			if (capa.leyenda.titulo == undefined || capa.leyenda.titulo == null || capa.leyenda.titulo == "null") {
				capa.leyenda.titulo = capa.titulo;
			} else {
				if (capa.leyenda.titulo.split(";").length > 1) {
					if (IDEVAPI_global.idioma == "es") { capa.leyenda.titulo = capa.leyenda.titulo.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { capa.leyenda.titulo = capa.leyenda.titulo.split(";")[1]; } else { capa.leyenda.titulo = capa.leyenda.titulo.split(";")[1]; }
				}
			}
			//Disposición Leyenda (Horizontal o vertical) (9)
			if (capa.leyenda.alineacion == undefined || capa.leyenda.alineacion == null || capa.leyenda.alineacion == "" || capa.leyenda.alineacion == "null") {
				capa.leyenda.alineacion = "horizontal";
			}
			///// ACTUALIZACIÓN DE DATOS //////////
			if (!$.isNumeric(capa.actualizaDatos) && (capa.actualizaDatos == undefined || capa.actualizaDatos == null || capa.actualizaDatos == "" || capa.actualizaDatos == "null")) {
				capa.actualizaDatos = 0;
			}

			switch (capa.tipo) {
				/////////////////////////// Recorrido CAPAS WMS ////////////////////////////////
				case "WMS":
					var urlControlPopup = capa.servicio.url;
					//TABLA asociada (8)
					var sinTabla = false;
					var datosTabla;
					if (capa.tabla == undefined || capa.tabla == null || capa.tabla == "" || capa.tabla == "null") {
						sinTabla = true;
					} else {
						datosTabla = capa.tabla;
						if (datosTabla.visibleInicio == undefined || datosTabla.visibleInicio == null || datosTabla.visibleInicio == "" || datosTabla.visibleInicio == "null") {
							datosTabla.visibleInicio = false;
						}
						if (!capa.tabla.url) {
							datosTabla.url = capa.servicio.url;
						}
						datosTabla.mapaId = map.id;
					}

					//En caso de servicios MapServer sin Alias
					if (capa.servicio.url.indexOf("?") !== -1) { capa.servicio.url = capa.servicio.url + "&"; } else { capa.servicio.url = capa.servicio.url + "?"; }
					if (capa.servicio.usarProxy) {
						capa.servicio.url = proxyIDEVAPI + "?" + capa.servicio.url;
					}

					if (capa.capasAGS !== "") {
						var idCapaAux = capa.servicio.id + ";" + capa.capasAGS;
					} else {
						var idCapaAux = capa.servicio.id + ";" + capa.capas;
					}

					if (map.getPane("capaWMS|" + idCapaAux + "|" + (paneZIndexCapas - i)) == undefined) {
						map.createPane("capaWMS|" + idCapaAux + "|" + (paneZIndexCapas - i));
						map.getPane("capaWMS|" + idCapaAux + "|" + (paneZIndexCapas - i)).style.zIndex = (paneZIndexCapas - i);
					}

					//console.log(idiomaISO639_2);
					var opcionesWMS = {
						pane: "capaWMS|" + idCapaAux + "|" + (paneZIndexCapas - i),
						titulo: capa.titulo,
						maxZoom: 20,
						format: capa.servicio.formato,
						styles: capa.servicio.estilo,
						transparent: true,
						opacity: capa.opacidad,
						version: capa.servicio.version,
						info_format: "text/html",
						feature_count: "150",
						language: idiomaISO639_2,
						identify: capa.tablaInfo.activo,
						modificarPopup: { url: urlControlPopup, titulo: capa.titulo, tablaInfo: capa.tablaInfo, tipo: "WMS" }
					}
					//Si el servicio tiene user+password, se añaden como parámetros en el WMS
					if (capa.servicio.usuario !== undefined && capa.servicio.password !== undefined) {
						opcionesWMS.usuario = capa.servicio.usuario;
						opcionesWMS.password = capa.servicio.password;
					}
					var capaWMS = null;

					if (capa.timeDimension === true) {
						opcionesWMS = $.extend(opcionesWMS, {
							layers: capa.capas
						})

						let capaSinTimeDimensionWMS = L.nonTiledLayer.wms(capa.servicio.url, opcionesWMS);
						capaWMS = L.timeDimension.layer.wms(capaSinTimeDimensionWMS, { formatDate: capa.formatoFecha });
					}
					else {
						var source = new MySource(capa.servicio.url, opcionesWMS);
						capaWMS = source.getLayer(capa.capas);
					}
					//*****************Añadimos nuevas propiedades a las capas ********
					capaWMS.id = idCapaAux;
					capaWMS.titulo = capa.titulo;
					capaWMS.origen = capa.servicio.origen;
					capaWMS.visibleInicio = capa.visibleInicio;
					capaWMS.opacidad = capa.opacidad;
					capaWMS.url = capa.servicio.url;
					capaWMS.tipoServicio = capa.tipo;
					capaWMS.versionServicio = capa.servicio.version;
					capaWMS.estiloServicio = capa.servicio.estilo;
					capaWMS.idVisor = capa.servicio.idVisor;
					capaWMS.grupo = capa.TOCNivel1;
					capaWMS.controlarOpacidad = capa.wgOpacidad;
					if (!sinTabla) {
						capaWMS.datosTabla = datosTabla;
					}
					capaWMS.tablaInfo = capa.tablaInfo;
					capaWMS.leyenda = capa.leyenda;
					capaWMS.ordenLeyenda = i;
					capaWMS.actualizaDatos = capa.actualizaDatos;
					capaWMS.timeDimension = capa.timeDimension;
					capaWMS.TOCDesplegado = capa.TOCDesplegado;
					//*************Control GetFeatureInfo*****************************************************
					/*if (capa.tablaInfo.activo) {
						controlGetFeatureInfo.numCapasInfo++;
					}*/
					//************************************** */
					controlCapa.numCapasCargadas++;
					//map.addLayer(capaWMS);
					//GCapasWMS.addLayer(capaWMS);
					//toc.addOverlay(capaWMS,titulo);
					if (capa.TOCNivel1 !== null) {
						if (capa.TOCNivel2 !== null) {
							capasAHojas(tipoArbol, controlCapa.servicios, capa.TOCNivel2, capa.TOCNivel1, capaWMS, capa.titulo, i, controlCapa.GCapasTree, controlCapa.capasOpacidad, controlCapa.tocKeySinNivel2);
						} else {
							capasAHojas(tipoArbol, controlCapa.servicios, capa.TOCNivel1, null, capaWMS, capa.titulo, i, controlCapa.GCapasTree, controlCapa.capasOpacidad, controlCapa.tocKeySinNivel2);
						}
					} else {
						if (capa.TOCVisible) {
							registraCapaSueltaTOC(controlCapa.servicios, tipoArbol, capa.titulo, capaWMS, i);
						}

						if (tipoArbol == "RadioButton") {
							// Las capas del árbol tipo radio no se añaden al mapa en este momento;
							// se controlan mediante el radio button (solo una activa a la vez).
							controlCapa.GCapasTree.addLayer(capaWMS);
						} else {
							controlCapa.GCapasWMS.addLayer(capaWMS);
						}

						capaWMS.label = capa.titulo;
						if (capa.wgOpacidad) {
							//controlCapa.capasOpacidad[capaWMS.titulo] = capaWMS;
						}
					}
					//toc.addOverlay(GCapasWMS,titulo);
					break;
				/////////////////////////// Recorrido CAPAS WMTS ////////////////////////////////
				case "WMTS":
					var idCapaAuxWMTS = capa.servicio.id + ";" + capa.capas;

					if (map.getPane("capaWMTS|" + idCapaAuxWMTS + "|" + (paneZIndexCapas - i)) == undefined) {
						map.createPane("capaWMTS|" + idCapaAuxWMTS + "|" + (paneZIndexCapas - i));
						map.getPane("capaWMTS|" + idCapaAuxWMTS + "|" + (paneZIndexCapas - i)).style.zIndex = (paneZIndexCapas - i);
					}

					var capaWMTS = new L.tileLayer(capa.servicio.url + "?service=WMTS&request=GetTile&version=1.0.0&layer=" + capa.capas + "&style=default&format=" + capa.servicio.formato + "&TileMatrixSet=GMEPSG3857&TileMatrix={z}&TileRow={y}&TileCol={x}", {
						maxZoom: 20,
						pane: "capaWMTS|" + idCapaAuxWMTS + "|" + (paneZIndexCapas - i)
					});
					capaWMTS.titulo = capa.titulo;
					capaWMTS.origen = capa.servicio.origen;
					capaWMTS.opacidad = capa.opacidad;
					capaWMTS.url = capa.servicio.url;
					capaWMTS.tipoServicio = capa.tipo;
					capaWMTS.grupo = capa.TOCNivel1;
					capaWMTS.controlarOpacidad = capa.wgOpacidad;
					capaWMTS.visibleInicio = capa.visibleInicio;
					capaWMTS.layer = capa.capas;
					capaWMTS.ordenLeyenda = i;

					controlCapa.numCapasCargadas++;

					if (capa.TOCVisible) {
						registraCapaSueltaTOC(controlCapa.servicios, tipoArbol, capa.titulo, capaWMTS, i);
					}
					controlCapa.GCapasWMTS.addLayer(capaWMTS);
					capaWMTS.label = capa.titulo;
					if (capa.wgOpacidad) {
						controlCapa.capasOpacidad[capaWMTS.titulo] = capaWMTS;
					}
					break;
				/////////////////////////// Recorrido CAPAS GeoJSON ////////////////////////////////
				case "GeoJSON":
					///// Id. de la capa ////
					var idCapa = capa.servicio.id + ";" + capa.capas;
					///// Convierte a objeto JSON el estilo /////
					var estiloPuntoDefault = {
						radius: 6,
						stroke: true,
						weight: 1,
						opacity: 1,
						color: 'rgb(0,0,0)',
						fill: true,
						fillColor: 'rgb(255,255,255)',
						fillOpacity: 1
					};
					if (capa.estilo == undefined || capa.estilo == null || capa.estilo == "" || capa.estilo == "null") {
						capa.estilo = [[estiloPuntoDefault]];
					} else if (capa.estilo.length == undefined) {
						capa.estilo = [[capa.estilo]];
					} else if (capa.estilo[0].length == undefined) {
						capa.estilo = [capa.estilo];
					}
					// ORDEN DE VISUALIZACIÓN POR VALOR CAMPO
					if (capa.ordenVis == undefined || capa.ordenVis == null || capa.ordenVis == "" || capa.ordenVis == "null") {
						capa.ordenVis = { activo: false };
					} else if (typeof capa.ordenVis !== 'object') {
						capa.ordenVis = { activo: false };
					}
					// ETIQUETAS
					if (capa.etiqueta == undefined || capa.etiqueta == null || capa.etiqueta == "" || capa.etiqueta == "null") {
						capa.etiqueta = { activo: false };
					} else if (typeof capa.etiqueta !== 'object') {
						capa.etiqueta = { activo: false };
					}
					if (capa.etiqueta.clases == undefined || capa.etiqueta.clases == null || capa.etiqueta.clases == "" || capa.etiqueta.clases == "null") {
						capa.etiqueta.clases = "";
					}
					//Se añaden las clases de las etiquetas a la página web
					if (capa.etiqueta.clases !== "") {
						for (var i = 0; i < capa.etiqueta.clases.length; i++) {
							if (capa.etiqueta.clases[i].estiloCSS == undefined || capa.etiqueta.clases[i].estiloCSS == null || capa.etiqueta.clases[i].estiloCSS == "" || capa.etiqueta.clases[i].estiloCSS == "null") {
								//Se añade la class al visor para usar el estilo a aplicar al texto
								capa.etiqueta.clases[i].estiloCSS = "";
							}
							if (capa.etiqueta.clases[i].opacidad == undefined || capa.etiqueta.clases[i].opacidad == null || capa.etiqueta.clases[i].opacidad == "" || capa.etiqueta.clases[i].opacidad == "null") {
								//Se añade la class al visor para usar el estilo a aplicar al texto
								capa.etiqueta.clases[i].opacidad = 1;
							}
							//Toda la capa tiene el mismo estilo de etiqueta
							if (capa.etiqueta.clases[i].clase == undefined) {
								//Se añade la class al visor para usar el estilo a aplicar al texto
								$('head').append('<style type="text/css">.estiloEtiquetas_' + capa.etiqueta.clases[i].campo + ' {' + capa.etiqueta.clases[i].estiloCSS + '}</style>');
							}
							//Los estilo de etiqueta dependen de lo definido en etiqueta.clases.clase [campo,valor]
							//} else if (feature.properties[capa.etiqueta.clases[i].clase[0]] == capa.etiqueta.clases[i].clase[1]) {
							//	$('head').append('<style type="text/css">.estiloEtiquetas_' + capa.etiqueta.clases[i].clase[0] + capa.etiqueta.clases[i].clase[1] + ' {' + capa.etiqueta.clases[i].estiloCSS + '}</style>');
							//}
						}
					}
					///// CLUSTER /////
					// Si no existe el objeto capa.cluster
					if (capa.cluster == undefined || capa.cluster == null || capa.cluster == "" || capa.cluster == "null") {
						capa.cluster = {};
						capa.cluster.activo = false
					}
					///// Mostrar capa en CLUSTER?
					if (capa.cluster.activo == undefined || capa.cluster.activo == null || capa.cluster.activo == "" || capa.cluster.activo == "null") {
						capa.cluster.activo = false;
					}
					// SPIDERFY
					if (capa.cluster.spiderfy === undefined || capa.cluster.spiderfy === null || capa.cluster.spiderfy === "" || capa.cluster.spiderfy === "null") {
						capa.cluster.spiderfy = true;
					}
					// Mostrar CLUSTER 1 ELEMENTO
					if (capa.cluster.mostrar1Elem == undefined || capa.cluster.mostrar1Elem == null || capa.cluster.mostrar1Elem == "" || capa.cluster.mostrar1Elem == "null") {
						capa.cluster.mostrar1Elem = false;
					}
					// COLOR Interior Cluster
					if (capa.cluster.colorInterior == undefined || capa.cluster.colorInterior == null || capa.cluster.colorInterior == "" || capa.cluster.colorInterior == "null") {
						capa.cluster.colorInterior = 'rgb(0,0,0)';
					}
					// COLOR Exterior Cluster
					if (capa.cluster.colorExterior == undefined || capa.cluster.colorExterior == null || capa.cluster.colorExterior == "" || capa.cluster.colorExterior == "null") {
						capa.cluster.colorExterior = 'rgb(0,0,0)';
					}
					// OPACIDAD Exterior Cluster
					if (capa.cluster.opacidadExterior == undefined || capa.cluster.opacidadExterior == null || capa.cluster.opacidadExterior == "" || capa.cluster.opacidadExterior == "null") {
						capa.cluster.opacidadExterior = 0.6;
					}
					// COLOR Texto Cluster
					if (capa.cluster.colorTxt == undefined || capa.cluster.colorTxt == null || capa.cluster.colorTxt == "" || capa.cluster.colorTxt == "null") {
						capa.cluster.colorTxt = 'rgb(255,255,255)';
					}
					// Radio máximo del cluster para agrupar (radio)
					if (capa.cluster.radio == undefined || capa.cluster.radio == null || capa.cluster.radio == "" || capa.cluster.radio == "null") {
						capa.cluster.radio = 40;
					}
					// Tamaño visual del cluster
					if (capa.cluster.tamaño == undefined || capa.cluster.tamaño == null || capa.cluster.tamaño == "" || capa.cluster.tamaño == "null") {
						capa.cluster.tamaño = 40;
					} else {
						if (capa.cluster.tamaño > 100) { capa.cluster.tamaño = 100; } else if (capa.cluster.tamaño < 22) { capa.cluster.tamaño = 22; }
					}
					// Título en la leyenda del Cluster
					if (capa.cluster.tituloLeyenda == undefined || capa.cluster.tituloLeyenda == null || capa.cluster.tituloLeyenda == "" || capa.cluster.tituloLeyenda == "null") {
						capa.cluster.tituloLeyenda = '';
					} else {
						if (capa.cluster.tituloLeyenda.split(";").length > 1) {
							if (IDEVAPI_global.idioma == "es") { capa.cluster.tituloLeyenda = capa.cluster.tituloLeyenda.split(";")[0]; } else if (IDEVAPI_global.idioma == "va") { capa.cluster.tituloLeyenda = capa.cluster.tituloLeyenda.split(";")[1]; } else { capa.cluster.tituloLeyenda = capa.cluster.tituloLeyenda.split(";")[1]; }
						}
					}
					///// TABLA asociada /////
					var datosTabla;
					if (capa.tabla == undefined) {
						datosTabla = undefined;
					} else {
						datosTabla = capa.tabla;
						if (datosTabla.visibleInicio == undefined || datosTabla.visibleInicio == null || datosTabla.visibleInicio == "" || datosTabla.visibleInicio == "null") {
							datosTabla.visibleInicio = false;
						}
						datosTabla.url = capa.servicio.url;
						datosTabla.mapaId = map.id;
					}
					///// SELECTS PARA FILTRAR LA CAPA /////
					if (capa.filtro == undefined || capa.filtro == null || capa.filtro == "" || capa.filtro == "null") {
						capa.filtro = { selects: [] }
					}
					if (capa.filtro.selects == undefined || capa.filtro.selects == null || capa.filtro.selects == "" || capa.filtro.selects == "null") {
						capa.filtro.selects = [];
					}
					if (capa.filtro.inputs == undefined || capa.filtro.inputs == null || capa.filtro.inputs == "" || capa.filtro.inputs == "null") {
						capa.filtro.inputs = [];
					}

					capa.filtro.inputs.forEach(function (inp) {
						//Cambia valores según idioma
						if (inp.campo.split(";").length > 1) {
							if (IDEVAPI_global.idioma == "es") {
								inp.campo = inp.campo.split(";")[0];
							} else if (IDEVAPI_global.idioma == "va") {
								inp.campo = inp.campo.split(";")[1];
							} else {
								// FIXME (PAUPER, 2026-03-16): P-15 corregido — antes era inp[1] (acc. por índice a obj)
								inp.campo = inp.campo.split(";")[1];
							}
						}
						if (inp.valorDefecto !== undefined) {
							if (inp.tipo == 'texto') {
								if (inp.valorDefecto.split(";").length > 1) {
									if (IDEVAPI_global.idioma == "es") {
										inp.valorDefecto = inp.valorDefecto.split(";")[0];
									} else if (IDEVAPI_global.idioma == "va") {
										inp.valorDefecto = inp.valorDefecto.split(";")[1];
									} else {
										// FIXME (PAUPER, 2026-03-16): P-15 corregido — antes era inp[1]
										inp.valorDefecto = inp.valorDefecto.split(";")[1];
									}
								}
							}
						}
					});


					capa.filtro.selects.forEach(function (sel) {
						//Cambia valores según idioma
						if (sel.campo.split(";").length > 1) {
							if (IDEVAPI_global.idioma == "es") {
								sel.campo = sel.campo.split(";")[0];
							} else if (IDEVAPI_global.idioma == "va") {
								sel.campo = sel.campo.split(";")[1];
							} else {
								// FIXME (PAUPER, 2026-03-16): P-15 corregido — antes era sel[1]
								sel.campo = sel.campo.split(";")[1];
							}
						}
						if (sel.valorDefecto !== undefined) {
							if (sel.valorDefecto.split(";").length > 1) {
								if (IDEVAPI_global.idioma == "es") {
									sel.valorDefecto = sel.valorDefecto.split(";")[0];
								} else if (IDEVAPI_global.idioma == "va") {
									sel.valorDefecto = sel.valorDefecto.split(";")[1];
								} else {
									inp[1] = inp[1].split(";")[1];
								}
							}
						}
						//Extrae valores únicos del campo definido en el select
						if (sel.orden == undefined) {
							sel.orden = 'ASC'
						} else if (sel.orden !== 'ASC' && sel.orden !== 'DES') {
							sel.orden = '';
						}
					});
					if (capa.filtro.zoom != false && (capa.filtro.zoom == undefined || capa.filtro.zoom == null || capa.filtro.zoom == "" || capa.filtro.zoom == "null")) {
						capa.filtro.zoom = false;
					}
					/*
					// Div para mostrar Número total de elementos filtrados
					if (capa.filtro.mostrarNumTotal == undefined || capa.filtro.mostrarNumTotal == null || capa.filtro.mostrarNumTotal == "" || capa.filtro.mostrarNumTotal == "null"){
						capa.filtro.mostrarNumTotal = null;
					}
					// Div para mostrar Número total de elementos filtrados y visibles
					if (capa.filtro.mostrarNumVisibles == undefined || capa.filtro.mostrarNumVisibles == null || capa.filtro.mostrarNumVisibles == "" || capa.filtro.mostrarNumVisibles == "null"){
						capa.filtro.mostrarNumVisibles = null;
					}
					*/
					// Flitro inicial a aplicar al GeoJSON
					if (capa.filtroInicial == undefined || capa.filtroInicial == null || capa.filtroInicial == "" || capa.filtroInicial == "null") {
						capa.filtroInicial = null;
					} else if (capa.filtroInicial.length == undefined) {
						capa.filtroInicial = [[capa.filtroInicial]];
					} else if (capa.filtroInicial[0].length == undefined) {
						capa.filtroInicial = [capa.filtroInicial];
					}
					// Limpiar filtro
					if (capa.filtro.botonLimpiar == undefined || capa.filtro.botonLimpiar == null || capa.filtro.botonLimpiar == "" || capa.filtro.botonLimpiar == "null") {
						capa.filtro.botonLimpiar = null;
					}
					//paramsGeoJSON.filtroSelects = capa.filtroSelects;
					//******* CAPAS GeoJSON - Origen AGS *******
					if (capa.servicio.origen == "AGS") {
						capa.servicio.url = capa.servicio.url.replace("/arcgis/services/", "/arcgis/rest/services/").replace("/MapServer/WMSServer", "/MapServer");
						var consulta = "where=1=1&outFields=*&f=geojson";
						//var consulta = "where=mun_nombre LIKE 'Valencia'&outFields=*&f=geojson&resultRecordCount=100";
						controlCapa.promesas[controlCapa.contadorPromesas] = new Promise(function (resolve, reject) {
							controlCapa.numCapasCargadas++;
							var peticionAGS = $.ajax({
								url: encodeURI(capa.servicio.url + "/" + capa.capas + "/query?" + consulta)
							});
							peticionAGS.done(function (data) {
								añadeCapaGeoJSON(i, map, idCapa, data, capa, tipoArbol, controlCapa.servicios, controlCapa.GCapasGeoJSON, controlCapa.capasNormal, datosTabla, controlCapa);
								resolve();
							});
							peticionAGS.fail(function (jqXHR, textStatus) {
								alert(MENSAJES.ErrorAGS + textStatus);
								resolve();
							});
						});
						controlCapa.contadorPromesas++;
						//******* CAPAS GeoJSON - Origen MS *******
					} else if (capa.servicio.origen == "MS") {
						//Filtro inicial a la capa (se realiza sobre la petición al WFS)
						if (capa.filtroInicial !== null) {
							var filtroFE = "";
							if (capa.filtroInicial.length > 1) {
								var filtroFEPre = "<Filter><OR>";
								var filtroFESuf = "</OR></Filter>";
							} else if (capa.filtroInicial.length == 1) {
								var filtroFEPre = "<Filter>";
								var filtroFESuf = "</Filter>";
							}
							for (var i = 0; i < capa.filtroInicial.length; i++) {
								var campo = capa.filtroInicial[i][0];
								var valor = capa.filtroInicial[i][1];
								var tipo = capa.filtroInicial[i][2];

								if (tipo == "like") {
									filtroFE += "<PropertyIsLike wildcard='*' singleChar='.' escape='!'><PropertyName>" + campo + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsLike>";
								} else {
									filtroFE += "<PropertyIsEqualTo><PropertyName>" + campo + "</PropertyName><Literal>" + valor + "</Literal></PropertyIsEqualTo>";
								}
							}
							filtroFE = filtroFEPre + filtroFE + filtroFESuf;

						} else {
							var filtroFE = undefined;
						}
						capa.filtroInicial = filtroFE;

						var opcionesGeoJSONWFS = {
							service: 'WFS',
							request: 'GetFeature',
							version: '2.0.0',
							typenames: 'ms:' + capa.capas,
							outputFormat: 'geojsonstream',
							srsName: 'EPSG:4326',
							filter: capa.filtroInicial
						}
						//Si el servicio tiene user+password, se añaden como parámetros en el WMS
						if (capa.servicio.usuario !== undefined && capa.servicio.password !== undefined) {
							opcionesGeoJSONWFS.usuario = capa.servicio.usuario;
							opcionesGeoJSONWFS.password = capa.servicio.password;
						}

						controlCapa.promesas[controlCapa.contadorPromesas] = new Promise(function (resolve, reject) {
							controlCapa.numCapasCargadas++;
							var peticionPG = $.ajax({
								url: capa.servicio.url,
								type: "GET",
								data: opcionesGeoJSONWFS,
								dataType: "json"
							});
							/*var peticionPG = $.ajax({
								url:  capa.servicio.url,
								type: "GET",
								data: {
									'service':'WFS',
									'request':'GetFeature',
									'version':'2.0.0',
									'typenames':'ms:' + capa.capas,
									'outputFormat': 'geojson',
									'srsName': 'EPSG:4326',
									'filter' : capa.filtroInicial
								}, //campo donde realizar la búsqueda : valor de búsqueda
								dataType: "json"
							});*/

							peticionPG.done(function (data) {
								añadeCapaGeoJSON(i, map, idCapa, data, capa, tipoArbol, controlCapa.servicios, controlCapa.GCapasGeoJSON, controlCapa.capasNormal, datosTabla, controlCapa);
								resolve();
							});
							peticionPG.fail(function (jqXHR, textStatus) {
								if (capa.servicio.usuario !== undefined && capa.servicio.password !== undefined) {
									alert(MENSAJES.ErrorUsuarioPassword);
								} else {
									alert(MENSAJES.ErrorGeoJSON + textStatus);
								}
								resolve();
							});
						});
						controlCapa.contadorPromesas++;

					} else if (capa.servicio.origen == "GeoJSON") {
						if (capa.servicio.url == "IDEVAPI_Local") {
							if (capa.servicio.datos !== "") {
								// Soporte para objeto directo o nombre de variable global
								var dataLocal;
								if (typeof capa.servicio.datos === 'object' && capa.servicio.datos !== null) {
									dataLocal = capa.servicio.datos;
								} else if (window[capa.servicio.datos] !== undefined) {
									dataLocal = window[capa.servicio.datos];
								}

								if (dataLocal !== undefined) {
									var resTotalLocal = dataLocal;

									// FILTRO INICIAL si existe para datos locales
									if (capa.filtroInicial !== null) {
										var resTotal = [];
										for (var j = 0; j < capa.filtroInicial.length; j++) {
											var campo = capa.filtroInicial[j][0];
											var valor = capa.filtroInicial[j][1];
											var tipo = capa.filtroInicial[j][2];
											var datosParciales = filtroGeoJSON(dataLocal, campo, valor, tipo);
											resTotal = resTotal.concat(datosParciales.features);
										}
										if (resTotal.length > 0) {
											resTotalLocal = {
												type: "FeatureCollection",
												features: resTotal
											};
										} else {
											resTotalLocal = {
												type: "FeatureCollection",
												features: []
											};
										}
									}

									añadeCapaGeoJSON(i, map, idCapa, resTotalLocal, capa, tipoArbol, controlCapa.servicios, controlCapa.GCapasGeoJSON, controlCapa.capasNormal, datosTabla, controlCapa);
									controlCapa.numCapasCargadas++;
								} else {
									alert(MENSAJES.GeoJSONNoDefinido);
								}
							}
						} else {
							controlCapa.promesas[controlCapa.contadorPromesas] = new Promise(function (resolve, reject) {
								controlCapa.numCapasCargadas++;
								var peticionGJ = $.ajax({
									//url:  proxyICV + capa.servicioURL,
									url: capa.servicio.url,
									dataType: "json"
								});
								peticionGJ.done(function (data) {
									// FILTRO INICIAL si existe//
									if (capa.filtroInicial !== null) {
										//var resultados = data.features;
										var resTotal = [];
										for (var j = 0; j < capa.filtroInicial.length; j++) {
											var campo = capa.filtroInicial[j][0];
											var valor = capa.filtroInicial[j][1];
											var tipo = capa.filtroInicial[j][2];
											var datosParciales = filtroGeoJSON(data, campo, valor, tipo);
											resTotal = resTotal.concat(datosParciales.features);
										}
										if (resTotal.length > 0) {
											var resTotal2 = {};
											resTotal2.type = "FeatureCollection";
											resTotal2.features = resTotal;
										}
									} else {
										resTotal2 = data;
									}
									// MODIFICACIÓN COORDENADAS PUNTOS. Hecho para modificar estaciones Red ERVA
									/*if (modCoords !== undefined) {
										data = modificaCoordenadas (modCoords,resTotal2,"identificador");
									}*/
									añadeCapaGeoJSON(i, map, idCapa, resTotal2, capa, tipoArbol, controlCapa.servicios, controlCapa.GCapasGeoJSON, controlCapa.capasNormal, datosTabla, controlCapa);
									resolve();
								});
								peticionGJ.fail(function (jqXHR, textStatus) {
									alert(MENSAJES.ErrorGeoJSON + textStatus);
									resolve();
								});
							});
							controlCapa.contadorPromesas++;
						}
					} else {
						alert(MENSAJES.ErrorOrigenGeoJSON);
						return;
					}
					break;
				default:

			}
		});

		//Tratamiento de parametros
		//prop(paramsQuery);
		if (IDEVAPI[p].URLParams == true) {
			var popupParam = false;
			var contenidoPopup = '';
			if ($.paramsQuery('marker') == 'true' && $.paramsQuery('lat') !== null && $.paramsQuery('lon') !== null) {
				if ($.paramsQuery('markerIcon') !== null) {
					var iconoImg = $.paramsQuery('markerIcon');
					if ($.paramsQuery('markerSize') == null) {
						var tamIcono = 30;
					} else {
						var tamIcono = $.paramsQuery('markerSize');
					}
					var desX = (tamIcono / 2) + 1;
					var desY = (tamIcono / 2) + 1;
					//Si el icono es de tipo localizador, se desplaza hacia arriba para que marque el centro
					if (iconoImg.indexOf("localizador") !== -1) {
						desY = desY + (tamIcono / 2);
					}
					var icono = L.icon({
						iconUrl: URLFicherosWeb + "geoidevapi/1.3/images/cons_" + iconoImg + ".svg",
						iconSize: [tamIcono, tamIcono],
						iconAnchor: [desX, desY],
						popupAnchor: [1, -desY]
					});
				} else {
					var icono = L.icon({
						iconUrl: URLFicherosWeb + "geoidevapi/1.3/images/cons_circulo_tipo1_amarillo.svg",
						iconSize: [30, 30],
						iconAnchor: [16, 16],
						popupAnchor: [1, -16]
					});
				}

				var latlon = [parseFloat($.paramsQuery('lat')), parseFloat($.paramsQuery('lon'))];
				if ($.paramsQuery('epsg') !== null) {
					switch ($.paramsQuery('epsg')) {
						case "25830":
							latlon = [parseFloat($.paramsQuery('lon')), parseFloat($.paramsQuery('lat'))];
							var y = proj4('EPSG:25830', 'EPSG:4326', latlon)[0];
							var x = proj4('EPSG:25830', 'EPSG:4326', latlon)[1];
							latlon = [x, y];
							break;
						case "4326":
							break;
						case "3857":
							latlon = [parseFloat($.paramsQuery('lon')), parseFloat($.paramsQuery('lat'))];
							var y = proj4('EPSG:3857', 'EPSG:4326', latlon)[0];
							var x = proj4('EPSG:3857', 'EPSG:4326', latlon)[1];
							latlon = [x, y];
							break;
						case undefined:
							break;
						default:
							alert(MENSAJES.ErrorSistemaReferencia + $.paramsQuery('epsg'));
					}
				}
				var punto = L.marker(latlon, { icon: icono });

				if ($.paramsQuery('textoPopup') !== null) {
					contenidoPopup = $.paramsQuery('textoPopup');
					popupParam = true;
				}
				if ($.paramsQuery('imagenPopup') !== null) {
					contenidoPopup = contenidoPopup + "<br /><img src ='" + $.paramsQuery('imagenPopup') + "'height = '150' width='250'>";
					popupParam = true;
				}
				//Se añade marcador al mapa
				punto.addTo(map);
				//Se añade Popup al mapa en caso de existir
				if (popupParam) {
					punto.bindPopup(contenidoPopup);
					//delay by a second and open popup
					setTimeout(function () {
						punto.openPopup();
					}, 500);
				}
			}
		}

		//////////////////// AÑADE PUNTOS DEFINIDOS POR EL USUARIO (NO EN DOCUMENTACIÓN) /////////////////////
		IDEVAPI[p].puntos.forEach(function (item, index) {
			//capasNormal.push({label: "punto", layer: L.marker(item.latlong), mostrarChecbox: true});

			var x = item.coords[0];
			var y = item.coords[1];

			switch (item.ref) {
				case "EPSG:25830":
					item.coords[1] = proj4('EPSG:25830', 'EPSG:4326', [x, y])[0];
					item.coords[0] = proj4('EPSG:25830', 'EPSG:4326', [x, y])[1];
					break;
				case "EPSG:4326":
					break;
				case "EPSG:3857":
					item.coords = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
					break;
				case undefined:
					break;
				default:
					alert(MENSAJES.ErrorSistemaReferencia + item.ref)
			}
			if (item.contenido == undefined) {
				item.contenido = '<p><strong>X: </strong>' + item.coords[0] + '<br><strong>Y: </strong>' + item.coords[1] + '</p>';
			}
			if (item.icon !== undefined) {
				if (['red', 'yellow', 'orange', 'green', 'gold', 'violet', 'grey', 'blue'].indexOf(item.icon) != -1) {
					var myIcon = L.icon({
						iconUrl: prot + urlAPI + '/' + llDir + '/images/marker-icon-' + item.icon + '.png',
						iconSize: [25, 41],
						iconAnchor: [12, 41],
						popupAnchor: [1, -34],
						shadowSize: [41, 41]
					});
				} else {
					var myIcon = L.icon({
						iconUrl: item.icon,
						iconSize: [25, 41],
						iconAnchor: [12, 41],
						popupAnchor: [1, -34],
						shadowSize: [41, 41]
					});
				}
				var punto = L.marker(item.coords, { icon: myIcon }).bindPopup(item.contenido).addTo(map);
				if (item.mostrarPopup) {
					punto.openPopup();
				}
			} else {
				var punto = L.marker(item.coords).bindPopup(item.contenido).addTo(map);
				if (item.mostrarPopup) {
					punto.openPopup();
				}
			}
		})

		///////////////// WIDGET DERECHOS //////////////////////////////////////////////////

		if (IDEVAPI_global.idioma == "es") {
			var URLIcv = URLIcvEs;
			var URLIdev = URLIdevEs;
		} else if (IDEVAPI_global.idioma == "va") {
			var URLIcv = URLIcvVa;
			var URLIdev = URLIdevVa;
		} else {
			var URLIcv = URLIcvVa;
			var URLIdev = URLIdevVa;
		}
		map.attributionControl.setPrefix('<div style="display:flex;flex-direction:column;"><div style="display:flex;justify-content:flex-end"><a href="' + URLIdev + '" target="_blank"><img src="' + URLFicherosWeb + 'repositorio/imagenes/2025_logo_IDEV_blanco.svg"/></a></div><div id="divPropietario" style="display:flex;"><div id="derechosICV">&copy; <a href="' + URLIcv + '" target="_blank"><span id="CopyICV">Institut Cartogràfic Valencià</span></a></div><div>&nbsp;- <a href="' + URLIcv + 'condiciones-de-uso-de-la-geoinformacion-icv" target="_blank"> CC BY 4.0</a></div></div></div>');
		//map.attributionControl.setPrefix('<a href="' + URLIdev + '" target="_blank"><img src="' + URLFicherosWeb + 'repositorio/imagenes/logo_IDEV_blanco.svg"/></a><span id="derechosICV">&copy; <a href="' + URLIcv + '" target="_blank"><span id="CopyICV">Institut Cartogràfic Valencià</span></a> - <a href="' + URLIcv + 'condiciones-de-uso-de-la-geoinformacion-icv" target="_blank"> CC BY 4.0</a></span>');

		///////////////// WIDGET ESCALA GRÁFICA //////////////////////////////////////////////////

		L.control.scale({
			metric: true,
			imperial: false
		}).addTo(map);

		///////////////// WIDGET CONTROL CAPAS BASE (selector visual con miniaturas) //////////////////////////////////////////////////

		var basemapImageBase = srcCore.split("/js/idevAPI_core")[0] + "/images/mapas_base/";
		var basemapControl = L.control({ position: "bottomleft" });

		basemapControl.onAdd = function (_map) {
			var mapId = IDEVAPI[p].id;
			var container = L.DomUtil.create("div", "idevapi-basemap-control leaflet-control");
			L.DomEvent.disableClickPropagation(container);
			L.DomEvent.disableScrollPropagation(container);

			// Encontrar la clave interna del mapa base activo
			var activeKey = null;
			for (var k in ListadoMapasBase) {
				if (ListadoMapasBase[k] === mapaBase) {
					activeKey = k;
					break;
				}
			}
			// Resolver la clave de capasBase a partir del título
			function keyFromTitle(titulo) {
				for (var k in MapaBase) {
					if (MapaBase[k].titulo === titulo) return k;
				}
				return null;
			}
			var activeCapaKey = activeKey ? keyFromTitle(activeKey) : null;

			// Crear imagen o fallback
			function crearThumb(capaKey, titulo) {
				var imgFile = (capaKey && capasBase[capaKey] && capasBase[capaKey].imagen) ? capasBase[capaKey].imagen : null;
				if (imgFile) {
					var img = L.DomUtil.create("img", "idevapi-basemap-thumb");
					img.src = basemapImageBase + imgFile;
					img.alt = titulo;
					img.loading = "lazy";
					img.onerror = function () {
						var fb = L.DomUtil.create("span", "idevapi-basemap-fallback");
						fb.textContent = (titulo || "?").charAt(0).toUpperCase();
						this.parentNode.replaceChild(fb, this);
					};
					return img;
				} else {
					var fb = L.DomUtil.create("span", "idevapi-basemap-fallback");
					fb.textContent = (titulo || "?").charAt(0).toUpperCase();
					return fb;
				}
			}

			// Actualizar contenido del botón con miniatura + título superpuesto
			function updateButton(capaKey, titulo) {
				btn.innerHTML = "";
				btn.appendChild(crearThumb(capaKey, titulo));
				var btnTitle = L.DomUtil.create("span", "idevapi-basemap-btn-title", btn);
				btnTitle.textContent = titulo || "";
			}

			// --- Botón colapsado ---
			var btn = L.DomUtil.create("div", "idevapi-basemap-button", container);
			btn.setAttribute("role", "button");
			btn.setAttribute("aria-haspopup", "menu");
			btn.setAttribute("aria-expanded", "false");
			btn.setAttribute("tabindex", "0");
			btn.title = MENSAJES.etiquetaBase;
			btn.id = "idevapi-basemap-btn_" + mapId;
			updateButton(activeCapaKey, activeKey);

			// --- Menú grid ---
			var menu = L.DomUtil.create("div", "idevapi-basemap-menu", container);
			menu.setAttribute("role", "menu");
			menu.id = "idevapi-basemap-menu_" + mapId;

			var items = [];
			for (var titulo in ListadoMapasBase) {
				var layer = ListadoMapasBase[titulo];
				var capaKey = keyFromTitle(titulo);
				var item = L.DomUtil.create("div", "idevapi-basemap-item", menu);
				item.setAttribute("role", "menuitem");
				item.setAttribute("tabindex", "-1");
				item.setAttribute("aria-selected", layer === mapaBase ? "true" : "false");
				item.dataset.capaKey = capaKey;
				item.dataset.titulo = titulo;
				item.appendChild(crearThumb(capaKey, titulo));
				var titleEl = L.DomUtil.create("span", "idevapi-basemap-title", item);
				titleEl.textContent = titulo;
				titleEl.title = titulo;
				items.push(item);
			}

			// --- Estado ---
			var isOpen = false;
			var pinned = false; // true si se abrió por click (no hover)
			var currentBaseLayer = mapaBase;

			function openMenu() {
				if (isOpen) return;
				menu.classList.add("is-open");
				btn.setAttribute("aria-expanded", "true");
				isOpen = true;
			}

			function closeMenu() {
				if (!isOpen) return;
				menu.classList.remove("is-open");
				btn.setAttribute("aria-expanded", "false");
				isOpen = false;
				pinned = false;
			}

			function selectBase(item) {
				var titulo = item.dataset.titulo;
				var layer = ListadoMapasBase[titulo];
				if (layer && layer !== currentBaseLayer) {
					_map.removeLayer(currentBaseLayer);
					_map.addLayer(layer);
					currentBaseLayer = layer;
					// Actualizar selección visual
					for (var i = 0; i < items.length; i++) {
						items[i].setAttribute("aria-selected", "false");
					}
					item.setAttribute("aria-selected", "true");
					// Actualizar botón
					var capaKey = item.dataset.capaKey;
					updateButton(capaKey, titulo);
				}
				// El menú permanece abierto tras la selección
			}

			// --- Hover (desktop) ---
			container.addEventListener("mouseenter", function () {
				if (!pinned) openMenu();
			});
			container.addEventListener("mouseleave", function () {
				if (!pinned) closeMenu();
			});

			// --- Click en botón ---
			btn.addEventListener("click", function (e) {
				e.stopPropagation();
				if (isOpen && pinned) {
					closeMenu();
				} else {
					openMenu();
					pinned = true;
				}
			});

			// --- Click/tap en ítems ---
			for (var i = 0; i < items.length; i++) {
				items[i].addEventListener("click", function (e) {
					e.stopPropagation();
					selectBase(this);
				});
			}

			// --- Click-outside ---
			L.DomEvent.on(document, "click", function (e) {
				if (isOpen && !container.contains(e.target)) {
					closeMenu();
				}
			});

			// --- Teclado ---
			btn.addEventListener("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					if (isOpen) { closeMenu(); } else { openMenu(); pinned = true; }
					if (isOpen && items.length > 0) items[0].focus();
				} else if (e.key === "Escape") {
					closeMenu();
				}
			});

			menu.addEventListener("keydown", function (e) {
				var focused = document.activeElement;
				var idx = items.indexOf(focused);
				if (e.key === "ArrowDown" || e.key === "ArrowRight") {
					e.preventDefault();
					var next = (idx + 1) % items.length;
					items[next].focus();
				} else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
					e.preventDefault();
					var prev = (idx - 1 + items.length) % items.length;
					items[prev].focus();
				} else if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					if (idx >= 0) selectBase(items[idx]);
				} else if (e.key === "Escape") {
					closeMenu();
					btn.focus();
				}
			});

			return container;
		};

		// Ocultar el control si solo hay un mapa base disponible
		var numBases = 0;
		for (var _k in ListadoMapasBase) { numBases++; }
		if (numBases > 1) {
			basemapControl.addTo(map);
		}

		//Control botones según ancho mapa. Esconde botones en mapas muy estrechos para que no se amontonen.
		function controlBotones(ancho) {
			if (ancho < 110) {
				$(".leaflet-top.leaflet-right").css("display", "none");
				$(".leaflet-bottom.leaflet-right").css("display", "none");
			} else {
				$(".leaflet-top.leaflet-right").css("display", "block");
				$(".leaflet-bottom.leaflet-right").css("display", "block");
			}
			if (ancho < 130) {
				$("#divPropietario").css("display", "none");
			} else {
				$("#divPropietario").css("display", "flex");
			}
			if (ancho < 150) {
				$(".leaflet-control-scale.leaflet-control").css("display", "none");
			} else {
				$(".leaflet-control-scale.leaflet-control").css("display", "block");
			}
			if (ancho < 275) {
				$("#CopyICV").text("ICV");
			} else {
				$("#CopyICV").text("Institut Cartogràfic Valencià");
			}
			if (ancho < 350) {
				$(".divControlCoords").css("display", "none");
			} else {
				$(".divControlCoords").css("display", "block");
			}
		}
		//Se ejecuta en la primera carga del mapa
		controlBotones(map._size.x);
		//Evento modificar tamaño mapa
		map.on('resize', function (evt) {
			controlBotones(evt.newSize.x);
		});

	}
	//////////////////////////////// FIN RECORRIDO VARIABLE IDEVAPI for(var p = 0; p < IDEVAPI.length; p++) /////////////////////
	////Añadir controles de capas y opacidad cuando todas las capas se carguen en el mapa////key = id del mapa "MapaIDEV1"
	function resolverPromesas(key) {
		var controlCapa = controlCapas[key];
		Promise.all(controlCapa.promesas).then(function () {
			var controlCapa = controlCapas[key];
			ejecutaCargaCapas(key, controlCapa);
			mapa = controlCapa.mapa;
			parametrosLeyenda = {
				id: key,
				capasGeoJSON: controlCapa.GCapasGeoJSON,
				capasWMS: controlCapa.GCapasWMS,
				capasWMTS: controlCapa.GCapasWMTS,
				capasTree: controlCapa.GCapasTree,
				colapsarLeyenda: controlCapa.colapsarLeyenda,
				mapa: controlCapa.mapa
			}
			controlCapa.capasArbol = construirTOCOrdenado(controlCapa.tipoArbol, controlCapa.servicios, controlCapa.tocKeySinNivel2);
			controlCapa.capasNormal = [];
			if (controlCapa.numCapasCargadas > 0) {
				if (controlCapa.capasNormal.concat(controlCapa.capasArbol).length !== 0) {
					if (controlCapa.tipoArbol == "RadioButton") {
						mapa.controlCapas = L.control.layers.treeRadio(controlCapa.capasNormal, controlCapa.capasArbol, mapa, parametrosLeyenda, TreeControlOptions).addTo(mapa);
						// NOTE (PAUPER, 2026-03-16): P-12 corregido — creaWidgetConsulta se llama solo al final (una vez)
						if (Object.keys(controlCapa.capasOpacidad).length > 0) {
							mapa.controlOpacidad = L.control.opacity(controlCapa.capasOpacidad, { collapsed: true }).addTo(mapa);
						} else {
							mapa.controlOpacidad = L.control.opacity(controlCapa.capasOpacidad, { collapsed: true });
						}
					} else {
						mapa.controlCapas = L.control.layers.tree(controlCapa.capasNormal, controlCapa.capasArbol, mapa, parametrosLeyenda, TreeControlOptions).addTo(mapa);
						// NOTE (PAUPER, 2026-03-16): P-12 corregido — creaWidgetConsulta se llama solo al final (una vez)
						if (Object.keys(controlCapa.capasOpacidad).length > 0) {
							mapa.controlOpacidad = L.control.opacity(controlCapa.capasOpacidad, { collapsed: true }).addTo(mapa);
						} else {
							mapa.controlOpacidad = L.control.opacity(controlCapa.capasOpacidad, { collapsed: true });
						}
					}
				}
			}
			// NOTE (PAUPER, 2026-03-16): P-12 corregido — una sola llamada, fuera del if
			creaWidgetConsulta(controlCapa.mapa, controlCapa.colapsarConsultas, key);
			var controlesLeyenda = controlCapas[key];
			rellenaLeyenda(key, controlesLeyenda.GCapasGeoJSON, controlesLeyenda.GCapasWMS, controlesLeyenda.GCapasWMTS, controlesLeyenda.GCapasTree, controlesLeyenda.colapsarLeyenda, controlesLeyenda.mapa);
		});
	}

	for (i = 0; i < Object.keys(controlCapas).length; i++) {
		var key = Object.keys(controlCapas)[i];
		resolverPromesas(key);
	}

	//////////////////////////////  SE AÑADEN LAS CAPAS TEMÁTICAS  //////////////////////////////////////////////////////////////////

	function getMetaTOC(servicios, keySinNivel2) {
		if (!servicios.__metaTOC) {
			servicios.__metaTOC = {
				orden: [],
				grupos: {},
				keySinNivel2: keySinNivel2,
				seq: 0
			};
		}
		return servicios.__metaTOC;
	}

	function normalizaOrdenTOC(orden) {
		if ($.isNumeric(orden)) {
			return Number(orden);
		}
		return Number.MAX_SAFE_INTEGER;
	}

	function creaItemTOCSuelto(tipoArbol, titulo, capa) {
		if (tipoArbol == "RadioButton") {
			return { label: titulo, layer: capa, radioLeaf: true };
		}
		return { label: titulo, layer: capa, mostrarChecbox: true };
	}

	function registraCapaSueltaTOC(servicios, tipoArbol, titulo, capa, orden) {
		var meta = getMetaTOC(servicios, "__IDEVAPI_TOC_SIN_NIVEL2__");
		meta.orden.push({
			tipo: "capa",
			item: creaItemTOCSuelto(tipoArbol, titulo, capa),
			orden: normalizaOrdenTOC(orden),
			seq: meta.seq++
		});
	}

	function construirTOCOrdenado(tipoArbol, servicios, keySinNivel2) {
		var meta = getMetaTOC(servicios, keySinNivel2);
		var resultado = [];
		var ordenEntradas = meta.orden.slice().sort(function (a, b) {
			var ordenA = (a.tipo == "grupo")
				? normalizaOrdenTOC((meta.grupos[a.grupo] || {}).ordenMin)
				: normalizaOrdenTOC(a.orden);
			var ordenB = (b.tipo == "grupo")
				? normalizaOrdenTOC((meta.grupos[b.grupo] || {}).ordenMin)
				: normalizaOrdenTOC(b.orden);
			if (ordenA !== ordenB) {
				return ordenA - ordenB;
			}
			return normalizaOrdenTOC(a.seq) - normalizaOrdenTOC(b.seq);
		});
		for (var i = 0; i < ordenEntradas.length; i++) {
			var entrada = ordenEntradas[i];
			if (entrada.tipo == "capa") {
				resultado.push(entrada.item);
				continue;
			}

			var grupoKey = entrada.grupo;
			var subgrupos = servicios[grupoKey];
			if (!subgrupos) {
				continue;
			}

			var hijosGrupo = [];
			var metaGrupo = meta.grupos[grupoKey] || { subgruposOrden: [], ordenSubgrupos: {} };
			var subgruposOrdenados = metaGrupo.subgruposOrden.slice().sort(function (a, b) {
				var ordenA = normalizaOrdenTOC(metaGrupo.ordenSubgrupos[a]);
				var ordenB = normalizaOrdenTOC(metaGrupo.ordenSubgrupos[b]);
				if (ordenA !== ordenB) {
					return ordenA - ordenB;
				}
				if (a < b) { return -1; }
				if (a > b) { return 1; }
				return 0;
			});
			for (var s = 0; s < subgruposOrdenados.length; s++) {
				var subgrupoKey = subgruposOrdenados[s];
				var hojas = (subgrupos[subgrupoKey] || []).slice().sort(function (a, b) {
					var ordenA = normalizaOrdenTOC(a.tocOrden);
					var ordenB = normalizaOrdenTOC(b.tocOrden);
					if (ordenA !== ordenB) {
						return ordenA - ordenB;
					}
					if (a.label < b.label) { return -1; }
					if (a.label > b.label) { return 1; }
					return 0;
				});
				if (subgrupoKey === meta.keySinNivel2) {
					for (var h = 0; h < hojas.length; h++) {
						hijosGrupo.push(hojas[h]);
					}
				} else {
					var subgrupoDesplegado = false;
					for (var j = 0; j < hojas.length; j++) {
						if (hojas[j].tocDesplegado === true) {
							subgrupoDesplegado = true;
							break;
						}
					}
					if (tipoArbol == "RadioButton") {
						hijosGrupo.push({ label: subgrupoKey, collapsed: !subgrupoDesplegado, children: hojas });
					} else {
						hijosGrupo.push({ selectAllCheckbox: true, label: subgrupoKey, collapsed: !subgrupoDesplegado, children: hojas });
					}
				}
			}

			var grupoDesplegado = (metaGrupo.desplegado === true);
			if (tipoArbol == "RadioButton") {
				resultado.push({ label: grupoKey, selectAllRadio: false, children: hijosGrupo, collapsed: !grupoDesplegado, checked: false });
			} else {
				resultado.push({ selectAllCheckbox: true, label: grupoKey, children: hijosGrupo, collapsed: !grupoDesplegado });
			}
		}
		return resultado;
	}

	///////////////// Función para adapatar las capas a la estructura en árbol //////////////
	function capasAHojas(tipoArbol, servicios, tituloServicio, tituloGrupo, capa, titulo, i, capasArbol, capasOpacidad, keySinNivel2) {
		var meta = getMetaTOC(servicios, keySinNivel2);
		var ordenActual = normalizaOrdenTOC(i);
		if (!meta.grupos[tituloServicio]) {
			meta.grupos[tituloServicio] = { subgruposOrden: [], ordenSubgrupos: {}, desplegado: false, ordenMin: ordenActual };
			meta.orden.push({ tipo: "grupo", grupo: tituloServicio, seq: meta.seq++ });
		} else {
			meta.grupos[tituloServicio].ordenMin = Math.min(normalizaOrdenTOC(meta.grupos[tituloServicio].ordenMin), ordenActual);
		}

		var subgrupoKey = (tituloGrupo === null || tituloGrupo === undefined || tituloGrupo === "") ? meta.keySinNivel2 : tituloGrupo;
		if (meta.grupos[tituloServicio].subgruposOrden.indexOf(subgrupoKey) === -1) {
			meta.grupos[tituloServicio].subgruposOrden.push(subgrupoKey);
		}
		if (meta.grupos[tituloServicio].ordenSubgrupos[subgrupoKey] === undefined) {
			meta.grupos[tituloServicio].ordenSubgrupos[subgrupoKey] = ordenActual;
		} else {
			meta.grupos[tituloServicio].ordenSubgrupos[subgrupoKey] = Math.min(normalizaOrdenTOC(meta.grupos[tituloServicio].ordenSubgrupos[subgrupoKey]), ordenActual);
		}

		if (capa.TOCDesplegado === true) {
			meta.grupos[tituloServicio].desplegado = true;
		}

		var hoja = (tipoArbol == "RadioButton")
			? { layer: capa, label: titulo, radioLeaf: true, tocDesplegado: capa.TOCDesplegado === true, tocOrden: ordenActual }
			: { layer: capa, label: titulo, mostrarChecbox: true, tocDesplegado: capa.TOCDesplegado === true, tocOrden: ordenActual };

		if (tipoArbol == "RadioButton") {
			//if(Object.keys(servicios).includes(tituloServicio)){
			if (Object.keys(servicios).indexOf(tituloServicio) != -1) {
				if (Object.keys(servicios[tituloServicio]).indexOf(subgrupoKey) != -1) {
					if (IDEVAPI[p].capas.length - 1 == i) {
						servicios[tituloServicio][subgrupoKey].push(hoja);
						capasArbol.addLayer(capa);
						if (IDEVAPI[p].capaInicialArbol) {
							map.addLayer(capa);
							if (capa.wgOpacidad) {
								capasOpacidad[capa.titulo] = capa;
							}
						}
					} else {
						servicios[tituloServicio][subgrupoKey].push(hoja);
						capasArbol.addLayer(capa);
					}
				} else {
					if (IDEVAPI[p].capas.length - 1 == i) {
						servicios[tituloServicio][subgrupoKey] = [hoja];
						capasArbol.addLayer(capa);
						if (IDEVAPI[p].capaInicialArbol) {
							map.addLayer(capa);
							if (capa.wgOpacidad) {
								capasOpacidad[capa.titulo] = capa;
							}
						}
					} else {
						servicios[tituloServicio][subgrupoKey] = [hoja];
						capasArbol.addLayer(capa);
					}
				}
			} else {
				if (IDEVAPI[p].capas.length - 1 == i) {
					servicios[tituloServicio] = {};
					servicios[tituloServicio][subgrupoKey] = [hoja];
					capasArbol.addLayer(capa);
					if (IDEVAPI[p].capaInicialArbol) {
						map.addLayer(capa);
						if (capa.wgOpacidad) {
							capasOpacidad[capa.titulo] = capa;
						}
					}
				} else {
					servicios[tituloServicio] = {};
					servicios[tituloServicio][subgrupoKey] = [hoja];
					capasArbol.addLayer(capa);
				}
			}
		} else {
			if (Object.keys(servicios).indexOf(tituloServicio) != -1) {
				if (Object.keys(servicios[tituloServicio]).indexOf(subgrupoKey) != -1) {
					servicios[tituloServicio][subgrupoKey].push(hoja);
					capasArbol.addLayer(capa);
				} else {
					servicios[tituloServicio][subgrupoKey] = [hoja];
					capasArbol.addLayer(capa);
				}
			} else {
				servicios[tituloServicio] = {};
				servicios[tituloServicio][subgrupoKey] = [hoja];
				capasArbol.addLayer(capa);
			}
		}
		capa.label = (tituloGrupo === null || tituloGrupo === undefined || tituloGrupo === "") ? titulo : (titulo + ' ' + tituloGrupo);
	}

	/////////FUNCIONES PARA CREAR LAS RAMAS DE LAS CAPAS EN ARBOL//////////////
	function crearRamasCheckbox(item, index, servicios, capasArbol) {
		var ramas = [];
		for (i = 0; i < Object.keys(servicios[item]).length; i++) {
			if (i == Object.keys(servicios[item]).length - 1 && Object.keys(servicios).length - 1 == index) {
				ramas.push({ selectAllCheckbox: true, label: Object.keys(servicios[item])[i], collapsed: false, children: servicios[item][Object.keys(servicios[item])[i]] });
			} else {
				ramas.push({ selectAllCheckbox: true, label: Object.keys(servicios[item])[i], collapsed: true, children: servicios[item][Object.keys(servicios[item])[i]] });
			}
		}
		capasArbol.push({ selectAllCheckbox: true, label: item, children: ramas });
	}

	function crearRamasRadio(item, index, servicios, capasArbol) {
		var ramas = [];
		let keys = Object.keys(servicios[item]).sort(); // Ordenar las claves
		for (let i = 0; i < keys.length; i++) {
			if (i == keys.length - 1 && Object.keys(servicios).length - 1 == index) {
				ramas.push({ label: keys[i], collapsed: false, children: servicios[item][keys[i]] });
			} else {
				ramas.push({ label: keys[i], collapsed: true, children: servicios[item][keys[i]] });
			}
		}
		if (Object.keys(servicios).length == 1) {
			capasArbol.push({ label: item, selectAllRadio: false, children: ramas, collapsed: false, checked: false });
		} else {
			capasArbol.push({ label: item, selectAllRadio: false, children: ramas, collapsed: true, checked: false });
		}
	}

	if (!L.Browser.mobile) {
		window.addEventListener('click', function (e) {
			for (i = 0; i < mapas_id.length; i++) {
				if (document.getElementById(mapas_id[i].id).contains(e.target)) {
					// Click sobre el mapa
					mapas_id[i].mapa.scrollWheelZoom.enable();
				} else {
					// Click fuera del mapa
					mapas_id[i].mapa.scrollWheelZoom.disable();
				}
			}

		});
	}

	for (h = 0; h < sincronizar.length; h++) {
		for (var k = 0; k < sincronizar[h].ids.length; k++) {
			for (var m = k + 1; m < sincronizar[h].ids.length; m++) {
				var id1 = sincronizar[h].ids[k];
				var id2 = sincronizar[h].ids[m];
				var mapa1 = mapas_id.filter(function (x) {
					return x.id === id1
				})[0].mapa;
				var mapa2 = mapas_id.filter(function (x) {
					return x.id === id2
				})[0].mapa;
				if (sincronizar[h].tipo == "centro") {
					mapa1.sync(mapa2, {});
					mapa2.sync(mapa1, {});
				} else if (sincronizar[h].tipo == "lateral") {
					mapa1.sync(mapa2, { offsetFn: offsetGlobal });
					mapa2.sync(mapa1, { offsetFn: offsetGlobal });
				}
			}
		}
	}
	return returnMaps;
}; //*********************** FIN function iniciarIdevAPI(IDEVAPI, IDEVAPI_global) { *****************************************************//


// Cargar las librerías y luego resolver la promesa
loadLibraries().then(() => {
	allLibrariesLoaded = true;
	if (IDEVAPI && IDEVAPI_global) {
		executeIdevAPI();
	}
	// Emitir un evento personalizado después de cargar todas las librerías
	//console.log("Se emite idevAPICargado");
	document.dispatchEvent(new Event('idevAPICargado'));
}).catch(error => {
	console.error('Error loading libraries:', error);
});

///////////////// FUNCIONES AL CARGAR TODAS LAS CAPAS /////////////////////////////////

function ejecutaCargaCapas(id, controlCapa) {
	//Se esconde el Cargando Mapa
	$("#cargandoMapa_" + id).hide();
	preparacionMapa(controlCapa.mapa, controlCapa.GCapasGeoJSON, controlCapa.consultas);
	actualizaCapaIntervalo(controlCapa.GCapasGeoJSON); //idevAPI_capas_GeoJSON.js
	actualizaCapaIntervaloWMS(controlCapa.GCapasWMS);
	rellenaConsultas(id, controlCapa.mapa, controlCapa.consultas); //idevAPI_consulta.js
	rellenaFiltros(id, controlCapa.mapa, controlCapa.filtros);	//idevAPI_filtro.js
	rellenaFiltrosCapaGeoJSON(id, controlCapa.mapa, controlCapa.GCapasGeoJSON);	//idevAPI_capas_GeoJSON.js
}

function actualizaCapaIntervaloWMS(capasWMS) {
	$.each(capasWMS._layers, function (key, capa) {
		if (capa.actualizaDatos > 0) {
			var intervalId = window.setInterval(function () {
				//Añade y borra un parámetro a la capa para forzar a actualizarla
				capa._source._overlay.setParams({ '_t': ((new Date()).getTime()) });
				delete capa._source._overlay.wmsParams['_t'];
			}, capa.actualizaDatos * 1000);
		}
	});
}

function preparacionMapa(mapa, capasGeoJSON, consultas) {

	//Evita abrir Select al clicar sobre X (para librería "select2")
	$('select').filter(
		function () {
			if ($(this).attr("data-select2-id") !== undefined) {
				select2NoSelect(this); //idevAPI_general.js
			}
		}
	);
	for (var p = 0; p < IDEVAPI.length; p++) {
		if (IDEVAPI[p].id == mapa.id) {
			//Se cambia el estilo de Select2, en concreto el color al pasar por encima de la selección (hover)
			if (IDEVAPI[p].estiloSelect == "ICV") {
				$('<style>.select2-container--default .select2-results__option--highlighted[aria-selected] {background-color:  rgb(0,103,127);}</style>').appendTo('head');
			} else if (IDEVAPI[p].estiloSelect == "GVA") {
				$('<style>.select2-container--default .select2-results__option--highlighted[aria-selected] {background-color: rgb(20, 60, 160);}</style>').appendTo('head');
			}
		}
	}
}

function offsetGlobal(center, zoom, refMap, tgtMap) {
	var refC = refMap.getContainer();
	var tgtC = tgtMap.getContainer();
	var pt = refMap.project(center, zoom)
		.subtract([refC.offsetLeft, refC.offsetTop])
		.subtract(refMap.getSize().divideBy(2))
		.add([tgtC.offsetLeft, tgtC.offsetTop])
		.add(tgtMap.getSize().divideBy(2));
	return refMap.unproject(pt, zoom);
}
