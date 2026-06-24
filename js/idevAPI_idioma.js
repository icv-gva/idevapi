var recursoIdiomas = {
  es:{
    //Consultas y filtros
    Seleccionar: "Seleccione valor ...",
    Esperando: "Esperando valores",

    //Errores
    ErrorURLCapa: "La URL del servicio no está definida",
    PeticionFallida: "Petición fallida para (capa,campo): ",
    ErrorAlias: "Alias mal definido para los campos de la capa: ",
    ErrorEstilo: "Estilo mal definido para la capa: ",
    ErrorGeoJSON: "Petición a archivo GeoJSON fallida. Error: ",
    ErrorAGS: "Petición a AGS fallida. Error: ",
    ErrorUsuarioPassword: "Las credenciales para el servicio protegido no son correctas",
    GeoJSONNoDefinido: "Capa GeoJSON local no definida",
    ErrorOrigenGeoJSON: "No es posible crear una capa GeoJSON con el origen de datos definido",
    ErrorSistemaReferencia: "El siguiente sistema de referencia no se encuentra implementado en esta API",

    //Selects y filtros
    SelectSimpleDesconocido: "Hay un select con un identificador de servicio desconocido",
    SelectMultiDesconocido: "Hay un select con un identificador de servicio desconocido o no está bien definido el Select Múltiple",
    NivelConsultas: "Solo se permiten 3 niveles de consulta en los selects",
    SelectDesconocido: "No se encuentra el select con id: ",

    //Leyenda
    PuntosAgrupados: "Nº puntos agrupados",

    //Popups
    SinValor: "Sin valor",
    SinContenido: "Sin contenido",

    //Zoom a Coordenadas
    localizarPunto: "Coordenadas a localizar",
    botonZoom: "Zoom a punto",
    borrarMarker: "Borrar",
    fueraLimites: "El punto se encuentra fuera de los limites de la Comunidad Valenciana",

    //Medir
    measureTitulo1: "Medida de distancias y áreas",
    measureBotonCrear: "Crear nueva medida",
    measureDescInicio: "Empiece a medir añadiendo puntos en el mapa",
    measureCancelar: "Cancelar",
    measureFinalizar: "Finalizar medida",
    measureUltimoPunto: "Último punto (lat / lon WGS84)",
    measureDistancia: "Distancia",
    measureArea: "Area",
    measurePopupLinTitulo: "Medida de distancia",
    measurePopupTitulo: "Medida de área y perímetro",
    measurePopupArea: "Área",
    measurePopupPerimetro: "Perímetro",
    measurePopupCentrar:"Centrar en el área",
    measurePopupBorrar:"Borrar",

    //Buscador
    textoBuscador: "Busca topónimo, dirección o referencia catastral",
    textoBuscador_movil: "Topónimo, dirección o ref catastral",
    errorCatastro: "Se ha devuelto un error al obtener la dirección desde Catastro",

    //Etiquetas Widgets
    etiquetaCapas: "Capas",
    etiquetaConsultas: "Consultas",
    etiquetaLeyenda: "Leyenda",
    etiquetaOpacidad: "Opacidad",
    etiquetaBase: "Mapas base",

    //Widget Impresion
    mensajeImpresion: "Imprimir pantalla.",
    tituloImpresion: "Instituto Cartográfico Valenciano",
    fechaImpresion: "Fecha de impresión: ",

    //Tablas capas
    sinSeleccion: "Ninguna fila seleccionada",
    conSeleccion: "1 fila seleccionada",
    errorCargaTabla: "Petición fallida al cargar tabla para url: ",
    errorIdTabla: "Error al recuperar elemento seleccionado: ",
    faltaId: "El campo identificador de cada elemento no se ha definido.",

    //Widget Localizacion
    mensajePosicion: "Muestra mi posición",
    distanciaAPunto: "Te encuentras a {distance} {unit} de este punto",
    posicionFueraMapa: "Tu localización está fuera de los limites del mapa",

    //Unidades
    unidadPies: "pies",
    unidadMetros: "metros",

    //Carga Capas
    falloPeticionExterna: "Fallo al acceder al servicio externo con la petición: ",
    falloReferenciaWMS: "El servicio WMS no soporta el Sistema de Referencia del visor (EPSG:3857) y no se puede cargar la capa.",
    falloVersionServidor: "El servicio WMS no se puede cargar. Versión del WMS diferente de la 1.3.0 ó 1.1.1, dirección incorrecta, o servidor de mapas caído.",
    errorTamanoArchivo: "Error en la carga del fichero. Tamaño máximo de archivo 10 MB.",
    errorSeleSistema: "Error en la carga del fichero. Debe seleccionar un sistema de referencia.",
    errorCargaFichero: "Error en la carga del fichero.",
    errorExtensionFichero: "Fichero no reconocido (.zip, .json, .geojson, .kml, .kmz, .gpx, .gml, .dxf, .dgn, .csv)",
    capasExternas: "Capas externas",

    //Widget Zoom XY
    vZoomXY: "Zoom a coordenadas",
    vZoomXYSelecSRS: "Seleccione Sistema de Referencia:",
    vZoomXYETRS89_30: "ETRS89 (UTM, Huso 30)",
    vZoomXYETRS89_31: "ETRS89 (UTM, Huso 31)",
    vZoomXYED50_30: "ED50 (UTM, Fus 30)",
    vZoomXYED50_31: "ED50 (UTM, Fus 31)",
    vZoomXYWGS84Dec: "WGS84 (grados decimales)",
    vZoomXYWGS84Sex: "WGS84 (grados sexagesimales)",
    vZoomXYCoords: "Coordenadas a localizar:",
    vZoomXYLon: "Longitud:",
    vZoomXYLat: "Latitud:",
    vZoomXYBorrar: "Borrar",
    vZoomXYZoom: "Zoom a punto",
    vZoomXYcheckBufferZoomXY: "Crear zona de influencia",
    vZoomXYCaptura: "Capturar en mapa",
    legendFuentes:"Fuentes disponibles",
    rbTodos: "Todas",
    btFiltrar: "Filtrar"


  },

  va:{
    //Consultas y filtros
    Seleccionar: "Seleccione valor ...",
    Esperando: "Esperant valors",

    //Errores
    ErrorURLCapa: "La URL del servei no està definida",
    PeticionFallida: "Petició fallida per a (capa,camp): ",
    ErrorAlias: "Alias mal definit per als camps de la capa: ",
    ErrorEstilo: "Estil mal definit per a la capa: ",
    ErrorGeoJSON: "Petició a arxiu GeoJSON fallida. Error: ",
    ErrorAGS: "Petició a AGS fallida. Error: ",
    ErrorUsuarioPassword: "Les credencials per al servei protegit no són correctes",
    GeoJSONNoDefinido: "Capa GeoJSON local no definida",
    ErrorOrigenGeoJSON: "No és possible crear una capa GeoJSON amb l'origen de dades definit",
    ErrorSistemaReferencia: "El següent sistema de referència no es troba implementat en aquesta API",

    //Selects y filtros
    SelectSimpleDesconocido: "Hi ha un select amb un identificador de servei desconegut",
    SelectMultiDesconocido: "Hi ha un select amb un identificador de servei desconegut o no està ben definit el Select Múltiple",
    NivelConsultas: "Només es permeten 3 nivells de consulta en els selects",
    SelectDesconocido: "No es troba el select amb id: ",

    //Leyenda
    PuntosAgrupados: "Núm. punts agrupats",

    //Popups
    SinValor: "Sense valor",
    SinContenido: "Sense contingut",

    //Zoom a Coordenadas
    localizarPunto: "Coordenades a localitzar",
    botonZoom: "Zoom a punt",
    borrarMarker: "Esborrar",
    fueraLimites: "El punt es troba fora dels limites de la Comunitat Valenciana",

    //Medir
    measureTitulo1: "Mesura de distàncies i àrees",
    measureBotonCrear: "Crear nova mesura",
    measureDescInicio: "Comence a mesurar afegint punts en el mapa",
    measureCancelar: "Cancel·lar",
    measureFinalizar: "Finalitzar mesura",
    measureUltimoPunto: "Últim punt (lat / lon WGS84)",
    measureDistancia: "Distància",
    measureArea: "Àrea",
    measurePopupLinTitulo: "Mesura de distància",
    measurePopupTitulo: "Mesura d'àrea i perímetre",
    measurePopupArea: "Àrea",
    measurePopupPerimetro: "Perímetre",
    measurePopupCentrar:"Centrar en l'àrea",
    measurePopupBorrar:"Borrar",

    //Buscador
    textoBuscador: "Busca topònim, direcció o referència cadastral",
    textoBuscador_movil: "Topònim, direcció o ref cadastral",
    errorCatastro: "S'ha tornat un error a l'obtindre la direcció des de Cadastre",

    //Etiquetas Widgets
    etiquetaCapas: "Capes",
    etiquetaConsultas: "Consultes",
    etiquetaLeyenda: "Llegenda",
    etiquetaOpacidad: "Opacitat",
    etiquetaBase: "Mapes base",

    //Widget Impresion
    mensajeImpresion: "Imprimir pantalla.",
    tituloImpresion: "Institut Cartogràfic Valencià",
    fechaImpresion: "Data d'impressió: ",

    //Tablas capas
    sinSeleccion: "Cap fila seleccionada",
    conSeleccion: "1 fila seleccionada",
    errorCargaTabla: "Petició fallida en carregar taula per a la url: ",
    errorIdTabla: "Error en recuperar element seleccionat: ",
    faltaId: "El camp identificador de cada element no s'ha definit.",

    //Widget Localizacion
    mensajePosicion: "Mostra la meua posició",
    distanciaAPunto: "Et trobes a {distance} {unit} d'aquest punt",
    posicionFueraMapa: "La teua localització està fora dels limites del mapa",

    //Unidades
    unidadPies: "peus",
    unidadMetros: "metres",

    //Carga Capas
    falloPeticionExterna: "Error al accedir al servei extern amb la petició: ",
    falloReferenciaWMS: "El servei WMS no suporta el Sistema de Referència del visor (EPSG:3857) i no es pot carregar la capa.",
    falloVersionServidor: "El servei WMS no es pot carregar. Versió del WMS diferent de la 1.3.0 o 1.1.1, direcció incorrecta, o servidor de mapes caigut.",
    errorTamanoArchivo:"Error en la càrrega del fitxer. Grandària màxima d'arxiu 10 MB",
    errorSeleSistema: "Error en la càrrega del fitxer. S'ha de seleccionar un sistema de referència.",
    errorCargaFichero: "Error en la càrrega del fitxer.",
    errorExtensionFichero: "Fitxer no reconegut (.zip, .json, .geojson, .kml, .kmz, .gpx, .gml, .dxf, .dgn, .csv)",
    capasExternas: "Capes externes",

    //Widget ZoomXY
    vZoomXY: "Zoom a coordenades",
    vZoomXYSelecSRS: "Seleccioneu sistema de referència:",
    vZoomXYETRS89_30: "ETRS89 (UTM, Fus 30)",
    vZoomXYETRS89_31: "ETRS89 (UTM, Fus 31)",
    vZoomXYED50_30: "ED50 (UTM, Fus 30)",
    vZoomXYED50_31: "ED50 (UTM, Fus 31)",
    vZoomXYWGS84Dec: "WGS84 (graus decimals)",
    vZoomXYWGS84Sex: "WGS84 (graus sexagesimals)",
    vZoomXYCoords: "Coordenades a localitzar:",
    vZoomXYLon: "Longitud:",
    vZoomXYLat: "Latitud:",
    vZoomXYBorrar: "Esborreu",
    vZoomXYZoom: "Zoom a punt",
    vZoomXYcheckBufferZoomXY: "Crear zona d'influència",
    vZoomXYCaptura: "Captureu en mapa",

    //Buscador solr
    legendFuentes:"Fonts disponibles",
    rbTodos: "Totes",
    btFiltrar: "Filtreu"
  }

};
