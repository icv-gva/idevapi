
L.Control.Leyenda = L.Control.extend({
	options: {
		collapsed: false,
		position: 'topright',
		label: null
	},
	initialize: function (html,mapa,options) {
    L.Util.setOptions(this, options);
		this._map = mapa;
		this._html = html;
    this._container = '';
	},
  _update: function () {
    if (!this._container) { return this; }
    L.DomUtil.empty(this._baseLayersList);
    L.DomUtil.empty(this._overlaysList);
    this._layerControlInputs = [];
    var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;
    for (i = 0; i < this._layers.length; i++) {
      obj = this._layers[i];
      this._addItem(obj);
      overlaysPresent = overlaysPresent || obj.overlay;
      baseLayersPresent = baseLayersPresent || !obj.overlay;
      baseLayersCount += !obj.overlay ? 1 : 0;
    }
    if (this.options.hideSingleBase) {
      baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
      this._baseLayersList.style.display = baseLayersPresent ? '' : 'none';
    }
    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
    return this;
  },
	onAdd: function (map) {
		this._initLayout();
    //this._update();
		return this._container;
	},
	expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
		this._form.style.height = null;
		var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._form.clientHeight) {
			L.DomUtil.addClass(this._form, 'leaflet-control-layers-scrollbar');
			this._form.style.height = acceptableHeight + 'px';
		} else {
			L.DomUtil.removeClass(this._form, 'leaflet-control-layers-scrollbar');
		}
		return this;
	},
	collapse: function () {
		L.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
		return this;
	},
  _initLayout: function () {
		var className = 'leaflet-control-layers',
				classNameContainer = 'leaflet-control-layers control-leyenda',
		    container = this._container = L.DomUtil.create('div', classNameContainer),
		    collapsed = this.options.collapsed;
		container.setAttribute('aria-haspopup', true);
		L.DomEvent.disableClickPropagation(container);
		L.DomEvent.disableScrollPropagation(container);
		if(this.options.label){
			var labelP = L.DomUtil.create('p', className + "-label");
			labelP.innerHTML = this.options.label;
			container.appendChild(labelP);
		}
		var form = this._form = L.DomUtil.create('form', className + '-list');
		if (collapsed) {
			this._map.on('click', this.collapse, this);
			if (!L.Browser.android) {
				L.DomEvent.on(container, {
					click: this.expand,
				}, this);
				L.DomEvent.on(this._map, {
					click: this.collapse,
				}, this);
			}
		}
		var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
		link.href = '#';
		link.title = MENSAJES.etiquetaLeyenda;
		if (L.Browser.touch) {
			L.DomEvent.on(link, 'click', L.DomEvent.stop);
			L.DomEvent.on(link, 'click', this.expand, this);
		} else {
			L.DomEvent.on(link, 'focus', this.expand, this);
		}
		if (!collapsed) {
			this.expand();
		}
		var labelP = L.DomUtil.create('p', className + "-label");
		labelP.innerHTML = "Leyenda";
    form.appendChild(labelP);
		this._leyendaList = L.DomUtil.create('div', className + '-base', form);
    this._leyendaList.appendChild(this._html);


		container.appendChild(form);

	},
});

L.control.leyenda = function (html,mapa, options) {
        return new L.Control.Leyenda(html,mapa, options);
};
