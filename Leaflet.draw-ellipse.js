L.Draw.Ellipse = L.Draw.Feature.extend({
    statics: {
        TYPE: 'ellipse'
    },

    options: {
        shapeOptions: {
            stroke: true,
            color: '#ffff00',
            weight: 5,
            opacity: 0.5,
            //fill: true,
            //fillColor: null, //same as color by default
            fillOpacity: 0.2,
            clickable: true
        },
        showRadius: true,
        metric: true, // Whether to use the metric measurement system or imperial
        lineOptions: {
            color: '#ffff00',
            weight: 5,
            dashArray: '5, 10'
        }
    },

    initialize: function initialize(map, options) {
        if (options && options.shapeOptions) {
            options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
        }
        if (options && options.lineOptions) {
            options.lineOptions = L.Util.extend({}, this.options.lineOptions, options.lineOptions);
        }
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Ellipse.TYPE;

        this._initialLabelText = L.drawLocal.draw.handlers.ellipse.tooltip.start;

        L.Draw.Feature.prototype.initialize.call(this, map, options);
    },
    _computeBearing: function _computeBearing(latlng) {
        var RAD_TO_DEG = 180 / Math.PI;
        var pc = this._map.project(this._startLatLng);
        var ph = this._map.project(latlng);
        var v = [ph.x - pc.x, ph.y - pc.y];
        var bearing = Math.atan2(v[0], -v[1]) * RAD_TO_DEG % 360;
        return bearing;
    },
    getDistance: function getDistance(p, q) {
        return L.latLng(p).distanceTo(q);
    },
    _drawShape: function _drawShape(latlng) {
        var radius = void 0;
        if (!this._shape) {
            this._radius = radius = Math.max(this._startLatLng.distanceTo(latlng), 10);
            this._bearing = this._computeBearing(latlng);
            this._shape = L.ellipse(this._startLatLng, [radius, radius / 2], this._bearing, this.options.shapeOptions);
            this._map.addLayer(this._shape);
        } else {
            this._bearing = this._computeBearing(latlng);
            this._shape.setTilt(this._bearing);

            this._radius = radius = this.getDistance(this._startLatLng, latlng);
            this._shape.setRadii([radius, radius / 2]);
            this._shape.setLatLngs();
        }
    },
    _fireCreatedEvent: function _fireCreatedEvent(e) {
        var radii = [this._shape._semiMajor, this._shape._semiMinor];
        var ellipse = L.ellipse(this._startLatLng, radii, this._bearing, this.options.shapeOptions);

        L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, ellipse);
    },
    _onMouseDown: function _onMouseDown(e) {
        this._isDrawing = true;
        this._startLatLng = e.latlng;
    },
    _onMouseMove: function _onMouseMove(e) {
        var latlng = e.latlng;

        if (this._isDrawing) {
            this._drawShape(latlng);
            this._tooltip.updateContent({
                text: L.drawLocal.draw.handlers.ellipse.tooltip.line,
                subtext: 'Radius(meters): ' + this._radius + ', Bearing(degrees): ' + this._bearing
            });
            this._tooltip.updatePosition(latlng);
        }
    },
    _onMouseUp: function _onMouseUp(e) {
        this._fireCreatedEvent(e);

        this.disable();
        this._tooltip.updateContent({ text: '' });
        if (this.options.repeatMode) {
            this.enable();
        }
    },

    // @method addHooks(): void
    // Add listener hooks to this handler.
    addHooks: function addHooks() {
        L.Draw.Feature.prototype.addHooks.call(this);
        if (this._map) {
            this._mapDraggable = this._map.dragging.enabled();

            if (this._mapDraggable) {
                this._map.dragging.disable();
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = 'crosshair';

            this._tooltip.updateContent({ text: this._initialLabelText });

            this._map.on('mousedown', this._onMouseDown, this).on('mousemove', this._onMouseMove, this).on('mouseup', this._onMouseUp, this);
            //.on('touchstart', this._onMouseDown, this)
            //.on('touchmove', this._onMouseMove, this);
        }
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks: function removeHooks() {
        //L.Draw.Feature.prototype.removeHooks.call(this);
        if (this._map) {
            if (this._mapDraggable) {
                this._map.dragging.enable();
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = '';

            this._map.off('mousedown', this._onMouseDown, this).off('mousemove', this._onMouseMove, this).off('mouseup', this._onMouseUp, this);
            //.off('touchstart', this._onMouseDown, this)
            //.off('touchmove', this._onMouseMove, this);

            L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);
            //L.DomEvent.off(document, 'touchend', this._onMouseUp, this);

            // If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
            if (this._shape) {
                this._map.removeLayer(this._shape);
                delete this._shape;
            }
            if (this._line) {
                this._map.removeLayer(this._line);
                delete this._line;
            }
        }
        this._isDrawing = false;
    }
});

L.Edit = L.Edit || {};

L.Edit.Ellipse = L.Edit.SimpleShape.extend({
    options: {
        moveIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
        }),
        resizeIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
        }),
        rotateIcon: new L.DivIcon({
            iconSize: new L.Point(7, 7),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-rotate'
        })
    },

    wrapBrg: function wrapBrg(brg) {
        if (brg < 0.0) {
            brg += 360.0;
            this.wrapBrg(brg);
        } else if (brg > 360.0) {
            brg -= 360.0;
            this.wrapBrg(brg);
        }
        return brg;
    },
    atan2d: function atan2d(y, x) {
        var RAD_TO_DEG = 180 / Math.PI;
        return RAD_TO_DEG * Math.atan2(y, x);
    },
    computeDestinationPoint: function computeDestinationPoint() {
        var start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { lat: 0, lng: 0 };
        var distance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
        var bearing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var radius = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 6378137;

        var bng = bearing * Math.PI / 180;

        var lat1 = start.lat * Math.PI / 180;
        var lon1 = start.lng * Math.PI / 180;

        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / radius) + Math.cos(lat1) * Math.sin(distance / radius) * Math.cos(bng));

        var lon2 = lon1 + Math.atan2(Math.sin(bng) * Math.sin(distance / radius) * Math.cos(lat1), Math.cos(distance / radius) - Math.sin(lat1) * Math.sin(lat2));

        lat2 = lat2 * 180 / Math.PI;
        lon2 = lon2 * 180 / Math.PI;

        return {
            lat: lat2,
            lng: lon2
        };
    },
    getDistance: function getDistance(p, q) {
        return L.latLng(p).distanceTo(q);
    },
    getPos: function getPos(center, angle, trueStart, semiMinor, semiMajor) {
        var DEG_TO_RAD = Math.PI / 180;
        var y = semiMinor * Math.sin(angle * DEG_TO_RAD);
        var x = semiMajor * Math.cos(angle * DEG_TO_RAD);
        var dist = Math.sqrt(x * x + y * y);
        var tangle = semiMinor !== semiMajor ? this.atan2d(y, x) : angle;
        return this.computeDestinationPoint(center, dist, trueStart + tangle);
    },
    getMarkerPos: function getMarkerPos(deg) {
        var center = this._shape.getCenter();
        var trueStart = this.wrapBrg(this._shape.getTilt());
        var semiMinor = this._shape.getSemiMinor();
        var semiMajor = this._shape.getSemiMajor();
        return this.getPos(center, deg, trueStart, semiMinor, semiMajor);
    },
    _initMarkers: function _initMarkers() {
        if (!this._markerGroup) {
            this._markerGroup = new L.LayerGroup();
        }

        // Create center marker
        this._createMoveMarker();

        // Create edge marker
        this._createResizeMarker();

        // Create rotate Marker();
        this._createRotateMarker();
    },
    _createMoveMarker: function _createMoveMarker() {
        var center = this._shape.getCenter();
        this._moveMarker = this._createMarker(center, this.options.moveIcon);
    },
    _createResizeMarker: function _createResizeMarker() {
        this._resizeMarkers = [];
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(0), this.options.resizeIcon));
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(180), this.options.resizeIcon));
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(90), this.options.resizeIcon));
        this._resizeMarkers.push(this._createMarker(this.getMarkerPos(270), this.options.resizeIcon));
        this._resizeMarkers[0]._isX = true;
        this._resizeMarkers[1]._isX = true;
        this._resizeMarkers[2]._isY = true;
        this._resizeMarkers[3]._isY = true;
    },
    _createRotateMarker: function _createRotateMarker() {
        var pos = this.getRotateMarkerPos();
        this._rotateMarker = this._createMarker(pos, this.options.rotateIcon);
    },
    getRotateMarkerPos: function getRotateMarkerPos() {
        var pos = this.getMarkerPos(0);
        var p = this._map.project(pos);
        var c = this._map.project(this._shape.getCenter());
        var dX = p.x >= c.x ? 20 : -20;
        var dY = p.y <= c.y ? -20 : 20;
        return this._map.unproject([p.x + dX, p.y + dY]);
    },
    _onMarkerDragStart: function _onMarkerDragStart(e) {
        L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);
        this._currentMarker = e.target;
    },
    _onMarkerDrag: function _onMarkerDrag(e) {
        var marker = e.target,
            latlng = marker.getLatLng();

        if (marker === this._moveMarker) {
            this._move(latlng);
        } else if (marker === this._rotateMarker) {
            this._rotate(latlng);
        } else {
            this._resize(latlng);
        }
        this._shape.redraw();
    },
    _move: function _move(latlng) {
        // Move the ellipse
        this._shape.setCenter(latlng);
        this._shape.setLatLngs();

        // Move the resize marker
        this._repositionResizeMarkers();

        // Move the rotate marker
        this._repositionRotateMarker();
    },
    _computeBearing: function _computeBearing(fixedLatlng, latlng) {
        var RAD_TO_DEG = 180 / Math.PI;
        var pc = this._map.project(fixedLatlng);
        var ph = this._map.project(latlng);
        var v = [ph.x - pc.x, ph.y - pc.y];
        var bearing = Math.atan2(v[0], -v[1]) * RAD_TO_DEG % 360;
        return bearing || this._bearing;
    },
    _rotate: function _rotate(latlng) {
        var fixedLatLng = this._moveMarker.getLatLng();
        var bearing = this._computeBearing(fixedLatLng, latlng);
        this._shape.setTilt(bearing);
        this._shape.setLatLngs();
        // Move the resize marker
        this._repositionResizeMarkers();

        // Move the rotate marker
        this._repositionRotateMarker();
    },
    _resize: function _resize(latlng) {
        //const moveLatLng = this._moveMarker.getLatLng()
        //const radius = moveLatLng.distanceTo(latlng)
        if (this._currentMarker._isX) {
            this._shape.setSemiMajor(this.getDistance(this._shape.getCenter(), latlng));
        } else {
            this._shape.setSemiMinor(this.getDistance(this._shape.getCenter(), latlng));
        }
        this._shape.setLatLngs();
        // Move the resize marker
        this._repositionResizeMarkers();
        // Move the rotate marker
        this._repositionRotateMarker();
    },
    _repositionResizeMarkers: function _repositionResizeMarkers() {
        this._resizeMarkers[0].setLatLng(this.getMarkerPos(0));
        this._resizeMarkers[1].setLatLng(this.getMarkerPos(180));
        this._resizeMarkers[2].setLatLng(this.getMarkerPos(90));
        this._resizeMarkers[3].setLatLng(this.getMarkerPos(270));
    },
    _repositionRotateMarker: function _repositionRotateMarker() {
        this._rotateMarker.setLatLng(this.getRotateMarkerPos());
    }
});

L.Ellipse.addInitHook(function () {
    if (L.Edit.Ellipse) {
        this.editing = new L.Edit.Ellipse(this);

        if (this.options.editable) {
            this.editing.enable();
        }
    }

    this.on('add', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.addHooks();
        }
    });

    this.on('remove', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.removeHooks();
        }
    });
});

L.drawLocal.draw.toolbar.buttons.ellipse = 'Draw a Ellipse';

L.drawLocal.draw.handlers.ellipse = {
    tooltip: {
        start: 'Click and drag to draw ellipse.',
        line: 'Let up mouse click when ready.'
    },
    radius: 'Radius'
};
