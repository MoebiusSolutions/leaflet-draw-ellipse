
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

    initialize (map, options) {
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

    _computeBearing (latlng) {
        let pc, ph, v, bearing
        pc = this._map.project(this._startLatLng)
        ph = this._map.project(latlng)
        v = [ph.x - pc.x, ph.y - pc.y]
        bearing = (Math.atan2(v[0], -v[1]) * 180 / Math.PI) % 360
        return (bearing || this._bearing)
    },

    _drawShape (latlng) {
        let radius
        if (!this._shape) {
            this._radius = radius = Math.max(this._startLatLng.distanceTo(latlng), 10)
            const bearing = this._computeBearing(latlng)
            this._shape = L.ellipse(
                this._startLatLng,
                [radius, radius / 2],
                bearing,
                this.options.shapeOptions
            )
            this._bearing = bearing
            this._map.addLayer(this._shape)

        } else {
            //this._shape.setLatLng(this._shape.getLatLng())
            const radius = this._startLatLng.distanceTo(latlng)
            this._shape.setRadius([radius, radius / 2])
            this._shape.setTilt(this._bearing)
        }
    },


    _fireCreatedEvent (e) {
        const ellipse = L.ellipse(
            this._startLatLng,
            this._radius, // KBT ??
            this._bearing,
            this.options.shapeOptions
        )

        L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, ellipse)
    },

    _onMouseMove (e) {
        const latlng = e.latlng
        let radius, bearing

        this._tooltip.updatePosition(latlng)

        if (this._isDrawing) {

            if (this._radius) {
                this._drawShape(latlng)

                this._bearing = bearing = this._computeBearing(latlng)

                this._tooltip.updateContent({
                    text: L.drawLocal.draw.handlers.ellipse.tooltip.end,
                    subtext: `Bearing(degrees): ${bearing}`
                })

            } else {
                this._radius = radius = this._startLatLng.distanceTo(latlng)

                this._bearing = bearing = this._computeBearing(latlng)

                this._tooltip.updateContent({
                    text: L.drawLocal.draw.handlers.ellipse.tooltip.line,
                    subtext: `Radius(meters): ${radius}, Bearing(degrees): ${bearing}`
                })
            }
        }
    },

    _onMouseDown (e) {
        const latlng = e.latlng

        let pc, ph, v, newB

        this._isDrawing = true

        if (!this._startLatLng) {

            this._startLatLng = latlng

        } else if (!this._radius) {
            pc = this._map.project(this._startLatLng)
            ph = this._map.project(latlng)
            v = [ph.x - pc.x, ph.y - pc.y]

            newB = (Math.atan2(v[0], -v[1]) * 180 / Math.PI) % 360

            if (newB !== undefined) {
                this._bearing = newB
            }
            this._radius = this._startLatLng.distanceTo(latlng)
        } else {
            pc = this._map.project(this._startLatLng)
            ph = this._map.project(latlng)
            v = [ph.x - pc.x, ph.y - pc.y]

            newB = (Math.atan2(v[0], -v[1]) * 180 / Math.PI) % 360
            if (newB !== undefined) {
                this._bearing = newB
            }
        }
    },

    _onMouseUp (e) {
        this._fireCreatedEvent(e)

        this.disable()

        if (this.options.repeatMode) {
            this.enable()
        }
    },
    // @method addHooks(): void
    // Add listener hooks to this handler.
    addHooks () {
        L.Draw.Feature.prototype.addHooks.call(this)
        if (this._map) {
            this._mapDraggable = this._map.dragging.enabled()

            if (this._mapDraggable) {
                this._map.dragging.disable()
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = 'crosshair'

            this._tooltip.updateContent({ text: this._initialLabelText })

            this._map
                .on('mousedown', this._onMouseDown, this)
                .on('mousemove', this._onMouseMove, this)
                .on('mouseup', this._onMouseUp, this)
            //.on('touchstart', this._onMouseDown, this)
            //.on('touchmove', this._onMouseMove, this);
        }
    },
    // @method removeHooks(): void
    // Remove listener hooks from this handler.
    removeHooks () {
        //L.Draw.Feature.prototype.removeHooks.call(this);
        if (this._map) {
            if (this._mapDraggable) {
                this._map.dragging.enable()
            }

            //TODO refactor: move cursor to styles
            this._container.style.cursor = ''

            this._map
                .off('mousedown', this._onMouseDown, this)
                .off('mousemove', this._onMouseMove, this)
                .off('mouseup', this._onMouseUp, this)
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
    },
})