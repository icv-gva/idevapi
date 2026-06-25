/////////////////////////// URLs  ///////////////////////////////////////////////////////////////
// NOTE (PAUPER, 2026-03-16): prot se calcula también en idevAPI_core.js (línea 3).
// Se duplica aquí para que config.js sea autosuficiente y no dependa del orden de carga.
if (typeof prot === 'undefined') {
    var prot = location.protocol;
    if ((prot !== 'http:') && (prot !== 'https:')) { prot = 'http:'; }
}
var proxyIDEVAPI = "https://descargas.icv.gva.es/server_api/proxyEsri/proxy.php";
var URLFicherosWeb = "https://icvficherosweb.icv.gva.es/00/";
var URLIcvEs = "https://icv.gva.es/es/"
var URLIcvVa = "https://icv.gva.es/va/"
var URLIdevEs = "https://idev.gva.es/es/inicio"
var URLIdevVa = "https://idev.gva.es/va/inicio"
/////////////////////////// EVENTOS /////////////////////////////////////////////////////////////
var capturandoPuntoXY = false;
/////////////////////////// PANES ////////////////////////////////////////////////////////////////
var paneZIndexCapas = 500; //z-index de las capas añadidas por el usuario. Se numeran desde 500 hacia abajo, según el orden que aparece en el vector "capas"
var paneZIndexCapaConsultaAbajo = 201;
var paneZIndexCapaConsultaArriba = 501;
/////////////////////////// CAPAS BASE ////////////////////////////////////////////////////////////
var capasBaseFuentes = {
    Orto_ESRI: {
        url: prot + "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/WMTS",
        capa: "World_Imagery",
        tilematrixset: "default028mm"
    },
    ESRI_Topografico_VT: {
        url: "https://icvficherosweb.icv.gva.es/00/geovisorgva/vt_estilos/ESRI_topografico.json",
        datasource_name: "esri",
        isVectorTile: true
    },
    ESRI_Topografico_Grises_VT: {
        url: "https://icvficherosweb.icv.gva.es/00/geovisorgva/vt_estilos/ESRI_grises.json",
        datasource_name: "esri",
        isVectorTile: true
    },

    Topografico_Basico_VT: {
        url: "https://icvficherosweb.icv.gva.es/00/geovisorgva/vt_estilos/Basico_ICV.json",
        datasource_name: "esri",
        isVectorTile: true
    },
    Nocturno_VT: {
        url: "https://icvficherosweb.icv.gva.es/00/geovisorgva/vt_estilos/Nocturno_ICV.json",
        datasource_name: "esri",
        isVectorTile: true
    },
    ESRI_Nocturno_VT: {
        url: "https://icvficherosweb.icv.gva.es/00/geovisorgva/vt_estilos/ESRI_darkgray.json",
        datasource_name: "esri",
        isVectorTile: true
    },
    Orto: {
        url: prot + "//terramapas.icv.gva.es/mapabase_ortofoto/wmts",
        capa: "01_8bits_01_RGB_05_PNG",
        tilematrixset: "GMEPSG3857"
    },
    RT_Toponimia: {
        url: prot + "//terramapas.icv.gva.es/mapabase_hibrid/wmts",
        capa: "mapabase_hibrid",
        tilematrixset: "GMEPSG3857"
    },
    MDT: {
        url: prot + "//terramapas.icv.gva.es/mapabase_isohipsas/wmts",
        capa: "01_8bits_01_RGB_05_PNG",
        tilematrixset: "GMEPSG3857"
    },
    Topografico_Normal: {
        url: prot + "//terramapas.icv.gva.es/mapabase_topografico/wmts",
        capa: "topografico_continuo_epsg3857",
        tilematrixset: "GMEPSG3857"
    },
    Topografico_Basico: {
        url: prot + "//terramapas.icv.gva.es/mapabase_basico/wmts",
        capa: "mapabase_basico",
        tilematrixset: "GMEPSG3857"
    },
    Topografico_Gris: {
        url: prot + "//terramapas.icv.gva.es/mapabase_topografico_grises/wmts",
        capa: "mapabase_topografico_grises",
        tilematrixset: "GMEPSG3857"
    },
    Contorno_Autonomico: {
        url: prot + "//terramapas.icv.gva.es/0105_Delimitaciones_LLAutonomica",
        capa: "OWS_0105_Delimitaciones_LLAutonomica"
    },
    Toponimia: {
        url: prot + "//terramapas.icv.gva.es/0103_NTV",
        capa: "NTV.Poligonos,NTV.Lineas,NTV.Puntos"
    },
}

