

function updateProgress(percentage){
    if(state=="RUNNING") {
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', percentage+'%');
    if(percentage>=5) $('#progressBar').html(parseInt(percentage)+'%');
} else {
    $('#progressBar').css('width', 0+'%');
    $('#progressBar').html('');
}
}


function runTask() {
      var test = {
          "cmd": "RUN",
          "profile": profiles[selected_profile]
      }

      console.log(JSON.stringify(test));

     ws_control.send(JSON.stringify(test));
     graph.series[1].setData([]);
}


function abortTask() {
      var test = {"cmd": "STOP"};
      console.log(JSON.stringify(test));
      ws_control.send(JSON.stringify(test));
}


function enterEditMode() {
    state="EDIT"
    $('#main_status').slideUp();
    $('#saveas').show();
    $('#e2').select2('container').hide();
    $('#nav_start').hide();
    $('#btn_edit').hide();
    $('#btn_exit').show();
    $('#form_profile_name').attr('value', profiles[selected_profile].name);
    graph.series[0].options.marker.enabled=true;
    graph.series[0].options.draggableX=true;
    graph.series[0].options.draggableY=true;
    graph.render();

}
function leaveEditMode() {
    state="IDLE";
    $('#saveas').hide();
    $('#e2').select2('container').show();
    $('#main_status').slideDown();
    $('#nav_start').show();
    $('#btn_edit').show();
    $('#btn_exit').hide();
    graph.series[0].options.marker.enabled=false;
    graph.series[0].options.draggableX=false;
    graph.series[0].options.draggableY=false;
    graph.render();
}

function saveProfile() {
    name = $('#form_profile_name').val();
    console.log('Trying to save profile: ' + name);
    var rawdata = graph.series[0].data;
    var data = [];

    for(var i=0; i<rawdata.length;i++)
    {
        data.push([rawdata[i].x, rawdata[i].y]);
    }

    var profile = { "type": "profile", "data": data, "name": name }
    var put = { "cmd": "PUT", "profile": profile }

    var put_cmd = JSON.stringify(put);

    ws_storage.send(put_cmd);

    console.log('came to this: ' + put_cmd);

    selected_profile_name = name;

    leaveEditMode();
}



