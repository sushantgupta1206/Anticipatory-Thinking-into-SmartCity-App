var is_existing_saved = false;
var project_id = -1;
var policies = null;

$(document).ready(function(){
    $('#searchInput').prop("disabled", true);
    $('#search-con-button').prop("disabled", true);
    $('#search-policy-button').prop("disabled", true);

    $.ajax({
        'url': '/view_policies',
        'type': 'POST',
        'contentType': 'application/json',
        success: function(response){
            response = JSON.parse(response);
            console.log(response);
            policies = response.data;
        },
        error: function(request, status, error){                
            displayToastMessage('Error encountered retrieving policies');
        }
    });

    $("#CreateNodeForm").on('click', function () {
        var impact = $('#con-impact').val();
        console.log("Consequence type - " + impact);
        create_node(impact);
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
            //  1. Ask the user if he wants to save or discard
            //  2. Do the needful as per user choice
            //  3. Toggle the modal to create new project
            $('.project-exists').modal('toggle');            
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
                            'impact': 'neutral',
                            'root_ind': 1,//Only the root node will have this property
                            'children': [],
                            'likelihood': 0,
                            'notes': '',
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
                    displayToastMessage('Project with same name already exists');
                }//Toast message displayed for already existing projects
            },
            error: function(request, status, error){                
                displayToastMessage('Error encountered verifying new project name');
            },
            timeout: 2000
        });                      
    });

    $('#fw-save-project').on('click', function(e){
        e.preventDefault();
        console.log(tree_nodes);
        save_project();        
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
                                '<tr class="fw-proj-table-head">' +
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
                        html += '<tr class="fw-proj-table-row" data-pid=' + pid + '>' +
                                    '<td>' + pname + '</td>' + 
                                    '<td>' + owner + '</td>' + 
                                    '<td>' + dateStr + '</td>' +
                                '</tr>';
                    }                    
                    html += '</tbody></table>';
                    html += '<div class="info-group required">' +
                       '<label class="control-label">&nbsp;Click any row to open corresponding project</label></div>';
                    
                    $('.saved-projects').html(html);
                    $('.open-project').modal('toggle');
                    attachEvents();
                }
            },
            'error': function(request, status, error){                
                console.log(request.responseText);
                displayToastMessage('Failed to retieve saved items');
            },
            'timeout': 3000
        });
    });  
    
    $('#saveExistingProject').on('click', function(){
        is_existing_saved = true;
        save_project();        
    });

    $('#discardExistingProject').on('click', function(){
        discard_project();
    });

    $('#fw-delete-project').on('click', function(){
        delete_project();
    });

    $("#fw-view-policies").on('click', function(){
        $.ajax({
            'url': '/view_policies',
            'type': 'POST',
            'success': function (response) {
                response = JSON.parse(response);
                console.log(response);    
                var html = '<table class="table table-hover table-bordered">' + 
                '<thead>' +
                '<tr class="fw-policy-table-head">' +
                    '<th>Identifier</th>' +
                    '<th>Name</th>' +
                    '<th>Category</th>' +
                    '<th>Description</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody>';
                for(var i = 0; i < response.data.length; i++){
                    var pid = response.data[i].policyid;
                    var pname = response.data[i].policy_name;
                    var category = response.data[i].policy_category;
                    var desc = response.data[i].policy_desc;
                    html += '<tr class="fw-policy-row">' +
                                '<td>' + pid + '</td>' +
                                '<td>' + pname + '</td>' + 
                                '<td>' + category + '</td>' + 
                                '<td>' + desc + '</td>' +
                            '</tr>';
                }                    
                html += '</tbody></table>';                
                
                $('.view-policies').html(html);
                $('.view-policy').modal('toggle');            
            },
            'error': function(request, status, error){
                displayToastMessage('Policies could not be retrieved.');                
            },
            'timeout': 5000//timeout of the ajax call
        });
    });
});

