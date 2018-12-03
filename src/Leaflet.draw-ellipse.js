
import './draw/handler/Draw.Ellipse'
import './edit/handler/Edit.Ellipse'

L.drawLocal.draw.toolbar.buttons.ellipse = 'Draw a Ellipse'

L.drawLocal.draw.handlers.ellipse = {
    tooltip: {
        start: 'Click and drag to draw ellipse.',
        line: 'Let up mouse click when ready.'
    },
    radius: 'Radius'
}