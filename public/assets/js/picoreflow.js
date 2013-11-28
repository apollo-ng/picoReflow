

function updateProgress(percentage){
    if(state=="RUNNING") {
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', percentage+'%');
    if(percentage>=5) $('#progressBar').html(percentage+'%');
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
