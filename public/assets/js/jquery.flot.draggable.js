/* Flot plugin for adding point dragging capabilities to a plot.
   Author: Zach Dwiel - Heavy inspiration from Chris Leonello.  Thank you!

// dependencies: jquery.event.drag.js */

(function ($) {
    var options = {
            xaxis: {
                draggable: false,
            }, yaxis: {
                draggable: false,
            }, grid: {
                draggable: false,
            }
        },
        drag = { pos: { x:null, y:null}, active: false };

    function init(plot) {
        function bindEvents(plot, eventHolder) {
            var o = plot.getOptions();
            var i;
            var series_draggable = false;
            var series = plot.getData();
            for (i = 0; i < series.length; ++i) {
              if(series[i].draggable || series[i].draggablex || series[i].draggabley) {
                series_draggable = true;
              }
            }
            if (o.grid.draggable || o.xaxis.draggable || o.yaxis.draggable || series_draggable) {
                eventHolder.bind("dragstart", { distance: 10 }, function (e) {
                    if (e.which != 1)  // only accept left-click
                        return false;
                    var plotOffset = plot.getPlotOffset();
                    var offset = eventHolder.offset(),
                        pos = { pageX: e.pageX, pageY: e.pageY },
                        canvasX = e.pageX - offset.left - plotOffset.left,
                        canvasY = e.pageY - offset.top - plotOffset.top;
                    drag.gridOffset = {top: offset.top + plotOffset.top, left: offset.left + plotOffset.left};

                    drag.item = plot.findNearbyItem(canvasX, canvasY, function (s) { return s["draggable"] != false; });

                    if (drag.item) {
                        drag.item.pageX = parseInt(drag.item.series.xaxis.p2c(drag.item.datapoint[0]) + offset.left + plotOffset.left);
                        drag.item.pageY = parseInt(drag.item.series.yaxis.p2c(drag.item.datapoint[1]) + offset.top + plotOffset.top);
                        drag.active = true;
                    }
                });
                eventHolder.bind("drag", function (pos) {
                    var axes = plot.getAxes();
                    var ax = axes.xaxis;
                    var ay = axes.yaxis;
                    var ax2 = axes.x2axis;
                    var ay2 = axes.y2axis;
                    var sidx = drag.item.seriesIndex;
                    var didx = drag.item.dataIndex;
                    var s = plot.getData()[sidx];

                    if (drag.item.series.yaxis == ay2)
                        ay = ay2;
                    if (drag.item.series.xaxis == ax2)
                        ax = ax2;

                    // Bring down to int
                    var newx = Math.floor(ax.min + (pos.pageX-drag.gridOffset.left)/ax.scale);
                    var newy = Math.floor(ay.max - (pos.pageY-drag.gridOffset.top)/ay.scale);

                    series[sidx].data[didx] = [newx, newy];
                    plot.processData();

                    // change the raw data instead of processing every point all over again, not as clean, but faster
                    var points = s.datapoints.points;
                    var ps = s.datapoints.pointsize;
                    if((o.grid.draggable || o.xaxis.draggable || s.draggablex || s.draggable) && (s.draggablex != false)) {
                      points[didx*ps] = newx;
                    }
                    if((o.grid.draggable || o.yaxis.draggable || s.draggabley || s.draggable) && (s.draggabley != false)) {
                      points[didx*ps+1] = newy;
                    }

                    var is_last = series[sidx].data.length == didx+1;

                    // funny hack to make drag resizing usable
                    if (newx > ax.max)
                    {
                        graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());
                    }
                    else if (newx < (ax.max*0.5) && newx >= ax.datamax && is_last)
                    {
                        ax.options.max = newx*2;
                        plot.setupGrid();
                    }

                    plot.draw();

                    // hack to update the profile points after dragging graph in edit mode
                    updateProfileTable();

                    var retx = points[didx*ps];
                    var rety = points[didx*ps+1];

                    plot.getPlaceholder().trigger('plotSeriesChange', [sidx, didx, retx, rety])
                });
                eventHolder.bind("dragend", function (e) {
                    var sidx = drag.item.seriesIndex;
                    var didx = drag.item.dataIndex;
                    var s = plot.getData()[sidx];
                    var ps = s.datapoints.pointsize;
                    plot.getPlaceholder().trigger('plotFinalSeriesChange', [sidx, didx, s.datapoints.points[didx*ps], s.datapoints.points[didx*ps+1]])
                });
            }
        }

        plot.hooks.bindEvents.push(bindEvents);
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'draggable',
        version: '1.0'
    });
})(jQuery);
