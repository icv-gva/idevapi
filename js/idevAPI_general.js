const ordenaArrayObject = (campo, reverse, primer) => {

	const key = primer ?
		function(x) {
		return primer(x[campo])
		} :
		function(x) {
		return x[campo]
		};

	reverse = !reverse ? 1 : -1;

	return function(a, b) {
		return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
	}
}

//Función que traduce los textos del widget pasado en el argumento.
//Se pasa el string del nombre del div padre del widget, y busca los elementos hijos que tengan como clase "js-idioma"
function traduceElementosWidget(elementoInput) {
	//Si se le pasa a la función un trozo de HTML
	if (typeof elementoInput === "object") {
		var elemento = elementoInput;
	//En caso de que sea un String con el nombre del Widget
	} else {
		var elemento = $("[aria-describedby='" + elementoInput + "']");
		if (elemento.length == 0) {
			return;
		}
	}
	$(elemento).find('.idevapi-js-idioma').each( function() {
		var cadena = $(this).attr('data-string');
		//Para los títulos de los diálogos en JQuery
		if ($(this).hasClass("ui-dialog-content") && $(this).hasClass("ui-widget-content")){
			$(this).dialog("option", "title", MENSAJES[cadena]);
		//Para los botones que tengan texto en 'title'
		} else if ($(this).prop('title') !== "") {
			$(this).prop('title', MENSAJES[cadena]);
		//Para los botones que tengan texto en 'placeholder'
		} else if ($(this).prop('placeholder') !== undefined) {
			$(this).prop('placeholder', MENSAJES[cadena]);
		//Para los textos normales
		} else {
			$(this).text(MENSAJES[cadena]);
		}
	});
}

//Añade la clase según el estilo seleccionado para las ventanas
function modificaEstiloVentanas (idOElemento, estilo) {
	var ventana;
	if (typeof idOElemento === "string") {
		ventana = $("div[aria-describedby='" + idOElemento + "']");
	} else {
		// Asumimos que es un objeto jQuery del contenido, buscamos su parent .ui-dialog
		ventana = idOElemento.closest(".ui-dialog");
	}

	if (ventana && ventana.length > 0) {
		// Siempre añadimos idevapi-root al wrapper del diálogo para que los estilos scoped funcionen
		$(ventana).addClass("idevapi-root");

		if (estilo == "GVA") {
			$(ventana).addClass("ui-widgetGVA");
			var cabecera = $(ventana).find(".ui-widget-header");
			if (cabecera.length > 0) {
				$(cabecera).addClass("ui-widget-headerGVA");
			};
			var botonCerrar = $(ventana).find(".ui-dialog-titlebar-close");
			if (botonCerrar.length > 0) {
				$(botonCerrar).addClass("ui-dialog-titlebar-closeGVA");
			}
			var botonesVentana = $(ventana).find(".idevapi-ventana-boton");
			$(botonesVentana).each(function(i){
				$(this).addClass("idevapi-ventana-boton-gva");
			});
		} else if (estilo == "ICV" || estilo == "" || estilo == undefined) {
			// Por defecto o ICV usamos el estilo azul corporativo
			$(ventana).addClass("ui-widgetICV");
			var cabecera = $(ventana).find(".ui-widget-header");
			if (cabecera.length > 0) {
				$(cabecera).addClass("ui-widget-headerICV");
			};
		}
	}
}

