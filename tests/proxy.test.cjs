const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

function setup(outcomes) {
    const calls = [];
    const $ = {
        ajax(options) {
            calls.push(options);
            const outcome = outcomes.shift();
            const xhr = { status: outcome.status, abort() {} };
            if (outcome.status === 200 && !outcome.reason) options.success(outcome.data, 'success', xhr);
            else options.error(xhr, outcome.reason || 'error', 'failure');
            return xhr;
        }
    };
    const context = vm.createContext({ $, location: { protocol: 'https:' } });
    vm.runInContext(fs.readFileSync(path.join(root, 'js/idevAPI_config.js'), 'utf8'), context);
    return { context, calls };
}

for (const flag of [undefined, true, false]) {
    test(`direct XML succeeds without proxy, legacy flag ${flag}`, () => {
        const { context, calls } = setup([{ status: 200, data: '<xml/>' }]);
        let result;
        context.idevapiAjaxConProxy({ url: 'https://catastro.example/xml?rc=1', dataType: 'xml',
            proxy: flag, usarProxy: flag, success(data) { result = data; } });
        assert.equal(result, '<xml/>');
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://catastro.example/xml?rc=1');
        assert.equal(calls[0].dataType, 'xml');
    });
    test(`CORS/network failure retries once, legacy flag ${flag}`, () => {
        const { context, calls } = setup([{ status: 0 }, { status: 200, data: 'info' }]);
        let successes = 0;
        let errors = 0;
        context.idevapiAjaxConProxy({ url: 'https://wms.example/?SERVICE=WMS&REQUEST=GetFeatureInfo',
            proxy: flag, usarProxy: flag, success(data) { assert.equal(data, 'info'); successes++; },
            error() { errors++; } });
        assert.equal(successes, 1);
        assert.equal(errors, 0);
        assert.deepEqual(calls.map(c => c.url), [
            'https://wms.example/?SERVICE=WMS&REQUEST=GetFeatureInfo',
            'https://descargas.icv.gva.es/00/proxy/?https://wms.example/?SERVICE=WMS&REQUEST=GetFeatureInfo'
        ]);
    });
}

for (const outcome of [{ status: 404 }, { status: 500 }, { status: 200, reason: 'parsererror' },
    { status: 0, reason: 'abort' }, { status: 0, reason: 'timeout' }]) {
    test(`does not mask HTTP/parse/abort/timeout errors: ${JSON.stringify(outcome)}`, () => {
        const { context, calls } = setup([outcome]);
        let errors = 0;
        context.idevapiAjaxConProxy({ url: 'https://service.example/', error() { errors++; } });
        assert.equal(calls.length, 1);
        assert.equal(errors, 1);
    });
}

test('failed proxy terminates with one error; already proxied URLs are never nested', () => {
    const { context, calls } = setup([{ status: 0 }, { status: 0 }, { status: 0 }]);
    let errors = 0;
    context.idevapiAjaxConProxy({ url: 'https://example.test/?a=1&b=2', error() { errors++; } });
    assert.equal(errors, 1);
    assert.equal(calls.length, 2);
    context.idevapiAjaxConProxy({ url: calls[1].url, error() { errors++; } });
    assert.equal(calls.length, 3);
    assert.equal(errors, 2);
});

test('image fallback preserves the complete URL and retries at most once', () => {
    const { context } = setup([]);
    const image = { src: 'https://wms.example/?request=GetMap&bbox=1,2,3,4' };
    assert.equal(context.idevapiReintentaImagen({ target: image }), true);
    assert.equal(image.src, 'https://descargas.icv.gva.es/00/proxy/?https://wms.example/?request=GetMap&bbox=1,2,3,4');
    assert.equal(context.idevapiReintentaImagen({ target: image }), false);
    assert.equal(context.idevapiReintentaImagen({ target: { src: 'data:image/gif;base64,AAA' } }), false);
});

