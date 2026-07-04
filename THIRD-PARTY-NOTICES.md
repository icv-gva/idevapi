# Third-Party Notices

IDEVAPI incluye las siguientes librerías open-source de terceros. Este archivo satisface los requisitos de atribución de las licencias MIT, BSD y Apache.

> **Nota sobre los textos legales**: Los bloques de código con el texto de cada licencia se reproducen en su idioma original (inglés) porque **únicamente esas versiones tienen valor legal**. Las traducciones de los metadatos y descripciones que aparecen en este archivo son informales y no vinculan jurídicamente; en caso de discrepancia prevalece el texto en inglés publicado por la Free Software Foundation, el proyecto original o la Apache Software Foundation.

---

## Librerías de terceros principales

### jQuery 3.7.1

- **Licencia**: MIT
- **Copyright**: OpenJS Foundation and other contributors, https://openjsf.org/
- **Fuente**: https://jquery.com/
- **Texto de la licencia**: https://jquery.org/license/
- **Ruta local**: `lib/jq_3.7.1/jquery-3.7.1-min.js`
- **Usado por**: Todos los visores — librería DOM base; requerida por Select2, DataTables, jQuery UI y el núcleo de IDEVAPI

```
Copyright OpenJS Foundation and other contributors, https://openjsf.org/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### jQuery UI 1.12.1

- **Licencia**: MIT
- **Copyright**: jQuery Foundation and other contributors, https://jquery.org/
- **Fuente**: https://jqueryui.com/
- **Texto de la licencia**: https://github.com/jquery/jquery-ui/blob/1.12.1/LICENSE.txt
- **Ruta local**: `lib/jq-ui-1.12.1/jquery-ui.min.js`, `lib/jq-ui-1.12.1/jquery.ui.touch-punch.min.js`, `lib/jq-ui-1.12.1/jquery-ui.css`
- **Nota**: Localized CSS counterpart (`jquery-ui.css`) vendored as of `localize-external-assets` (2026-07-05).
- **Usado por**: Widgets de diálogo, redimensionado, arrastre y botón en las interfaces de los visores

```
Copyright jQuery Foundation and other contributors, https://jquery.org/

This software consists of voluntary contributions made by many
individuals. For exact contribution history, see the revision history
available at https://github.com/jquery/jquery-ui

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### DataTables 1.10.21

- **Licencia**: MIT
- **Copyright**: 2008-2015 SpryMedia Limited, http://datatables.net
- **Fuente**: https://datatables.net/
- **Texto de la licencia**: https://datatables.net/license/mit
- **Ruta local**: `lib/dataTables_1.10.21/datatables-min.js`, `lib/dataTables_1.10.21/datatables.min.css`
- **Nota**: Localized CSS counterpart (`datatables.min.css`) vendored as of `localize-external-assets` (2026-07-05).
- **Usado por**: Visualización tabular de atributos en los paneles de información del visor

```
Copyright (c) 2008-2015 SpryMedia Limited
http://datatables.net

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### Select2 4.1.0

- **Licencia**: MIT
- **Copyright**: 2012-2017 Kevin Brown, Igor Vaynberg, and Select2 contributors
- **Fuente**: https://select2.org/
- **Texto de la licencia**: https://github.com/select2/select2/blob/4.1.0-rc.0/LICENSE.md
- **Ruta local**: `lib/select2_4.1.0/select2.min.js`
- **Usado por**: Desplegables enriquecidos en los filtros del visor y selectores de capas

```
The MIT License (MIT)

Copyright (c) 2012-2017 Kevin Brown, Igor Vaynberg, and Select2 contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### proj4js 2.15.0

- **Licencia**: MIT
- **Copyright**: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral, and Calvin Metcalf
- **Fuente**: https://github.com/proj4js/proj4js
- **Texto de la licencia**: https://github.com/proj4js/proj4js/blob/main/LICENSE.md
- **Ruta local**: `lib/proj4js-2.15.0/proj4.js`
- **Usado por**: Reproyección de coordenadas para capas WMS/WMTS en proyecciones distintas a Web Mercator