function update_profile(id) {
  console.log('Profile selected:' + profiles[id].name);
  selected_profile = id;
  $('#sel_prof').html(profiles[id].name);
  console.log(graph.series);
  graph.series[0].setData(profiles[id].data);
}


 Highcharts.theme = {
   colors: ["#D8D3C5", "#75890c", "#c70000", "#55BF3B", "#DF5353", "#aaeeee", "#ff0066", "#eeaaee",
      "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
   chart: {
       /*
      backgroundColor: {
         linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
         stops: [
            [0, '#686764'],
            [1, '#383734']
         ]
      },
      * */
      backgroundColor:'rgba(255, 255, 255, 0)',
      borderWidth: 0,
      borderRadius: 0,
      plotBackgroundColor: null,
      plotShadow: true,
      plotBorderWidth: 0,
      marginBottom: 50
   },
   title: {
      style: {
         color: '#FFF',
         font: '16px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
      }
   },
   subtitle: {
      style: {
         color: '#DDD',
         font: '12px Lucida Grande, Lucida Sans Unicode, Verdana, Arial, Helvetica, sans-serif'
      }
   },
   xAxis: {
      gridLineWidth: 1,
      gridLineColor: 'rgba(255, 255, 255, .1)',
      lineColor: 'rgba(255, 255, 255, .1)',
      tickColor: 'rgba(255, 255, 255, .1)',
      labels: {
         style: {
            paddingTop: '4px',
            color: '#D8D3C5',
            font: '15px Arial, Helvetica, sans-serif'
         }
      },
      title: {
         style: {
            color: '#FFF',
            font: '12px Arial, Helvetica, sans-serif'
         }
      }
   },
   yAxis: {
      alternateGridColor: null,
      minorTickInterval: null,
      gridLineColor: 'rgba(255, 255, 255, .1)',
      minorGridLineColor: 'rgba(255,255,255,0.05)',
      lineWidth: 0,
      tickWidth: 0,
      labels: {
         style: {
            color: '#D8D3C5',
            font: '15px Arial, Helvetica, sans-serif'
         }
      },
      title: {
         style: {
            color: '#FFF',
            font: '12px Arial, Helvetica, sans-serif'
         }
      }
   },
   legend: {
      enabled: false,
      itemStyle: {
         color: '#CCC'
      },
      itemHoverStyle: {
         color: '#FFF'
      },
      itemHiddenStyle: {
         color: '#333'
      },
      borderRadius: 0,
      borderWidth: 0
   },
   labels: {
      style: {
         color: '#CCC'
      }
   },
   tooltip: {
      backgroundColor: {
         linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
         stops: [
            [0, 'rgba(96, 96, 96, .8)'],
            [1, 'rgba(16, 16, 16, .8)']
         ]
      },
      borderWidth: 0,
      style: {
         color: '#FFF'
      }
   },


   plotOptions: {
      series: {
         shadow: true
      },
      line: {
         dataLabels: {
            color: '#CCC'
         },
         marker: {
            lineColor: '#333'
         }
      },
      spline: {
         marker: {
            lineColor: '#333'
         }
      }
   },

   toolbar: {
      itemStyle: {
         color: '#CCC'
      }
   },

   navigation: {
      buttonOptions: {
         symbolStroke: '#DDDDDD',
         hoverSymbolStroke: '#FFFFFF',
         theme: {
            fill: {
               linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
               stops: [
                  [0.4, '#606060'],
                  [0.6, '#333333']
               ]
            },
            stroke: '#000000'
         }
      }
   },

   // scroll charts
   rangeSelector: {
      buttonTheme: {
         fill: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
               [0.4, '#888'],
               [0.6, '#555']
            ]
         },
         stroke: '#000000',
         style: {
            color: '#CCC',
            fontWeight: 'bold'
         },
         states: {
            hover: {
               fill: {
                  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                  stops: [
                     [0.4, '#BBB'],
                     [0.6, '#888']
                  ]
               },
               stroke: '#000000',
               style: {
                  color: 'white'
               }
            },
            select: {
               fill: {
                  linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                  stops: [
                     [0.1, '#000'],
                     [0.3, '#333']
                  ]
               },
               stroke: '#000000',
               style: {
                  color: 'yellow'
               }
            }
         }
      },
      inputStyle: {
         backgroundColor: '#333',
         color: 'silver'
      },
      labelStyle: {
         color: 'silver'
      }
   },

   navigator: {
      handles: {
         backgroundColor: '#666',
         borderColor: '#AAA'
      },
      outlineColor: '#CCC',
      maskFill: 'rgba(16, 16, 16, 0.5)',
      series: {
         color: '#7798BF',
         lineColor: '#A6C7ED'
      }
   },

   scrollbar: {
      barBackgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
               [0.4, '#888'],
               [0.6, '#555']
            ]
         },
      barBorderColor: '#CCC',
      buttonArrowColor: '#CCC',
      buttonBackgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
               [0.4, '#888'],
               [0.6, '#555']
            ]
         },
      buttonBorderColor: '#CCC',
      rifleColor: '#FFF',
      trackBackgroundColor: {
         linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
         stops: [
            [0, '#000'],
            [1, '#333']
         ]
      },
      trackBorderColor: '#666'
   },

   // special colors for some of the demo examples
   legendBackgroundColor: 'rgba(48, 48, 48, 0.8)',
   legendBackgroundColorSolid: 'rgb(70, 70, 70)',
   dataLabelsColor: '#444',
   textColor: '#E0E0E0',
   maskColor: 'rgba(255,255,255,0.3)'
};




