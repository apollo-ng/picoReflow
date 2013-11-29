var state = "IDLE";
var graph;
var profiles = [];
var selected_profile = 0;
var selected_profile_name = "leadfree";
var host = "ws://" + window.location.hostname + ":8080";
var ws_status = new WebSocket(host+"/status");
var ws_control = new WebSocket(host+"/control");
var ws_storage = new WebSocket(host+"/storage");


function updateProgress(percentage, eta){
    if(state=="RUNNING") {
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', percentage+'%');
    if(percentage>9) $('#progressBar').html(parseInt(percentage)+'% - '+ eta);
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

      //console.log(JSON.stringify(test));

     ws_control.send(JSON.stringify(test));
     graph.series[1].setData([]);
}


function abortTask() {
      var test = {"cmd": "STOP"};
      //console.log(JSON.stringify(test));
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
    //console.log('Trying to save profile: ' + name);
    var rawdata = graph.series[0].data;
    var data = [];
    var last = -1;

    for(var i=0; i<rawdata.length;i++)
    {
        if(rawdata[i].x > last)
        {
          data.push([rawdata[i].x, rawdata[i].y]);
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

        last = rawdata[i].x;
    }

    var profile = { "type": "profile", "data": data, "name": name }
    var put = { "cmd": "PUT", "profile": profile }

    var put_cmd = JSON.stringify(put);

    ws_storage.send(put_cmd);

    //console.log('came to this: ' + put_cmd);

    selected_profile_name = name;

    leaveEditMode();
}



function update_profile(id) {
  //console.log('Profile selected:' + profiles[id].name);
  selected_profile = id;
  $('#sel_prof').html(profiles[id].name);
  //console.log(graph.series);
  graph.series[0].setData(profiles[id].data);
}










$(document).ready(function() {

  if(!("WebSocket" in window)){
  $('#chatLog, input, button, #examples').fadeOut("fast");
  $('<p>Oh no, you need a browser that supports WebSockets. How about <a href="http://www.google.com/chrome">Google Chrome</a>?</p>').appendTo('#container');
  }else{


// Status Socket ////////////////////////////////

ws_status.onopen = function()
{
    console.log("Status Socket has been opened");
         $.bootstrapGrowl("<span class=\"glyphicon glyphicon-exclamation-sign\"></span> <b>Yay</b><br/>I'm alive", {
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


// Control Socket ////////////////////////////////


ws_control.onopen = function()
{
    ws_control.onmessage = function(e)
    {
        console.log (e.data);
    }

    console.log("Control Socket has been opened");
}


// Storage Socket ///////////////////////////////

ws_storage.onopen = function()
{
    console.log("Storage Socket has been opened");

    ws_storage.onmessage = function(e)
    {
       console.log('Storage MSG:' + e.data);

       message = JSON.parse(e.data);

       console.log("Parsed message:" + message);

       if(message.resp)
       {
         console.log("RESP");
         if(message.resp == "FAIL")
         {
            console.log("FAIL");
            if (confirm('Overwrite?')) {
               //message.cmd="PUT";
               message.force=true;
               console.log("Sending: " + JSON.stringify(message));
               ws_storage.send(JSON.stringify(message));
            } else {
               //do nothing
            }
         }
         return;
       }
       //the message is an array of profiles
       //FIXME: this should be better, maybe a {"profiles": ...} container?
       profiles = message;
        //delete old options in select
        $('#e2')
        .find('option')
        .remove()
        .end();

        // fill select with new options from websocket
        for (var i=0; i<profiles.length; i++)
        {
                var profile = profiles[i];
                console.log(profile.name);
                $('#e2').append('<option value="'+i+'">'+profile.name+'</option>');

                if (profile.name == selected_profile_name)
                {
                    console.log('Matchiemazvhie');
                    selected_profile = i;
                    $('#e2').select2('val', i);
                    update_profile(i);
                }

        }

        graph.render();

    }

    console.log('Requesting stored profiles');
    ws_storage.send('GET');
}



$("#e2").select2({
  placeholder: "Select Profile",
  allowClear: false
});


$("#e2").on("change", function(e) {
  update_profile(e.val);
});



  }
});



