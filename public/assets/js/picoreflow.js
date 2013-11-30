var state = "IDLE";
var state_last = "";
var graph = [ 'profile', 'live'];
var points = [];
var profiles = [];
var selected_profile = 0;
var selected_profile_name = "leadfree";


var host = "ws://" + window.location.hostname + ":8080";
var ws_status = new WebSocket(host+"/status");
var ws_control = new WebSocket(host+"/control");
var ws_storage = new WebSocket(host+"/storage");


graph.profile =
{
    label: "Profile",
    data: [],
    points: { show: false },
    color: "#75890c",
    draggable: false
};

graph.live =
{
    label: "Live",
    data: [],
    points: { show: false },
    color: "#d8d3c5",
    draggable: false
};


function update_profile(id)
{
    selected_profile = id;
    job_time = parseInt(profiles[id].data[profiles[id].data.length-1][0]);
    var kwh = (3850*job_time/3600/1000).toFixed(2);
    var cost =  (kwh*0.26).toFixed(2);
    var minutes = Math.floor(job_time/60), seconds = job_time-minutes*60;
    job_time = minutes+':'+ (seconds < 10 ? "0" : "") + seconds;
    $('#sel_prof').html(profiles[id].name);
    $('#sel_prof_eta').html(job_time);
    $('#sel_prof_cost').html(kwh + ' kWh (EUR: '+ cost +')');
    graph.profile.data = profiles[id].data;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());
}


function updateProgress(percentage)
{
    if(state=="RUNNING")
    {
        if(percentage > 100) percentage = 100;
        $('#progressBar').css('width', percentage+'%');
        //if(percentage>9) $('#progressBar').html(parseInt(percentage)+'% - '+ eta);
    }
    else
    {
        $('#progressBar').css('width', 0+'%');
        $('#progressBar').html('');
    }
}


function runTask()
{
    var test =
    {
        "cmd": "RUN",
        "profile": profiles[selected_profile]
    }

    graph.live.data = [];
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

    ws_control.send(JSON.stringify(test));

}


function abortTask()
{
    var test = {"cmd": "STOP"};
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

    graph.profile.points.show = true;
    graph.profile.draggable = true;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
}

function leaveEditMode() {
    state="IDLE";
    $('#saveas').hide();
    $('#e2').select2('container').show();
    $('#main_status').slideDown();
    $('#nav_start').show();
    $('#btn_edit').show();
    $('#btn_exit').hide();

    graph.profile.points.show = false;
    graph.profile.draggable = false;
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());

}

function addNewPoint() {
    console.log(graph.profile.data);

    graph.profile.data.push([parseInt(graph.profile.data[graph.profile.data.length-1][0])+15, 25]);
    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ], getOptions());
    console.log(graph.profile.data);
}


function saveProfile()
{
    name = $('#form_profile_name').val();
    var rawdata = graph.plot.getData()[0].data
    var data = [];
    var last = -1;

    for(var i=0; i<rawdata.length;i++)
    {
        if(rawdata[i][0] > last)
        {
          data.push([rawdata[i][0], rawdata[i][1]]);
        }
        else
        {
          $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>ERROR 88:</b><br/>An oven is not a time-machine", {
            ele: 'body', // which element to append to
            type: 'alert', // (null, 'info', 'error', 'success')
            offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 385, // (integer, or 'auto')
            delay: 5000,
            allow_dismiss: true,
            stackup_spacing: 10 // spacing between consecutively stacked growls.
          });

          return false;
        }

        last = rawdata[i][0];
    }

    var profile = { "type": "profile", "data": data, "name": name }
    var put = { "cmd": "PUT", "profile": profile }

    var put_cmd = JSON.stringify(put);

    ws_storage.send(put_cmd);

    selected_profile_name = name;

    leaveEditMode();
}





function getOptions()
{

  var options =
  {

    series:
    {
      lines: { show: true },
	  points: { show: true }
    },

	xaxis:
    {
      tickSize: 30,
      min: 0,
      tickColor: 'rgba(216, 211, 197, 0.2)',
      font:
      {
        size: 12,
        lineHeight: 14,        weight: "normal",
        family: "LCDN",
        variant: "small-caps",
        color: "rgba(216, 211, 197, 0.85)"
      }
	},

	yaxis:
    {
  	  tickSize: 25,
      min: 0,
	  max: 250,
      tickDecimals: 0,
      draggable: false,
      tickColor: 'rgba(216, 211, 197, 0.2)',
      font:
      {
        size: 12,
        lineHeight: 14,
        weight: "normal",
        family: "LCDN",
        variant: "small-caps",
        color: "rgba(216, 211, 197, 0.85)"
      }
	},

	grid:
    {
	  color: 'rgba(216, 211, 197, 0.55)',
      borderWidth: 1,
      labelMargin: 10,
      mouseActiveRadius: 50
	},

    legend:
    {
      show: false
    }
  }

  return options;

}