function getHCOptions() {

  var options =
  {
      title: { text: '' },
      xAxis: {
          title: { text: 'Time (s)' },
          type: 'integer',
          tickPixelInterval: 60
      },
      yAxis: {
          title: { text: 'Temperature (\xB0C)' },
          tickInterval: 25,
          min: 0,
          max: 300
      },
      tooltip: {
            formatter: function() {
                return Highcharts.numberFormat(this.y, 0);
            }
      },
      chart: {
          type: 'line',
          renderTo: 'graph_container',
          animation: true,
          zoomType: 'x',
          marginTop: 30,
          marginRight: 30,
          events: {
              load: function() {
                  var series = this.series[1];


                  ws_status.onmessage = function(e)
                  {
                      x = JSON.parse(e.data);

                      if(state!="EDIT")
                      {
                      state = x.state;
                      }

                      $('#state').html(state);

                      updateProgress(parseFloat(x.runtime)/parseFloat(x.totaltime)*100);

                      $('#act_temp').html(Highcharts.numberFormat(x.temperature, 0) + ' \xB0C');
                      $('#power').css("background-color", (x.power > 0.5 ? "#75890c" : "#1F1E1A") );


                      if (x.target == 0)
                      {
                          $('#target_temp').html('OFF');
                      }
                      else
                      {
                        $('#target_temp').html(Highcharts.numberFormat(x.target, 0) + ' \xB0C');
                  }
                      //console.log (e.data);
                      //console.log('Percent finished:' + perc);

                      if(state!="EDIT")
                      {

                      if(state=="RUNNING")
                      {
                          $("#nav_start").hide();
                          $("#nav_stop").show();
                        series.addPoint([x.runtime, x.temperature], true, false);

                        left = parseInt(x.totaltime-x.runtime);
                        var minutes = Math.floor(left / 60);
                        var seconds = left - minutes * 60;
                        $('#eta').html(minutes+':'+ (seconds < 10 ? "0" : "") + seconds);

                      }
                      else
                      {
                          $("#nav_start").show();
                          $("#nav_stop").hide();
                      }
                  }

                  }

                  /*
                  var socket = io.connect('http://10.1.1.110:8080');
                  socket.on('sample', function (sample) {
                      // when a sample arrives we plot it
                      series.addPoint([sample.x, sample.y], true, false);
                      $('#act_temp').html(Highcharts.numberFormat(sample.y, 0) + ' \xB0C');


                  });

                  socket.on('error', function () {

                   $(document).trigger("add-alerts", [
                    {
                      'message': "No communication to control server",
                      'priority': 'error'
                    }
                  ]);


                  })

                  // Called when the connection to the server is opened.
                  socket.onopen = function () {
                    alert("Connection with server open.");
                  };

                  // Called when the connection to the server is closed.
                  socket.onclose = function () {
                    alert("Connection with server closed; Maybe the server wasn't found, it shut down or you're behind a firewall/proxy.");
                  };
*/
              }
          },
          resetZoomButton: {
             position: {
                 align: 'right',
                 verticalAlign: 'top'
             }
          }
      },

      plotOptions: {
         series: {
             cursor: 'all-scroll',
             point: {
                 events: {
                     /*
                     drag: function (e) {
                        $('#drag').html('Dragging <b>' + this.series.name + '</b>, <b>' + this.category + '</b> to <b>' + Highcharts.numberFormat(e.newY, 0) + '</b>');
                     },
                     drop: function () {
                        $('#drop').html('In <b>' + this.series.name + '</b>, <b>' + this.category + '</b> was set to <b>' + Highcharts.numberFormat(this.y, 0) + '</b>');
                     }*/
                 }
             },
             stickyTracking: false
         },

      },

      credits: {
        enabled: false
      },

      series: [{
        name: 'Ref',
          data: [
            [1, 25   ],
            [70, 150 ],
            [180, 183 ],
            [210, 230 ],
            [240, 183 ],
            [300, 25 ]
          ],
          draggableX: false,
          draggableY: false,
          dragMinY: 0,
          dragMaxY: 250,
          marker: {
            enabled: false
          }
        },
        {
          name: 'Act',
          data: [
            [0,0]
          ],
          marker: {
            enabled: false
          }
        }]

  };

  return (options);

}