function attachEvents(){
    $('.fw-proj-table-row').on('click', function(){
        var pid = $(this).attr('data-pid');        
        console.log(pid);
        if(pid > 0){
            $.ajax({
                'url': '/get_fw_project',
                'type': 'POST',
                'data': JSON.stringify({'pid': pid}),
                'contentType': 'application/json',
                'success': function(response){
                    response = JSON.parse(response);
                    console.log(response);
                    if(response.data != null){
                        var dataMap = {};
                        var dataMap = response.data.reduce(function(map, node) {
                            map[node.cnodeid] = node;
                            return map;
                        }, {});
                        var response_tree = [];
                        response.data.forEach(function(node) {
                            // add to parent
                            var parent = dataMap[node.cparentnodeid];
                            if (parent) {
                                // create child array if it doesn't exist
                                (parent.children || (parent.children = []))
                                    // add node to child array
                                    .push(node);
                            } else {
                                // parent is null or missing
                                response_tree.push(node);
                            }
                        });
                        console.log(response_tree);
                        response_tree[0].root_ind = 1;//Set the root indicator for the parent node.
                        tree_root = response_tree[0];
                        if($('.overlay').length){
                            //Save existing project in workflow and then remove it.
                            $('.overlay').remove();
                        }
                        project_name = response.pname;
                        project_id = pid;
                        draw_tree(tree_root);
                    }else{
                        project_id = pid;
                        project_name = response.pname;
                        displayToastMessage('No consequences created for the wheel');
                    }
                                        
                    $('.open-project').modal('toggle');
                },
                'error': function(request, status, error){
                    console.log(request.responseText);
                    displayToastMessage('Failed to load project from database');
                }
            });
        }        
    });
}

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
            if (source.hasOwnProperty(prop) && (prop === 'id' || prop === 'name' || prop === 'impact' || prop === 'importance' || prop === 'likelihood' || prop === 'notes' || prop === 'children' ||  prop === 'root_ind')) {
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
        obj.impact = item.impact;
        obj.likelihood = item.likelihood;
        obj.importance = item.importance;
        obj.root_ind = item.root_ind || 0;
        obj.notes = item.notes || '';
        obj.parentid = item.parent ? item.parent.id : 0;
        obj.policies = item.policies;
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

function displayToastMessage(msg){
    var x = document.getElementById("snackbar");
    x.innerHTML = msg;
    x.className = "show";
    setTimeout(function(){ 
        x.className = x.className.replace("show", ""); 
    }, 3000);
}

function save_project(){
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
                console.log(response);
                displayToastMessage('Project saved successfully');
                if(is_existing_saved){
                    $('.project-exists').modal('toggle');
                    $('.overlay').remove();
                    $('#createProjectModal').modal('toggle');
                }
                is_existing_saved = false;
                tree_root = null;
                tree_nodes = null;
            },
            'error': function(request, status, error){
                displayToastMessage('Project could not be saved.');
                is_existing_saved = false;
            },
            'timeout': 5000//timeout of the ajax call
        });
    }else{
        displayToastMessage('No project in the workflow to save');
    }
}

function discard_project(){
    //Clear the SVG element
    $('.overlay').remove();
    //Reset global params
    tree_root = null;
    tree_nodes = null;
    project_name = null;
    project_id = -1;
}

function delete_project(){    
    if(tree_root != null){
        if(project_id == -1){
            //When a new project is created but has not been saved yet
            discard_project();
            displayToastMessage('Project cleared from workspace');
            return;
        }else{
            $.ajax({
                'url': '/delete_project',
                'type': 'POST',
                'contentType': 'application/json',
                'data': JSON.stringify({
                    'pname': project_name,
                    'pid': project_id
                }),
                'success': function(response){
                    displayToastMessage(response);
                    //Reset the canvas and global variables
                    discard_project();
                },
                'error': function(request, status, error){
                    displayToastMessage('Project could not be deleted.');
                },
                'timeout': 2000
            });
        }        
    }else{
        if(project_id != -1){
            $.ajax({
                'url': '/delete_project',
                'type': 'POST',
                'contentType': 'application/json',
                'data': JSON.stringify({
                    'pname': project_name,
                    'pid': project_id
                }),
                'success': function(response){
                    displayToastMessage(response);
                    //Reset the canvas and global variables
                    discard_project();
                },
                'error': function(request, status, error){
                    displayToastMessage('Project could not be deleted.');
                },
                'timeout': 2000
            });
        }else{
            displayToastMessage('Nothing to delete');
        }
    }
}

function generatePolicies(selected, policyClass){ //policyClass will be used to differentiate between create new and edit modal
    var i;
    var html = "";
    html += "<label>Tag Policies</label><br/>";
    for(i = 0; i < policies.length; i++){
        html += "<input type='checkbox' class='" + policyClass + "' name='policy' data-policy-id='" + policies[i].policyid + "'" + ((selected.indexOf(policies[i].policyid) >= 0) ? "checked>" : ">") + policies[i].policy_name + "<br/>";
    }
    return html;
}
