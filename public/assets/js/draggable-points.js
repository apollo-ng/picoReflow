(function (Highcharts) {
    var addEvent = Highcharts.addEvent,
        each = Highcharts.each;

    /**
     * Filter by dragMin and dragMax
     */
    function filterRange(newY, series, XOrY) {
        var options = series.options,
            dragMin = options['dragMin' + XOrY],
            dragMax = options['dragMax' + XOrY];

        if (newY < dragMin) {
            newY = dragMin;
        } else if (newY > dragMax) {
            newY = dragMax;
        }
        return newY;
    }

    Highcharts.Chart.prototype.callbacks.push(function (chart) {

        var container = chart.container,
            dragPoint,
            dragX,
            dragY,
            dragPlotX,
            dragPlotY;

        chart.redraw(); // kill animation (why was this again?)

        addEvent(container, 'mousedown', function (e) {
            var hoverPoint = chart.hoverPoint,
                options;

            if (hoverPoint) {
                options = hoverPoint.series.options;
                if (options.draggableX) {
                    dragPoint = hoverPoint;

                    dragX = e.pageX;
                    dragPlotX = dragPoint.plotX;
                }

                if (options.draggableY) {
                    dragPoint = hoverPoint;

                    dragY = e.pageY;
                    dragPlotY = dragPoint.plotY + (chart.plotHeight - (dragPoint.yBottom || chart.plotHeight));
                }

                // Disable zooming when dragging
                if (dragPoint) {
                    chart.mouseIsDown = false;
                }
            }
        });

        addEvent(container, 'mousemove', function (e) {
            if (dragPoint) {
                var deltaY = dragY - e.pageY,
                    deltaX = dragX - e.pageX,
                    newPlotX = dragPlotX - deltaX - dragPoint.series.xAxis.minPixelPadding,
                    newPlotY = chart.plotHeight - dragPlotY + deltaY,
                    newX = dragX === undefined ? dragPoint.x : dragPoint.series.xAxis.translate(newPlotX, true),
                    newY = dragY === undefined ? dragPoint.y : dragPoint.series.yAxis.translate(newPlotY, true),
                    series = dragPoint.series,
                    proceed;

                newX = filterRange(newX, series, 'X');
                newY = filterRange(newY, series, 'Y');

                // Fire the 'drag' event with a default action to move the point.
                dragPoint.firePointEvent(
                    'drag', {
                    newX: newX,
                    newY: newY
                },

                function () {
                    proceed = true;
                    dragPoint.update([newX, newY], false);
                    if (chart.tooltip) {
                        chart.tooltip.refresh(chart.tooltip.shared ? [dragPoint] : dragPoint);
                    }
                    if (series.stackKey) {
                        chart.redraw();
                    } else {
                        series.redraw();
                    }
                });

                // The default handler has not run because of prevented default
                if (!proceed) {
                    drop();
                }
            }
        });

        function drop(e) {
            if (dragPoint) {
                if (e) {
                    var deltaX = dragX - e.pageX,
                        deltaY = dragY - e.pageY,
                        newPlotX = dragPlotX - deltaX - dragPoint.series.xAxis.minPixelPadding,
                        newPlotY = chart.plotHeight - dragPlotY + deltaY,
                        series = dragPoint.series,
                        newX = dragX === undefined ? dragPoint.x : dragPoint.series.xAxis.translate(newPlotX, true),
                        newY = dragY === undefined ? dragPoint.y : dragPoint.series.yAxis.translate(newPlotY, true);

                    newX = filterRange(newX, series, 'X');
                    newY = filterRange(newY, series, 'Y');
                    dragPoint.update([newX, newY]);
                }
                dragPoint.firePointEvent('drop');
            }
            dragPoint = dragX = dragY = undefined;
        }
        addEvent(document, 'mouseup', drop);
        addEvent(container, 'mouseleave', drop);
    });


})(Highcharts);