$(document).ready(function()
{

    if(!("WebSocket" in window))
    {
        $('#chatLog, input, button, #examples').fadeOut("fast");
        $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
    }
    else
    {

        // Status Socket ////////////////////////////////

        ws_status.onopen = function()
        {
            console.log("Status Socket has been opened");

            $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Yay</b><br/>I'm alive",
            {
            ele: 'body', // which element to append to
            type: 'success', // (null, 'info', 'error', 'success')
            offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 385, // (integer, or 'auto')
            delay: 2500,
            allow_dismiss: true,
            stackup_spacing: 10 // spacing between consecutively stacked growls.
            });
        };

        ws_status.onclose = function()
        {
            $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>ERROR 1:</b><br/>Status Websocket not available", {
            ele: 'body', // which element to append to
            type: 'error', // (null, 'info', 'error', 'success')
            offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
            align: 'center', // ('left', 'right', or 'center')
            width: 385, // (integer, or 'auto')
            delay: 5000,
            allow_dismiss: true,
            stackup_spacing: 10 // spacing between consecutively stacked growls.
          });
        };

        ws_status.onmessage = function(e)
        {
            x = JSON.parse(e.data);

            if (x.type == "backlog")
            {
                if (x.profile)
                {
                    selected_profile_name = x.profile.name;
                }

                $.each(x.log, function(i,v) {
                    graph.live.data.push([v.runtime, v.temperature]);
                    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());
                });
            }

            if(state!="EDIT")
            {
                state = x.state;

                if (x.door == "OPEN")
                {

                }

                if (state!=state_last)
                {
                    if(state_last == "RUNNING")
                    {
                        $('#target_temp').html('---');
                        updateProgress(0);
                        $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Run completed</b>", {
                        ele: 'body', // which element to append to
                        type: 'success', // (null, 'info', 'error', 'success')
                        offset: {from: 'top', amount: 250}, // 'top', or 'bottom'
                        align: 'center', // ('left', 'right', or 'center')
                        width: 385, // (integer, or 'auto')
                        delay: 0,
                        allow_dismiss: true,
                        stackup_spacing: 10 // spacing between consecutively stacked growls.
                        });
                    }
                }

                if(state=="RUNNING")
                {
                    $("#nav_start").hide();
                    $("#nav_stop").show();

                    graph.live.data.push([x.runtime, x.temperature]);
                    graph.plot = $.plot("#graph_container", [ graph.profile, graph.live ] , getOptions());

                    left = parseInt(x.totaltime-x.runtime);
                    var minutes = Math.floor(left / 60);
                    var seconds = left - minutes * 60;
                    eta = minutes+':'+ (seconds < 10 ? "0" : "") + seconds;

                    updateProgress(parseFloat(x.runtime)/parseFloat(x.totaltime)*100);
                    $('#state').html(parseInt(parseFloat(x.runtime)/parseFloat(x.totaltime)*100) + '% <span class="glyphicon glyphicon-time" style="font-size: 16px; line-height: 33px"></span> ' + eta);
                    $('#target_temp').html(parseInt(x.target) + ' \xB0C');

                }
                else
                {
                    $("#nav_start").show();
                    $("#nav_stop").hide();
                    $('#state').html(state);
                }

                $('#act_temp').html(parseInt(x.temperature) + ' \xB0C');
                $('#heat').css("background-color", (x.heat > 0.5 ? "rgba(233, 28, 0, 0.84)" : "rgba(46, 12, 12, 0.62") );
                $('#air').css("background-color", (x.air > 0.5 ? "rgba(240, 199, 67, 0.84)" : "rgba(46, 38, 12, 0.62)") );
                $('#cool').css("background-color", (x.cool > 0.5 ? "rgba(74, 159, 255, 0.84)" : "rgba(12, 28, 46, 0.62)") );

                state_last = state;

            }
        };



        // Control Socket ////////////////////////////////


        ws_control.onopen = function()
        {
            ws_control.onmessage = function(e)
            {
                console.log (e.data);
            }

        };


        // Storage Socket ///////////////////////////////

        ws_storage.onopen = function()
        {
            ws_storage.send('GET');
        };


        ws_storage.onmessage = function(e)
        {
            message = JSON.parse(e.data);

            if(message.resp)
            {
                if(message.resp == "FAIL")
                {
                    if (confirm('Overwrite?'))
                    {
                        message.force=true;
                        console.log("Sending: " + JSON.stringify(message));
                        ws_storage.send(JSON.stringify(message));
                    }
                    else
                    {
                        //do nothing
                    }
                }

                return;
            }

            //the message is an array of profiles
            //FIXME: this should be better, maybe a {"profiles": ...} container?
            profiles = message;
            //delete old options in select
            $('#e2').find('option').remove().end();

            // fill select with new options from websocket
            for (var i=0; i<profiles.length; i++)
            {
                var profile = profiles[i];
                //console.log(profile.name);
                $('#e2').append('<option value="'+i+'">'+profile.name+'</option>');

                if (profile.name == selected_profile_name)
                {
                    selected_profile = i;
                    $('#e2').select2('val', i);
                    update_profile(i);
                }

            }

        };


        $("#e2").select2(
        {
            placeholder: "Select Profile",
            allowClear: false
        });


        $("#e2").on("change", function(e)
        {
            update_profile(e.val);
        });
    }
});
