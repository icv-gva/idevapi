# IDEVAPI

API JavaScript del Institut Cartogràfic Valencià para incrustar visores cartográficos interactivos en páginas web.

## Introducción

La interfaz de programación **IDEVAPI** es una funcionalidad más de la Infraestructura de Datos Espaciales Valenciana (IDEV) que nos permite crear visores sencillos, amigables y eficaces de carácter general para la consulta de la Información Geográfica más relevante del Gobierno Valenciano, desarrollado utilizando la librería JavaScript [Leaflet](https://leafletjs.com), gratuita y de código abierto.

El ICV ha desarrollado esta API para **unificar y estandarizar** la visualización de la información geográfica de la Generalitat, facilitar y satisfacer las necesidades de publicación de información sobre mapas y al mismo tiempo, que sea de forma integrada en los portales web y aplicaciones departamentales. Además, con su utilización se asegura la interoperabilidad y reutilización de la información espacial de que dispone el Gobierno Valenciano.

Se trata de una librería JavaScript que permite crear visores cartográficos de una forma sencilla a todo tipo de usuarios sin conocimientos específicos en programación ni en el ámbito de los SIG.

La información que se visualiza como capas base incluye las ortofotos oficiales y la cartografía básica de referencia de la Generalitat generada por el **Institut Cartogràfic Valencià (ICV)**. Permite además que cualquier usuario pueda usar la IDEVAPI para cargar cualquier tipo de servicio estándar, a parte de los servicios disponibles en la IDEV.

IDEVAPI puede integrarse en una aplicación web, e incrustar además funcionalidades y herramientas básicas para acceder y utilizar la información disponible mediante una experiencia de navegación intuitiva y agradable para el usuario.

La librería admite los siguientes tipos de capas y herramientas:
- Capas WMS, WMTS y GeoJSON (incluyendo WFS y ArcGIS Server)
- Controles de mapa: zoom, búsqueda de direcciones, coordenadas, medición, impresión…
- Ventanas emergentes de información y tablas alfanuméricas
- Animación de datos con dimensión temporal
- Filtrado y consulta de entidades geográficas

## Cómo cargar IDEVAPI

IDEVAPI se puede cargar de forma sencilla de varias formas, incluyendo el `<script>` antes del cierre de `</head>`:

### Desde la GVA

```html
<script src="https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js"></script>
```

En este caso, estaremos cargando la última versión patch disponible (por ejemplo 1.3.22).

### Desde jsdelivr (CDN pública)

#### Última versión *major* de IDEVAPI (1.x.x):

```html
<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1/js/idevAPI_core-min.js"></script>
```

#### Última versión *minor* de IDEVAPI (1.3.x):

```html
<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3/js/idevAPI_core-min.js"></script>
```

#### Última versión *patch* de IDEVAPI (1.3.22):

```html
<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.22/js/idevAPI_core-min.js"></script>
```

### Desde local, referenciando el archivo `/js/idevAPI_core-min.js` desde tu aplicación:

1. Descarga la librería IDEVAPI del GitHub del ICV: https://github.com/icv-gva/idevapi
2. Copia la carpeta en tu proyecto.
3. Referencia el archivo desde tu aplicación:

```html
<script src="idevapi-1.3.22/js/idevAPI_core-min.js"></script>
```

Una vez cargada la librería, y definidas las variables `IDEVAPI_global` e `IDEVAPI` que definen la configuración del mapa, se llama a la función `iniciarIdevAPI()` que inicializa el mapa. El siguiente ejemplo muestra un mapa mínimo funcional:

## Ejemplo mínimo

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <script src="https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js"></script>
    <script>
      IDEVAPI_global = {
        idioma: "es"
      };
      IDEVAPI = [
        {
          mapabase: "IMAGEN",
          id: "mapaIDEV1",
          controlBuscador: true,
          extInicio: [
            [37.8, -1.1],
            [40.9, 1.2]
          ],
          capas: [
            {
              tipo: "WMS",
              titulo: "Municipios",
              servicio: {
                url: "https://terramapas.icv.gva.es/0105_Delimitaciones",
                formato: "image/png"
              },
              capas: "ICV.Municipios",
              opacidad: 0.7,
              tablaInfo: {
                activo: true
              }
            }
          ]
        }
      ];
      iniciarIdevAPI(IDEVAPI, IDEVAPI_global)
    </script>
  </head>
  <body>
    <div id="mapaIDEV1" style="height: 500px"></div>
  </body>
</html>
```

## Documentación completa

La documentación de referencia está disponible en la <a href="https://geoidevapi.gva.es/" target="_blank" rel="noopener">Ayuda IDEVAPI</a>.