var capasBase = {
    Imagen: {
        titulo: "Imagen|Imatge|Imagen",
        imagen: "mapa_base_imagen.png",
        capas: ["Orto_ESRI", "Orto", "Contorno_Autonomico"]
    },
    Ortonomenclator: {
        titulo: "Ortonomenclator|Ortonomenclator|Ortonomenclator",
        imagen: "mapa_base_ortonomenclator.png",  // Temporal: misma miniatura que Híbrido
        capas: ["Orto_ESRI", "Orto", "Contorno_Autonomico", "Toponimia"]
    },
    Hibrido: {
        titulo: "Híbrido|Híbrid|Híbrido",
        imagen: "mapa_base_hibrido.png",
        capas: ["Orto_ESRI", "Orto", "Contorno_Autonomico", "RT_Toponimia"]
    },
    Relieve: {
        titulo: "Relieve|Relleu|Relieve",
        imagen: "mapa_base_relieve.png",
        capas: ["MDT"]
    },
    Basico: {
        titulo: "Básico|Bàsic|Básico",
        imagen: "mapa_base_basico.png",
        capas: ["ESRI_Topografico_VT", "Topografico_Basico_VT"]
    },
    Topografico: {
        titulo: "Topográfico|Topogràfic|Topográfico",
        imagen: "mapa_base_topografico.png",
        capas: ["ESRI_Topografico_VT", "Topografico_Normal"]
    },
    Gris: {
        titulo: "Gris|Gris|Gris",
        imagen: "mapa_base_grises.png",
        capas: ["ESRI_Topografico_Grises_VT", "Topografico_Gris"]
    },
    Nocturno: {
        titulo: "Nocturno|Nocturn|Nocturno",
        imagen: "mapa_base_nocturno.png",
        capas: ["ESRI_Nocturno_VT","Nocturno_VT"]
    },
    Sin_Fondo: {
        titulo: "Sin Fondo|Sense Fons|Sin Fondo",
        imagen: "mapa_base_sin_fondo.png",
        capas: []
    }
}

// Mapeo de claves de capasBase a ficheros de miniatura en images/mapas_base/
// OBSOLETO: usar capasBase[key].imagen en su lugar
// var capasBaseImagenes = { ... }