```
Copyright (c) 2014, Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons,
Olivier Terral and Calvin Metcalf

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### Turf.js 6.5.0

- **Licencia**: MIT
- **Copyright**: 2019 Morgan Herlocker
- **Fuente**: https://turfjs.org/
- **Texto de la licencia**: https://github.com/Turfjs/turf/blob/v6.5.0/LICENSE
- **Ruta local**: `lib/turf_6.5.0/turf.min.js`
- **Usado por**: Operaciones geométricas (intersección de polígonos, buffer) para consultas espaciales

```
The MIT License (MIT)

Copyright (c) 2019 Morgan Herlocker

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

---

## Leaflet y plugins

### Leaflet 1.9.4

- **Licencia**: BSD-2-Clause
- **Copyright**: 2010-2023 Volodymyr Agafonkin; 2010-2011 CloudMade
- **Fuente**: https://leafletjs.com/
- **Texto de la licencia**: https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE
- **Ruta local**: `lf_194/leaflet.js`
- **Usado por**: Motor de renderizado de mapas base para todos los visores

```
BSD 2-Clause License

Copyright (c) 2010-2023, Volodymyr Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### Leaflet.WMS

- **Licencia**: MIT
- **Copyright**: 2014-2016 Houston Engineering, Inc.
- **Fuente**: https://github.com/heigeo/leaflet.wms
- **Texto de la licencia**: https://github.com/heigeo/leaflet.wms/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/leaflet.wms-min.js`
- **Usado por**: Capa de GetFeatureInfo WMS para consultas al hacer clic en el mapa

```
The MIT License (MIT)

Copyright (c) 2014-2016 Houston Engineering, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Leaflet.MarkerCluster

- **Licencia**: MIT
- **Copyright**: 2012 David Leaver
- **Fuente**: https://github.com/Leaflet/Leaflet.markercluster
- **Texto de la licencia**: https://github.com/Leaflet/Leaflet.markercluster/blob/master/MIT-LICENCE.txt
- **Ruta local**: `lf_194/plugins/markerCluster/leaflet.markercluster.js`
- **Usado por**: Visualización agrupada de puntos para capas GeoJSON/WFS de alta densidad

```
Copyright 2012 David Leaver

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Leaflet.GestureHandling

- **Licencia**: MIT
- **Copyright**: 2018 elmarquis
- **Fuente**: https://github.com/elmarquis/Leaflet.GestureHandling
- **Texto de la licencia**: https://github.com/elmarquis/Leaflet.GestureHandling/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/gestureHandling/leaflet-gesture-handling.min.js`
- **Usado por**: Evita el secuestro del scroll del mapa en dispositivos táctiles

```
MIT License

Copyright (c) 2018 elmarquis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Leaflet.Measure

- **Licencia**: MIT
- **Copyright**: ljagostini and contributors
- **Fuente**: https://github.com/ljagostini/leaflet-measure
- **Texto de la licencia**: https://github.com/ljagostini/leaflet-measure (LICENSE in repo root)
- **Ruta local**: `lf_194/plugins/leaflet.measure/leaflet-measure-min.js`
- **Usado por**: Herramienta de medición de distancias y áreas en el mapa

```
MIT License

Copyright (c) ljagostini and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Leaflet.Locate

- **Licencia**: MIT
- **Copyright**: 2014 Dominik Moritz
- **Fuente**: https://github.com/domoritz/leaflet-locatecontrol
- **Texto de la licencia**: https://github.com/domoritz/leaflet-locatecontrol/blob/gh-pages/LICENSE.md
- **Ruta local**: `lf_194/plugins/locatePosition/L.Control.Locate.min.js` (+ 2 CSS)
- **Usado por**: Botón de geolocalización que centra el mapa en la posición del usuario