//Función que obvia en los filtros los acentos y mayúsculas
function normalizeText(text) {
	return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

//Función que filtra un JSON según un campo, un valor y tipo.
//El tipo puede ser "like" que encuentra cualquier parte del string
//El tipo "equal" encuentra solo coincidencias exactas
//Si a la función se le pasa un GeoJSON, devuelve un GeoJSON
//Si se le pasa un vector con valores, se devuelve el mismo vector filtrado
function filtroGeoJSON (capa,campo,valor,tipo,operador){

    if (capa.features !== undefined){ var datos = capa.features; } else { var datos = capa; }
    if (tipo == undefined){tipo = "equal";}
	var res;
	if (tipo == "numero") {
		res = $.grep(datos, function(dato) {
            let campoValor = parseFloat(dato.properties[campo]); // Convertir a número
            let valorNumerico = parseFloat(valor); // Convertir el valor a número también

            if (isNaN(campoValor) || isNaN(valorNumerico)) return false; // Si no es numérico, descartar
            switch (operador) {
                case ">":
                    return campoValor > valorNumerico;
                case "<":
                    return campoValor < valorNumerico;
                case ">=":
                    return campoValor >= valorNumerico;
                case "<=":
                    return campoValor <= valorNumerico;
                case "!=":
                    return campoValor !== valorNumerico;
                case "==":
                case "=": // Aceptamos "=" como equivalente a "=="
                    return campoValor === valorNumerico;
                default:
                    console.warn("Operador no reconocido:", operador);
                    return false;
            }
        });
	} else if (tipo == "texto") {
        let palabras = normalizeText(valor).split(/[ ,;\/]+/).filter(Boolean);
        res = $.grep(datos, function(dato) {
            let campoTexto = normalizeText(dato.properties[campo]);
            return palabras.every(palabra => campoTexto.includes(palabra));
        });
	} else if (tipo == "fecha") {
		let [fechaInicio, fechaFin] = valor;
        let hoy = new Date().toISOString().split('T')[0]; // Fecha de hoy en formato 'YYYY-MM-DD'

        res = $.grep(datos, function(dato) {
            let campoFecha = dato.properties[campo];
            if (!campoFecha) return false;

            if (fechaInicio && fechaFin) {
                return campoFecha >= fechaInicio && campoFecha <= fechaFin;
            } else if (fechaInicio) {
                return campoFecha >= fechaInicio && campoFecha <= hoy;
            } else if (fechaFin) {
                return campoFecha <= fechaFin;
            } else {
                return true; // Si ambas fechas están vacías, devolver todos los registros
            }
        });
	} else if (tipo == "like") {
        var res = $.grep(datos, function(dato) {
            return dato.properties[campo].indexOf(valor) !== -1;
        });

    } else {
        var res = $.grep(datos, function(dato) {
            return dato.properties[campo] === valor;
        });
    }
    if (capa.features !== undefined){
        var res2 = {};
        res2.type = "FeatureCollection";
        res2.features = res;
    } else {
        var res2 = res;
    }
    return res2;
}
//Función general para filtrar un JSON (obj) por un campo (prop) y un valor (valor)
function obtenerReg(obj,prop,valor) {
	return obj.filter(
		function(obj){return obj[prop] == valor}
	);
};

//Función que filtra los elementos (vector) de una capa GeoJSON según un bounding box
function filtroGeoJSONBBox (bbox,elementos) {
	var xMin = bbox._southWest.lng;
	var yMin = bbox._southWest.lat;
	var xMax = bbox._northEast.lng;
	var yMax = bbox._northEast.lat;
	var extension = turf.polygon([[[xMin,yMin],[xMin,yMax],[xMax,yMax],[xMax,yMin],[xMin,yMin]]]);
	var contador = 0;
	for (var i = 0; i < elementos.length; i++) {
		var intersecta = turf.booleanIntersects(elementos[i], extension);
		if (intersecta){
			contador++;
		}
	}
	return contador;
}

//Función que recibe un vector con elementos de una capa GeoJSON, y devuelve ordenados la lista con valores únicos
function unique (items,campo,ordenar) {
	var lookup = {};
	var result = [];
	for (var item, i = 0; item = items[i++];) {
		var valor = item.properties[campo];
		if (!(valor in lookup)) {
			lookup[valor] = 1;
			result.push(valor);
		}
	}
	if (ordenar == "ASC") {
		result.sort();
	} else if (ordenar == "DES") {
		result.sort().reverse();
	}
	return result;
}

//Función que realiza un zoom a una capa
function zoomAElementosGeoJSON (mapa,capa){
	let bounds;
    try {
        bounds = capa.getBounds();
        if (!bounds.isValid()) {
            throw new Error("Bounds no válidos");
        }
    } catch (e) {
        console.warn("La capa no tiene elementos o los bounds no son válidos. Usando límites por defecto.");
		if (IDEVAPI)
        bounds = L.latLngBounds([[37.832,-0.41],[40.794,-0.4]]);
    }

    mapa.fitBounds(bounds, {
        maxZoom: 16,
        animate: true,
        duration: 1.0
    });
}
//SELECT2 - Función que elimina la selección del select cuando se elimina elementos
function select2NoSelect (select) {
	$(select).on('select2:unselecting', function(ev) {
		if (ev.params.args.originalEvent) {
			// When unselecting (in multiple mode)
			ev.params.args.originalEvent.stopPropagation();
		} else {
			// When clearing (in single mode)
			$(this).one('select2:opening', function(ev) { ev.preventDefault(); });
			/*console.log($(this).val());
			if ($(this).val()== ""){
				$(this).val(null);
			}
			console.log($(this).val());*/
		}
	});
}

// MODIFICACIÓN COORDENADAS PUNTOS de capas GeoJSON. Hecho para modificar estaciones Red ERVA (A eliminar cuando se lea desde BD PostgreSQL)
function modificaCoordenadas (modCoords,datos,campo) {
	for (var i = 0; i < modCoords.length; i++) {
		var idEstacion = modCoords[i][0];
		for (var j = 0; j < datos.features.length; j++) {
			var idEstacionGJ = datos.features[j].properties[campo];
			if (idEstacion == idEstacionGJ) {
				datos.features[j].geometry.coordinates[0] = modCoords[i][1][0];
				datos.features[j].geometry.coordinates[1] = modCoords[i][1][1];
			}
		}
	}
	return datos;
}

//Genera un número entero entre el rango indicado en min y max
//Usado para generar un Id. de servicio en caso de que no sea definido éste en "servicio.id"
function randomNumberFromRange(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}