////////////////////////// CAPAS PREDEFINIDAS ////////////////////////////////////////////////////////////////////
//Definición de las capas disponibles para añadir a la API del Visor
//[0] = "MS" -> Servicio WMS de MapServer, "AGS" -> Servicio WMS de ArcGIS Server
//[1] = URL del servicio WMS (AGS y MS) o URL del archivo GeoJSON | tabla para WMS de MS (cobdicional)
//[2] = formato de imagen del servicio WMS
var capasIDEV = {
    Toponimia: ["MS", prot + "//terramapas.icv.gva.es/toponimia_base", "image/png"],
    Base_CV05: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv6.fcgi?map=/srv_apl/mapserv/servicios/01_cartografia/01_series/map/bcv05_continuo_IDECV.map", "image/png"],
    Eleccions_Autonomiques: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_autonomicas.map", "image/png"],
    Eleccions_Autonomiques_2019: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_autonomicas_2019.map", "image/png"],
    RT: ["MS", prot + "//terramapas.icv.gva.es/rtcv", "image/png"],
    Cuadriculas: ["MS", prot + "//terramapas.icv.gva.es/cuadriculas", "image/png"],
    Unidades_administrativas: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_otros/limites_administrativos/MapServer/WMSServer", "image/png"],
    Geod_Estaciones: ["MS", prot + "//terramapas.icv.gva.es/wmsgnss", "image/png"],
    Geod_EstGNSS_Activas: ["GeoJSON", prot + "//rep-gnss.es/visorgnss2/api/mapa/"],
    Geod_4Orden: ["MS", prot + "//terramapas.icv.gva.es/wmsredgeod|capas.vert_4o", "image/png"],
    Plan_Lin_Limite: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/01_cartografia/05_unidadesadm/lineas_limite/lineas_limite.map|lineas_limite.lineas_limite_cv_etrs89_2019", "image/png"],
    DIC: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_infraestructuras/dics/MapServer/WMSServer", "image/png"],
    Geotecnia: ["MS", prot + "//terramapas.icv.gva.es/ived_geotecnia|five.ctc19", "image/png"],
    Espacios_Protegidos: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_medio_ambiente/espacios_protegidos/MapServer/WMSServer", "image/png"],
    Aguas: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_medio_ambiente/aguas/MapServer/WMSServer", ""],
    Prevencion_de_Incendios: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_medio_ambiente/prevencion_de_incendios/MapServer/WMSServer", "image/png"],
    Deportes: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_deportes/deportes/MapServer/WMSServer", "image/png"],
    //Certificados_Energeticos:["AGS",prot + "//carto.icv.gva.es/arcgis/services/tm_industria/certificados_energeticos/MapServer/WMSServer",""],
    Certificados_Energeticos: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/10_economiaindustria/01_certificados_energeticos/certificados_energeticos.map|tm_industria.certificados_energeticos_pol", "image/png"],
    //AVAMET:["GeoJSON",prot + "//www.avamet.org/xml/out/mxo.geojson",""]
    AVAMET: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_medio_ambiente/avamet/MapServer/WMSServer", "image/png"],
    Ecoparques: ["GeoJSON", prot + "//cvi-v3.es/mapa/geojson/recogida_pilas.geojson", ""],
    //EOI:["GeoJSON",prot + urlAPI + "/datos/eoi.geojson",""],
    Educacion: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_educacion/educacion/MapServer/WMSServer", "image/png"],
    JQCV_exrtaordinaris: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_educacion/jqcv_exrtaordinaris/MapServer/WMSServer", "image/png"],
    Certificados_EnergeticosBD: ["BD", "tm_industria.certificados_energeticos_pol,id,geom", ""],
    CORINE2018: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_infraestructuras/corine_2018/MapServer/WMSServer", "image/png"],
    DeportesBD: ["BD", "tm_deportes.centros_deportivos,id,shape", ""],
    Feder: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/01_sicefeder/sicefeder.map", "image/png"],
    Geofondos: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/02_geofondos/geofondos.map", "image/png"],
    //PIIES_prueba:["MS",prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/03_piies_pruebas/piies2018_pruebas.map|educacion.inno_centros_2018","image/png"],
    //PIIES_prueba2:["MS",prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/03_piies_pruebas/piies2018_pruebas.map|educacion.vmap_geofondos","image/png"],
    Estadisticas: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_estadistica/estadistica/MapServer/WmsServer", "image/png"],
    Parques_Empresariales: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/ivace/parques_empresariales_v7/MapServer/WMSServer", "image/png"],
    AVAMET_JSON: ["GeoJSON", prot + "//www.avamet.org/xml/out/mxo.geojson"],
    //Geofondos_Clasificado_Filtro:["MS",prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/02_geofondos/geofondos_clasificado.map|educacion.vmap_geofondos","image/png"],
    Geofondos_Clasificado: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/02_geofondos/geofondos_clasificado.map", "image/png"],
    Geofondos_Clasificado_Parametro: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv6.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/02_geofondos/geofondos_clasificado_parametro.map", "image/png"],
    Eleccions_Generals_2019: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_generales_2019.map", "image/png"],
    Eleccions_Europees_2019: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_europeas_2019.map", "image/png"],
    Eleccions_Locals_2019: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/17_demografiasociedad/elecciones_gva/map/elecciones_locales_2019.map", "image/png"],
    Emergencias_COVID19: ["MS", prot + "//carto.icv.gva.es/arcgis/services/EMERGENCIAS_COVID19/EMERGENCIAS_COVID19/MapServer/WMSServer", "image/png"],
    Asociaciones: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/11_deporteculturaocio/asociaciones/desa_asociaciones_2.map", "image/png"],
    PIMA_Costes: ["AGS", prot + "//carto.icv.gva.es/arcgis/services/tm_medio_ambiente/pima_adapta/MapServer/WmsServer", "image/png"],
    Filtro_Municipios: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/01_cartografia/03_nomenclator/map/nombres_oficiales_municipios.map", "image/png"],
    Centres_Educatius: ["MS", prot + "//terramapas.icv.gva.es/educa_centros", "image/png"],
    //Centres_Educatius_Cluster:["MS",prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacionciencia/centros_educativos/centros_educativos_v2.map","image/png"],
    Centres_Educatius_Cluster: ["MS", prot + "//terramapas.icv.gva.es/educa_centros_wfs", "image/png"],
    Titulaciones_Universitarias: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/12_educacion/titulaciones_universitarias/educa_titulacionesuniversitarias.map", "image/png"],
    Memoria_Democratica: ["MS", prot + "//terramapas.icv.gva.es/cult_memoria_democratica_wfs", "image/png"],
    Centros_Inclusivos: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/19_sociedadybienestar/01_centros_sociales/bien_centros_inclusivos_tipos_wfs.map", "image/png"],
    Red_Erva: ["MS", prot + "//terramapas.icv.gva.es/cgi-bin/mapserv.fcgi?map=/srv_apl/mapserv/servicios/01_cartografia/geodesia/ERVA/carto_geod_rederva.map", "image/png"]
};

