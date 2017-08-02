$(document).ready(function(){
    $('#searchInput').prop("disabled", true);
    $('#search-con-button').prop("disabled", true);
    $('#search-policy-button').prop("disabled", true);    

    $("#CreateNodeForm").on('click', function () {
        var type = $('#con-impact').val();
        console.log("Consequence type - " + type);
        create_node(type);
        return false;
    });

    $("#EditConsequenceForm").on('click', function () {
        edit_node();
        return false;
    });

    $("#search-con-button").on('click', function () {
        
    });

    $('#fw-create-new').on('click', function(){
        if(tree_root){
            //TODO - If a project is already in progress. Decide what needs to be done!        
        }else{
            $('#createProjectModal').modal('toggle');
        }            
    });

    $('#CreateProjectForm').on('click', function(){        
        $.ajax({
            url: '/check_project_name',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                pname: $('#newProjectName').val()
            }),
            success: function(response){
                console.log(response);
                response = JSON.parse(response);
                if(response.status == 200 && response.isAvailable){
                    if(tree_root == null){    
                        project_name = $('#newProjectName').val()    
                        tree_root = {
                            'name': $('#rootNodeName').val(),
                            'type': 'neutral',
                            'root_ind': 1,//Only the root node will have this property
                            'children': [],
                            'likelihood': 0,
                            'comments': '',
                            'policies': [],
                            'importance': 'high'
                        };
                        draw_tree(tree_root);
                        $('#searchInput').prop("disabled", false);
                        $('#search-con-button').prop("disabled", false);
                        $('#search-policy-button').prop("disabled", false);
                        $('#createProjectModal').modal('toggle');
                    }
                }else if(response.status == 200 && !response.isAvailable){
                    //If the user already has a project by the same name
                    //Display some alert message
                    var html = '<div class="alert alert-danger alert-dismissable fw-alert">' +
                        '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' + 
                        '<strong>Error!</strong> Project with same name already exists.</div>';
                    $('.proj-exists-message').html(html);
                }
            },
            error: function(xhr, ajaxOptions, thrownError){
                console.log('AJAX Error');
            },
            timeout: 2000
        });                      
    });

    $('#fw-save-project').on('click', function(e){
        e.preventDefault();
        console.log(tree_nodes);
        if(tree_root != null){
            $.ajax({
                'url': '/save_project',
                'type': 'POST',
                'contentType': 'application/json',
                'data': JSON.stringify({
                    'pname': project_name,
                    'fw': copyArray(tree_nodes)
                    }),
                'success': function (response) {
                    //what to do in success
                    console.log('ajax call successful');
                    console.log(response);
                },
                'error': function(xhr, ajaxOptions, thrownError){
                    //what to do in case of error
                    console.error('AJAX error');
                },
                'timeout': 5000//timeout of the ajax call
            });
        }        
    });

    $('#fw-view-items').on('click', function(){
        console.log('Open Project');
        $.ajax({
            'url': '/view_items',
            'type': 'POST',
            'contentType': 'application/json',            
            'success': function(response){
                response = JSON.parse(response);
                console.log(response);
                var html = "";
                if(response.resultLength == 0){
                    $('.saved-projects').html('No saved projects found');
                    $('.open-project').modal('toggle');                  
                }else{
                    html += '<table class="table table-hover table-bordered">' + 
                                '<thead>' +
                                '<tr>' +
                                    '<th>Project Name</th>' +
                                    '<th>Project Owner</th>' +
                                    '<th>Created Date</th>' +
                                '</tr>' +
                                '</thead>' +
                                '<tbody>';
                    for(var i = 0; i < response.resultLength; i++){
                        var pid = response.result[i].pid;
                        var pname = response.result[i].pname;
                        var owner = response.result[i].name;
                        var pdate = new Date(response.result[i].created_dttm);
                        var dateStr = (pdate.getMonth() + 1) + '/' + pdate.getDay() + '/' + pdate.getFullYear();
                        html += '<tr data-pid=' + pid + '>' +
                                    '<td>' + pname + '</td>' + 
                                    '<td>' + owner + '</td>' + 
                                    '<td>' + dateStr + '</td>' +
                                '</tr>';
                    }
                    html += '</tbody></table>';
                    html += '<div class="info-group required">' +
                       '<label class="control-label">&nbsp;Click any row to open corresponding project</label></div>';
                    //html += '<span>Click any row to open corresponding project</span>';
                    $('.saved-projects').html(html);
                    $('.open-project').modal('toggle');
                }
            },
            'error': function(request, status, error){                
                console.log(request.responseText);
            },
            'timeout': 3000
        });
    });
});

function copyObject(source){
    if (Object.prototype.toString.call(source) === '[object Array]') {
        var clone = [];
        for (var i = 0; i < source.length; i++) {
            clone[i] = copyObject(source[i]);
        }
        return clone;
    } else if (typeof(source)=="object") {
        var clone = {};
        for (var prop in source) {
            if (source.hasOwnProperty(prop) && (prop === 'id' || prop === 'name' || prop === 'type' || prop === 'importance' || prop === 'likelihood' || prop === 'comments' || prop === 'children' ||  prop === 'root_ind')) {
                clone[prop] = copyObject(source[prop]);
            }
            if(source.hasOwnProperty(prop) && prop === 'parent'){
                clone['cparentnodeid'] = source[prop].id;
            }
        }
        return clone;
    } else {
        return source;
    }
}

function copyArray(source){
    var result = [];
    for(var i = 0; i < source.length; i++){
        var item = source[i];
        console.log(item);
        var obj = {};
        obj.id = item.id;
        obj.name = item.name;
        obj.impact = item.type;
        obj.likelihood = item.likelihood;
        obj.importance = item.importance;
        obj.root_ind = item.root_ind || 0;
        obj.comments = item.comments || '';
        obj.parentid = item.parent ? item.parent.id : 0;
        result.push(obj);
    }
    console.log('modified array');
    console.log(result);
    return result;
}

jQuery.fn.d3Click = function () {
  this.each(function (i, e) {
    var evt = new MouseEvent("click");
    e.dispatchEvent(evt);
  });
};