test('WMS GetFeatureInfo uses automatic transport and preserves callback context/error result', () => {
    const { context, calls } = setup([{ status: 0 }, { status: 200, data: '<html>info</html>' }, { status: 503 }]);
    context.L = { WMS: { Source: { extend: definition => definition } } };
    vm.runInContext(fs.readFileSync(path.join(root, 'js/idevAPI_popup.js'), 'utf8'), context);
    const source = context.MySource;
    source.ajax('https://wms.example/?request=GetFeatureInfo', function (data) {
        assert.equal(this, source);
        assert.equal(data, '<html>info</html>');
    });
    source.ajax('https://wms.example/?request=GetFeatureInfo', function (data) {
        assert.equal(this, source);
        assert.equal(data, 'error');
    });
    assert.equal(calls.length, 3);
});

test('WMS initialization never forces proxy for either legacy option', () => {
    const core = fs.readFileSync(path.join(root, 'js/idevAPI_core.js'), 'utf8');
    assert.doesNotMatch(core, /if\s*\(capa\.servicio\.(usarProxy|proxy)\)/);
    const widgets = fs.readFileSync(path.join(root, 'wg/idevAPI_widgets.js'), 'utf8');
    assert.match(widgets, /idevapiAjaxConProxy\(\{\s*url: enlace,/);
    assert.equal(setup([]).context.proxyIDEVAPI, 'https://descargas.icv.gva.es/00/proxy/');
});

// Exercise the actual WMS plugin with a minimal Leaflet rendering harness.
function wmsHarness() {
    const images = [];
    const removed = [];
    function Layer() {}
    Layer.extend = function (definition) {
        const Parent = this;
        function Child(...args) { if (this.initialize) this.initialize(...args); }
        Child.prototype = Object.assign(Object.create(Parent.prototype), definition);
        Child.extend = Parent.extend;
        return Child;
    };
    const L = {
        Layer, TileLayer: { WMS: {} }, tileLayer: { wms() {} },
        extend: Object.assign,
        setOptions(object, options) { object.options = Object.assign({}, object.options, options); },
        CRS: { EPSG4326: {} },
        Util: { getParamString(params, url) { return (url.includes('?') ? '&' : '?') + new URLSearchParams(params); } },
        imageOverlay(url, bounds, options) {
            const image = {
                _url: url, options,
                addTo() { return this; },
                once(event, fn, ctx) { this.load = () => fn.call(ctx); },
                setOpacity(value) { this.opacity = value; },
                bringToFront() {}, bringToBack() {}
            };
            images.push(image);
            return image;
        }
    };
    const context = vm.createContext({ L });
    vm.runInContext(fs.readFileSync(path.join(root, 'lf_194/plugins/leaflet.wms.js'), 'utf8'), context);
    const bounds = { getNorthWest: () => ({ x: 1, y: 4 }), getSouthEast: () => ({ x: 3, y: 2 }) };
    const map = {
        options: { crs: { code: 'EPSG:3857', project: point => point } },
        getBounds: () => bounds, getSize: () => ({ x: 256, y: 256 }), getZoom: () => 5,
        removeLayer(image) { removed.push(image); },
        addLayer(layer) { layer._map = this; layer.onAdd(this); }
    };
    return { L, map, images, removed };
}

test('WMS image fallback can finish loading; stale images cannot replace newer requests', () => {
    const { L, map, images, removed } = wmsHarness();
    const proxy = url => 'https://descargas.icv.gva.es/00/proxy/?' + url;
    const overlay = L.WMS.overlay('https://wms.example/', { imageProxy: proxy });
    map.addLayer(overlay);
    assert.ok(images[0]._url.startsWith('https://wms.example/?'));
    assert.equal(images[0].options.errorOverlayUrl, proxy(images[0]._url));
    assert.ok(!images[0]._url.includes('imageProxy'));
    // Leaflet switches _url to errorOverlayUrl when the direct image fails.
    images[0]._url = images[0].options.errorOverlayUrl;
    images[0].load();
    assert.equal(images[0].opacity, 1);
    overlay.setParams({ time: '2026-01-01' });
    overlay.setParams({ time: '2026-02-01' });
    images[1].load();
    assert.ok(removed.includes(images[1]));
    images[2].load();
    assert.equal(images[2].opacity, 1);
});

test('standalone WMS plugin keeps direct-only behavior without IDEVAPI opt-in', () => {
    const { L, map, images } = wmsHarness();
    map.addLayer(L.WMS.overlay('https://wms.example/', {}));
    assert.equal(images[0].options.errorOverlayUrl, undefined);
    images[0].load();
    assert.equal(images[0].opacity, 1);
});