```
The MIT License (MIT)

Copyright (c) 2014 Dominik Moritz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### Leaflet Browser Print

- **Licencia**: MIT
- **Copyright**: Rowan Winsemius and contributors
- **Fuente**: https://github.com/rowanwins/leaflet-browser-print
- **Texto de la licencia**: https://github.com/rowanwins/leaflet-browser-print/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/leafletPrint/leaflet.browser.print.js`
- **Usado por**: Funcionalidad de impresión/exportación del mapa

```
MIT License

Copyright (c) Rowan Winsemius and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Leaflet TimeDimension

- **Licencia**: MIT
- **Copyright**: 2014 ICTS SOCIB - Servei d'observacio i prediccio costaner de les Illes Balears
- **Fuente**: https://github.com/socib/Leaflet.TimeDimension
- **Texto de la licencia**: https://github.com/socib/Leaflet.TimeDimension/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/timedimension/leaflet.timedimension.src.js`
- **Usado por**: Animación con control deslizante de tiempo para capas WMS temporales

```
Copyright (c) 2014 ICTS SOCIB - Servei d'observacio i prediccio costaner de les Illes Balears.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### Leaflet Sync

- **Licencia**: BSD-3-Clause
- **Copyright**: 2013-2017 Bjorn Sandvik / Jan Pieter Waagmeester
- **Fuente**: https://github.com/jieter/Leaflet.Sync
- **Texto de la licencia**: https://github.com/jieter/Leaflet.Sync/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/syncMaps/L.Map.Sync.js`
- **Usado por**: Vistas sincronizadas de varios mapas (por ejemplo, comparación en paneles divididos)

```
Copyright (c) 2013-2017 Bjorn Sandvik / Jan Pieter Waagmeester
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the author nor the names of its contributors may be
      used to endorse or promote products derived from this software without
      specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### Leaflet.Control.Layers.Tree

- **Licencia**: BSD-3-Clause
- **Copyright**: 2017 Javier Jimenez Shaw
- **Fuente**: https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree
- **Texto de la licencia**: https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/layersTree/L.Control.Layers.Tree.js`
- **Usado por**: Selector de capas con árbol jerárquico en el control de capas

```
BSD 3-Clause License

Copyright (c) 2017, Javier Jimenez Shaw
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### Leaflet.Control.Opacity

- **Licencia**: MIT
- **Copyright**: lennardv2 and contributors
- **Fuente**: https://github.com/lennardv2/Leaflet.Control.Opacity
- **Texto de la licencia**: https://github.com/lennardv2/Leaflet.Control.Opacity (LICENSE in repo root)
- **Ruta local**: `lf_194/plugins/controlOpacity/L.Control.Opacity.js`
- **Usado por**: Control deslizante de opacidad por capa

```
MIT License

Copyright (c) lennardv2 and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### Proj4Leaflet

- **Licencia**: BSD-2-Clause
- **Copyright**: 2012 Kartena AB
- **Fuente**: https://github.com/kartena/Proj4Leaflet
- **Texto de la licencia**: https://github.com/kartena/Proj4Leaflet/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/proj4leaflet/proj4leaflet.js`
- **Usado por**: Une la reproyección de coordenadas de proj4js con las definiciones CRS de Leaflet

```
Copyright (c) 2012, Kartena AB
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### Leaflet.LayersSupport

- **Licencia**: MIT
- **Copyright**: jkutianski and contributors
- **Fuente**: https://github.com/jkutianski/Leaflet.LayersSupport
- **Texto de la licencia**: https://github.com/jkutianski/Leaflet.LayersSupport (LICENSE in repo root)
- **Ruta local**: `lf_194/plugins/layersupport/layersupport.js`
- **Usado por**: Utilidades de gestión de capas para configuraciones multi-capa en visores

```
MIT License

Copyright (c) jkutianski and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### esri-leaflet

