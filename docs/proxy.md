# Proxy automático para WMS y Catastro

No hace falta configurar un proxy en el visor. IDEVAPI intenta acceder directamente al servicio y utiliza `https://descargas.icv.gva.es/00/proxy/` solamente como recuperación. El servicio antiguo ya no se utiliza.

## Compatibilidad

Las opciones antiguas `servicio.usarProxy` y `proxy` pueden eliminarse o mantenerse con `true` o `false`: no fuerzan ni impiden el proxy automático. No es necesario cambiar las configuraciones existentes para adoptar este comportamiento.

## Comportamiento

| Petición | Acceso directo | Recuperación |
|---|---|---|
| WMS GetFeatureInfo | Lectura de texto mediante AJAX | Un intento mediante proxy si el navegador devuelve un error de red/CORS (`status: 0`) |
| XML de referencia catastral | Lectura XML mediante AJAX | La misma recuperación |
| Imagen WMS GetMap, incluida dimensión temporal | Carga de imagen normal, sin exigir CORS | Un intento mediante proxy si la imagen no carga |

Una imagen puede mostrarse sin permiso CORS. Por eso no se hace una consulta previa de cabeceras ni se exige `Access-Control-Allow-Origin: *` para visualizar WMS.

Para leer texto o XML, el navegador acepta tanto `*` como un origen autorizado específicamente. Cuando CORS bloquea la lectura, JavaScript tampoco puede inspeccionar las cabeceras. Un error de red puede producir el mismo resultado: el intento mediante proxy no demuestra que la causa haya sido CORS.

Los errores HTTP legibles (por ejemplo, 404 o 500), XML inválido, cancelaciones y tiempos de espera no provocan reintentos AJAX. Si el proxy también falla, se conserva la vía de error de la funcionalidad. No hay bucles de reintento ni se modifica el transporte AJAX de otros módulos.

La URL se construye con un solo separador después de la base del proxy, conservando la consulta del servicio:

```text
https://descargas.icv.gva.es/00/proxy/?https://servidor.example/wms?SERVICE=WMS&REQUEST=GetMap
```

El proxy debe permitir el destino y devolver una respuesta utilizable desde el origen del visor. No soluciona una indisponibilidad del servicio ni sustituye su autenticación.

## Verificación

Ejecutar las pruebas locales con `node --test`. En un visor real, comprobar en la pestaña Red del navegador que las respuestas directas válidas no pasan por el proxy y que un servicio sin CORS utiliza como máximo un segundo intento para cada consulta de información o XML catastral.