///////////////////////////////////////// ESTILOS /////////////////////////////////////////////////////////////
var estiloConsulta = {
    fillColor: "rgb(255,255,255)",
    color: "rgb(255,0,0)",
    weight: 2,
    fillOpacity: 0.2
};

var estiloVacio = {
    fillColor: "rgb(255,255,255)",
    color: "rgb(255,0,0)",
    weight: 0,
    fillOpacity: 0.0
};

var estiloPtoBusquedaSOLR = {
    pane: "capaAnalisis",
    stroke: true,
    width: 1,
    opacity: 1,
    color: "rgb(0,0,0)",
    fill: true,
    fillColor: "rgb(255,255,0)",
    fillOpacity: 0.3
};
var estiloPtoZoomXY = {
    pane: "capaAnalisis",
    interactive: false,
    radius: 6,
    stroke: true,
    width: 1,
    opacity: 1,
    color: "rgb(0,0,0)",
    fill: true,
    fillColor: "rgb(255,0,255)",
    fillOpacity: 0.8
};
var estiloPtoBufferZoomXY = {
    pane: "capaAnalisis",
    interactive: false,
    stroke: true,
    width: 1,
    opacity: 1,
    color: "rgb(0,0,0)",
    fill: true,
    fillColor: "rgb(200,200,200)",
    fillOpacity: 0.3
};


//definicions pel servei de cerca solr
//var servicioBusqueda = "//solr-query.nexusgeografics.com/solrclient.php";
var servicioBusqueda = "//descargas.icv.gva.es/00/buscador";
var epsgSolr = 25830;
var fuentesSolr = {
    "nomenclator": { "label": "Nomenclator;Nomenclator;Nomenclator", "value": "nomenclator" },
    "vias": { "label": "Viales;Vials;Viales", "value": "rtcv.vias" },
    "portales": { "label": "Portales;Portals;Portales", "value": "rtcv.portalpk" },
    "centros_doc": { "label": "Centros docentes;Centres docents;Centros docentes", "value": "centros_docentes" },
    "patrimonio_cultural": { "label": "Patrimonio cultural;Patrimoni cultural;Patrimonio cultural", "value": "patrimonio_cultural" },
    "centros_sanitarios": { "label": "Centros sanitarios;Centres sanitaris;Centros sanitarios", "value": "centros_sanitarios" }
};
