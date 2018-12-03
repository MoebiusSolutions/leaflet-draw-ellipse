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

    initialize: function initialize (map, options) {
        if (options && options.shapeOptions) {
            options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions)
        }
        if (options && options.lineOptions) {
            options.lineOptions = L.Util.extend({}, this.options.lineOptions, options.lineOptions)
        }
        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.Ellipse.TYPE

        this._initialLabelText = L.drawLocal.draw.handlers.ellipse.tooltip.start

        L.Draw.Feature.prototype.initialize.call(this, map, options)
    },
    _computeBearing: function _computeBearing (latlng) {
        let pc = void 0,
            ph = void 0,
            v = void 0,
            bearing = void 0
        pc = this._map.project(this._startLatLng)
        ph = this._map.project(latlng)
        v = [ph.x - pc.x, ph.y - pc.y]
        bearing = Math.atan2(v[0], -v[1]) * 180 / Math.PI % 360
        return bearing || this._bearing
    },
    _drawShape: function _drawShape (latlng) {
        let radius = void 0
        if (!this._shape) {
            this._radius = radius = Math.max(this._startLatLng.distanceTo(latlng), 10)
            var bearing = this._computeBearing(latlng)
            this._shape = L.ellipse(this._startLatLng, [radius, radius / 2], bearing, this.options.shapeOptions)
            this._bearing = bearing
            this._map.addLayer(this._shape)
        } else {
            //this._shape.setLatLng(this._shape.getLatLng())
            let _radius = this._startLatLng.distanceTo(latlng)
            this._shape.setRadius([_radius, _radius / 2])
            this._shape.setTilt(this._bearing)
        }
    },
    _fireCreatedEvent: function _fireCreatedEvent () {
        let ellipse = L.ellipse(this._startLatLng, this._shape.getRadius(), // KBT ??
            this._bearing, this.options.shapeOptions)

        L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, ellipse)
    },
    _onMouseMove: function _onMouseMove (e) {
        let latlng = e.latlng
        var radius = void 0,
            bearing = void 0

        this._tooltip.updatePosition(latlng)

        if (this._isDrawing) {

            if (this._radius) {
                this._drawShape(latlng)

                this._bearing = bearing = this._computeBearing(latlng)

                this._tooltip.updateContent({
                    text: L.drawLocal.draw.handlers.ellipse.tooltip.end,
                    subtext: 'Bearing(degrees): ' + bearing
                })
            } else {
                this._radius = radius = this._startLatLng.distanceTo(latlng)

                this._bearing = bearing = this._computeBearing(latlng)

                this._tooltip.updateContent({
                    text: L.drawLocal.draw.handlers.ellipse.tooltip.line,
                    subtext: 'Radius(meters): ' + radius + ', Bearing(degrees): ' + bearing
                })
            }
        }
    },
    _onMouseDown: function _onMouseDown (e) {
        let latlng = e.latlng

        var pc = void 0,
            ph = void 0,
            v = void 0,
            newB = void 0

        this._isDrawing = true

        if (!this._startLatLng) {

            this._startLatLng = latlng
        } else if (!this._radius) {
            pc = this._map.project(this._startLatLng)
            ph = this._map.project(latlng)
            v = [ph.x - pc.x, ph.y - pc.y]

            newB = Math.atan2(v[0], -v[1]) * 180 / Math.PI % 360

            if (newB !== undefined) {
                this._bearing = newB
            }
            this._radius = this._startLatLng.distanceTo(latlng)
        } else {
            pc = this._map.project(this._startLatLng)
            ph = this._map.project(latlng)
            v = [ph.x - pc.x, ph.y - pc.y]

            newB = Math.atan2(v[0], -v[1]) * 180 / Math.PI % 360
            if (newB !== undefined) {
                this._bearing = newB
            }
        }
    },
    _onMouseUp: function _onMouseUp (e) {
        if (this._endBearing) {
            this._fireCreatedEvent(e)

            this.disable()

            if (this.options.repeatMode) {
                this.enable()
            }
        }
    },

    // @method addHooks(): void
    // Add listener hooks to this handler.
    addHooks: function addHooks () {
        L.Draw.Feature.prototype.addHooks.call(this)
        if (this._map) {
            this._mapDraggable = this._map.dragging.enabled()

            if (this._mapDraggable) {
                this._map.dragging.disable()
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = 'crosshair'

            this._tooltip.updateContent({ text: this._initialLabelText })

            this._map.on('mousedown', this._onMouseDown, this).on('mousemove', this._onMouseMove, this).on('mouseup', this._onMouseUp, this)
            //.on('touchstart', this._onMouseDown, this)
            //.on('touchmove', this._onMouseMove, this);
        }
    },

    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks: function removeHooks () {
        //L.Draw.Feature.prototype.removeHooks.call(this);
        if (this._map) {
            if (this._mapDraggable) {
                this._map.dragging.enable()
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = ''

            this._map.off('mousedown', this._onMouseDown, this).off('mousemove', this._onMouseMove, this).off('mouseup', this._onMouseUp, this)
            //.off('touchstart', this._onMouseDown, this)
            //.off('touchmove', this._onMouseMove, this);

            L.DomEvent.off(document, 'mouseup', this._onMouseUp, this)
            //L.DomEvent.off(document, 'touchend', this._onMouseUp, this);

            // If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
            if (this._shape) {
                this._map.removeLayer(this._shape)
                delete this._shape
            }
            if (this._line) {
                this._map.removeLayer(this._line)
                delete this._line
            }
        }
        this._isDrawing = false
    }
})

