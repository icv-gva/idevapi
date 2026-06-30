const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const entries = [
    // Core JS files
    { in: 'js/idevAPI_core.js', out: 'js/idevAPI_core-min.js' },
    { in: 'js/idevAPI_config.js', out: 'js/idevAPI_config-min.js' }, // Generado aunque core no lo use -min por ahora
    { in: 'js/idevAPI_general.js', out: 'js/idevAPI_general-min.js' },
    { in: 'js/idevAPI_capas_GeoJSON.js', out: 'js/idevAPI_capas_GeoJSON-min.js' },
    { in: 'js/idevAPI_consulta.js', out: 'js/idevAPI_consulta-min.js' },
    { in: 'js/idevAPI_filtro.js', out: 'js/idevAPI_filtro-min.js' },
    { in: 'js/idevAPI_leyenda.js', out: 'js/idevAPI_leyenda-min.js' },
    { in: 'js/idevAPI_idioma.js', out: 'js/idevAPI_idioma-min.js' },
    { in: 'js/idevAPI_popup.js', out: 'js/idevAPI_popup-min.js' },
    { in: 'js/idevAPI_tabla.js', out: 'js/idevAPI_tabla-min.js' },
    
    // Patches
    { in: 'js/patches/iso8601-parser.js', out: 'js/patches/iso8601-parser-min.js' },
    { in: 'js/patches/ajax-adapter.js', out: 'js/patches/ajax-adapter-min.js' },
    
    // CSS files
    { in: 'css/idevAPI_estilos.css', out: 'css/idevAPI_estilos-min.css' },
    
    // Widgets
    { in: 'wg/idevAPI_widgets.js', out: 'wg/idevAPI_widgets-min.js' },
    { in: 'wg/idevAPI_widgets.css', out: 'wg/idevAPI_widgets-min.css' },
    { in: 'wg/idevAPI_zoomXY.js', out: 'wg/idevAPI_zoomXY-min.js' },
    
    // Plugins locales con modificaciones
    { in: 'lf_194/plugins/leaflet.wms.js', out: 'lf_194/plugins/leaflet.wms-min.js' },
    { in: 'lf_194/plugins/leaflet.measure/leaflet-measure.js', out: 'lf_194/plugins/leaflet.measure/leaflet-measure-min.js' }
];

async function build() {
    console.log('IDEVAPI 1.3.24');
    
    for (const entry of entries) {
        const inputPath = path.join(__dirname, entry.in);
        const outputPath = path.join(__dirname, entry.out);
        
        if (!fs.existsSync(inputPath)) {
            console.warn(`⚠️ Archivo no encontrado: ${entry.in}`);
            continue;
        }

        try {
            await esbuild.build({
                entryPoints: [inputPath],
                outfile: outputPath,
                minify: true,
                sourcemap: false,
                // Si es CSS, esbuild lo detecta por la extensión
                target: entry.in.endsWith('.js') ? ['es2015'] : undefined,
                loader: entry.in.endsWith('.css') ? { '.css': 'css' } : undefined
            });
            console.log(`✅ Procesado: ${entry.in} -> ${entry.out}`);
        } catch (error) {
            console.error(`❌ Error al procesar ${entry.in}:`, error);
        }
    }
    
    console.log('Build completado.');
}

build().catch(() => process.exit(1));