- **Licencia**: Apache-2.0
- **Copyright**: 2014-2019 Environmental Systems Research Institute, Inc.
- **Fuente**: https://github.com/Esri/esri-leaflet
- **Texto de la licencia**: https://github.com/Esri/esri-leaflet/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/esri-leaflet-vector/esri-leaflet-min.js`
- **Usado por**: Librería base para la integración con servicios REST de Esri ArcGIS

```
Copyright (c) 2014-2019 Environmental Systems Research Institute, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### esri-leaflet-vector

- **Licencia**: Apache-2.0
- **Copyright**: 2014-2024 Environmental Systems Research Institute, Inc.
- **Fuente**: https://github.com/Esri/esri-leaflet-vector
- **Texto de la licencia**: https://github.com/Esri/esri-leaflet-vector/blob/master/LICENSE
- **Ruta local**: `lf_194/plugins/esri-leaflet-vector/esri-leaflet-vector-min.js`
- **Usado por**: Soporte de capas vectoriales de Esri en Leaflet

```
Copyright (c) 2014-2024 Environmental Systems Research Institute, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### Roboto fonts

- **Fuente**: Roboto (Regular, Bold) y Roboto Condensed (Regular)
- **Licencia**: Apache-2.0
- **Copyright**: Google LLC
- **Fuente original**: https://fonts.google.com/specimen/Roboto
- **Texto de la licencia**: https://www.apache.org/licenses/LICENSE-2.0
- **Ruta local**: `css/fonts/roboto/Roboto-Regular.ttf`, `css/fonts/roboto/Roboto-Bold.ttf`, `css/fonts/roboto/RobotoCondensed-Regular.ttf`
- **Localizado en**: cambio `localize-external-assets` (2026-07-05)
- **Usado por**: Tipografía base del visor (familia Roboto) y títulos de capa (Roboto Condensed)

### Arial Narrow Bold

- **Fuente**: Arial Narrow Bold
- **Licencia**: Microsoft proprietary. Used under the institutional context of the Institut Cartogràfic Valencià / Generalitat Valenciana.
- **Fuente original**: `https://icvficherosweb.icv.gva.es/ICV/repositorio/fuentes/arial_narrow/arial_narrow_bold.ttf`
- **Ruta local**: `css/fonts/arial_narrow/arial_narrow_bold.ttf`
- **Localizado en**: cambio `localize-external-assets` (2026-07-05)
- **Usado por**: Contador numérico de clusters de marcadores (GeoJSON)

---

## Resumen

| Librería | Versión | Licencia |
|---------|---------|---------|
| jQuery | 3.7.1 | MIT |
| jQuery UI | 1.12.1 | MIT |
| DataTables | 1.10.21 | MIT |
| Select2 | 4.1.0 | MIT |
| proj4js | 2.15.0 | MIT |
| Turf.js | 6.5.0 | MIT |
| Leaflet | 1.9.4 | BSD-2-Clause |
| Leaflet.WMS | — | MIT |
| Leaflet.MarkerCluster | — | MIT |
| Leaflet.GestureHandling | — | MIT |
| Leaflet.Measure | — | MIT |
| Leaflet.Locate | 0.79.0 | MIT |
| Leaflet Browser Print | — | MIT |
| Leaflet TimeDimension | — | MIT |
| Leaflet Sync | — | BSD-3-Clause |
| Leaflet.Control.Layers.Tree | — | BSD-3-Clause |
| Leaflet.Control.Opacity | — | MIT |
| Proj4Leaflet | — | BSD-2-Clause |
| Leaflet.LayersSupport | — | MIT |
| esri-leaflet | — | Apache-2.0 |
| esri-leaflet-vector | — | Apache-2.0 |

El código del núcleo de IDEVAPI (`wg/idevAPI_widgets.js`, `js/idevAPI_*.js`, `css/idevAPI_estilos.css`, `build.js`) es código propio del ICV y **no** se incluye en este fichero de atribución de terceros; se distribuye bajo la Licencia Pública de la Unión Europea v. 1.2 (EUPL-1.2) — ver [LICENSE](LICENSE).