L.Edit = L.Edit || {}

L.Edit.Ellipse = L.Edit.SimpleShape.extend({
    options: {
        moveIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
        }),
        resizeIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
        }),
        rotateIcon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-rotate'
        })
    },

    _initMarkers: function _initMarkers () {
        if (!this._markerGroup) {
            this._markerGroup = new L.LayerGroup()
        }

        // Create center marker
        this._createMoveMarker()

        // Create edge marker
        this._createResizeMarker()

        // Create rotate Marker();
        this._createRotateMarker()
    },
    _createMoveMarker: function _createMoveMarker () {
        let center = this._shape.getLatLng()

        this._moveMarker = this._createMarker(center, this.options.moveIcon)
    },
    _createResizeMarker: function _createResizeMarker () {
        let center = this._shape.getLatLng(),
            resizemarkerPointX1 = this._getResizeMarkerPointX1(center),
            resizemarkerPointX2 = this._getResizeMarkerPointX2(center),
            resizemarkerPointY1 = this._getResizeMarkerPointY1(center),
            resizemarkerPointY2 = this._getResizeMarkerPointY2(center)

        this._resizeMarkers = []
        this._resizeMarkers.push(this._createMarker(resizemarkerPointX1, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointX2, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointY1, this.options.resizeIcon))
        this._resizeMarkers.push(this._createMarker(resizemarkerPointY2, this.options.resizeIcon))
        this._resizeMarkers[0]._isX = true
        this._resizeMarkers[1]._isX = true
        this._resizeMarkers[2]._isX = false
        this._resizeMarkers[3]._isX = false
    },
    _createRotateMarker: function _createRotateMarker () {
        let center = this._shape.getLatLng(),
            rotatemarkerPoint = this._getRotateMarkerPoint(center)

        this._rotateMarker = this._createMarker(rotatemarkerPoint, this.options.rotateIcon)
    },
    _getResizeMarkerPointX1: function _getResizeMarkerPointX1 (latlng) {
        let tilt = this._shape._tiltDeg * (Math.PI / 180) //L.LatLng.DEG_TO_RAD;
        var radius = this._shape._radiusX
        var xDelta = radius * Math.cos(tilt)
        var yDelta = radius * Math.sin(tilt)
        var point = this._map.project(latlng)
        return this._map.unproject([point.x + xDelta, point.y + yDelta])
    },
    _getResizeMarkerPointX2: function _getResizeMarkerPointX2 (latlng) {
        let tilt = this._shape._tiltDeg * (Math.PI / 180) //L.LatLng.DEG_TO_RAD;
        var radius = this._shape._radiusX
        var xDelta = radius * Math.cos(tilt)
        var yDelta = radius * Math.sin(tilt)
        var point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y - yDelta])
    },
    _getResizeMarkerPointY1: function _getResizeMarkerPointY1 (latlng) {
        let tilt = this._shape._tiltDeg * (Math.PI / 180) //L.LatLng.DEG_TO_RAD;
        var radius = this._shape._radiusY
        var xDelta = radius * Math.sin(tilt)
        var yDelta = radius * Math.cos(tilt)
        var point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y + yDelta])
    },
    _getResizeMarkerPointY2: function _getResizeMarkerPointY2 (latlng) {
        let tilt = this._shape._tiltDeg * (Math.PI / 180) //L.LatLng.DEG_TO_RAD;
        var radius = this._shape._radiusY
        var xDelta = radius * Math.sin(tilt)
        var yDelta = radius * Math.cos(tilt)
        var point = this._map.project(latlng)
        return this._map.unproject([point.x + xDelta, point.y - yDelta])
    },
    _getRotateMarkerPoint: function _getRotateMarkerPoint (latlng) {
        let tilt = this._shape._tiltDeg * (Math.PI / 180) //L.LatLng.DEG_TO_RAD;
        var radius = this._shape._radiusX + 20
        var xDelta = radius * Math.cos(tilt)
        var yDelta = radius * Math.sin(tilt)
        var point = this._map.project(latlng)
        return this._map.unproject([point.x - xDelta, point.y - yDelta])
    },
    _onMarkerDragStart: function _onMarkerDragStart (e) {
        L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e)
        this._currentMarker = e.target
    },
    _onMarkerDrag: function _onMarkerDrag (e) {
        let marker = e.target,
            latlng = marker.getLatLng()

        if (marker === this._moveMarker) {
            this._move(latlng)
        } else if (marker === this._rotateMarker) {
            this._rotate(latlng)
        } else {
            this._resize(latlng)
        }

        this._shape.redraw()
    },
    _move: function _move (latlng) {
        // Move the ellipse
        this._shape.setLatLng(latlng)

        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },
    _rotate: function _rotate (latlng) {
        let moveLatLng = this._moveMarker.getLatLng()
        var point = this._map.project(latlng)
        var movePoint = this._map.project(moveLatLng)
        var xLatLng = this._map.unproject([point.x, movePoint.y])
        var radius = moveLatLng.distanceTo(latlng)
        var xDelta = moveLatLng.distanceTo(xLatLng)

        if (movePoint.y.toFixed(1) === point.y.toFixed(1)) {
            let tilt = 0
            // Rotate the ellipse
            this._shape.setTilt(tilt)
        } else if (movePoint.x.toFixed(1) === point.x.toFixed(1)) {
            let _tilt = 90
            // Rotate the ellipse
            this._shape.setTilt(_tilt)
        } else if (xDelta < radius) {
            let _tilt2 = Math.acos(xDelta / radius) * (180 / Math.PI) //L.LatLng.RAD_TO_DEG;
            if (point.x > movePoint.x) {
                _tilt2 = 180 - _tilt2
            }
            if (point.y > movePoint.y) {
                _tilt2 = -1 * _tilt2
            }
            // Rotate the ellipse
            this._shape.setTilt(_tilt2)
        }

        // Move the resize marker
        this._repositionResizeMarkers()

        // Move the rotate marker
        this._repositionRotateMarker()
    },
    _resize: function _resize (latlng) {
        let moveLatLng = this._moveMarker.getLatLng()
        var radius = moveLatLng.distanceTo(latlng)
        if (this._currentMarker._isX) {
            this._shape.setRadius([radius, this._shape._mRadiusY])
        } else {
            this._shape.setRadius([this._shape._mRadiusX, radius])
        }

        // Move the resize marker
        this._repositionResizeMarkers()
        // Move the rotate marker
        this._repositionRotateMarker()
    },
    _repositionResizeMarkers: function _repositionResizeMarkers () {
        let latlng = this._moveMarker.getLatLng()
        var resizemarkerPointX1 = this._getResizeMarkerPointX1(latlng)
        var resizemarkerPointX2 = this._getResizeMarkerPointX2(latlng)
        var resizemarkerPointY1 = this._getResizeMarkerPointY1(latlng)
        var resizemarkerPointY2 = this._getResizeMarkerPointY2(latlng)

        this._resizeMarkers[0].setLatLng(resizemarkerPointX1)
        this._resizeMarkers[1].setLatLng(resizemarkerPointX2)
        this._resizeMarkers[2].setLatLng(resizemarkerPointY1)
        this._resizeMarkers[3].setLatLng(resizemarkerPointY2)
    },
    _repositionRotateMarker: function _repositionRotateMarker () {
        let latlng = this._moveMarker.getLatLng()
        var rotatemarkerPoint = this._getRotateMarkerPoint(latlng)

        this._rotateMarker.setLatLng(rotatemarkerPoint)
    }
})

L.Ellipse.addInitHook(function () {
    if (L.Edit.Ellipse) {
        this.editing = new L.Edit.Ellipse(this)

        if (this.options.editable) {
            this.editing.enable()
        }
    }

    this.on('add', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.addHooks()
        }
    })

    this.on('remove', function () {
        if (this.editing && this.editing.enabled()) {
            this.editing.removeHooks()
        }
    })
})

L.drawLocal.draw.toolbar.buttons.ellipse = 'Draw a Ellipse'

L.drawLocal.draw.handlers.ellipse = {
    tooltip: {
        start: 'Click and drag to draw ellipse.',
        line: 'Let up mouse click when ready.'
    },
    radius: 'Radius'
}
