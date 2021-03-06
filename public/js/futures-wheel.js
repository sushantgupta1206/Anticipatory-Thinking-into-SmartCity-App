
var is_existing_saved = false;
var project_id = -1;
var policies = null;
var policy_map = {};
var btnUndo;
var undoManager = new UndoManager();

$(document).ready(function(){
    //Leave the search section disabled initially when no project is there in the workspace.
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
            for(var i = 0; i < policies.length; i++){
                policy_map[policies[i].policyid] = policies[i].policy_name;
            }
            console.log(policy_map);
        },
        error: function(request, status, error){                
            displayToastMessage('Error encountered retrieving policies');
        }
    });

    $("#CreateNodeForm").on('click', function () {
        var impact = $('#con-impact').val();
        console.log("Consequence type - " + impact);
        create_node(impact, undoManager);
        return false;
    });

    $("#EditConsequenceForm").on('click', function () {
        edit_node();
        return false;
    });

    
    btnUndo = $('#fw-undo-action');
    //btnRedo = $('#fw-redo-action');
    
    function updateUI() {
        btnUndo.disabled = !undoManager.hasUndo();
        //btnRedo.disabled = !undoManager.hasRedo();
    }

    undoManager.setCallback(updateUI);
    undoManager.setLimit(3);
    
    $('#fw-undo-action').on('click', function(e){
        //e.preventDefault();
        undoManager.undo();
        updateUI();       
    });


    // $('#fw-redo-action').on('click', function(e){
    //     e.preventDefault();
    //     console.log("in redo operation");
    //     undoManager.redo();
    //     updateUI();
    //     undo_function();        
    // });

    $("#search-con-button").on('click', function () {
        clearAll(tree_root);
        expandAll(tree_root);
        var search = $('#searchInput').val();
		searchTree(tree_root,search);
        tree_root.children.forEach(collapseAllNotFound);
        outer_update(tree_root);
        if(consFlag === 0){
            displayToastMessage("Search item not found please try again");
        }
    });    
        
    
    $("#search-policy-button").on('click', function () {
        clearAll(tree_root);
        expandAll(tree_root);
        var searchPolicy = $('#searchInput').val();
        var keys = [];
        for (var key in policy_map) {
            var value = policy_map[key].toLowerCase();
            if (value && value.includes(searchPolicy.toLowerCase())) {
                keys.push(key);
            }
        }
        searchTreePolicy(tree_root, keys);
        tree_root.children.forEach(collapseAllNotFound);
        outer_update(tree_root);
        if (policyFlag === 0) {
            displayToastMessage("Search item not found in policy list please try again");
        }
    });
   
    $('#fw-create-new').on('click', function(){
        if(tree_root){
            //TODO - If a project is already in progress. Decide what needs to be done!   
            //  1. Ask the user if he wants to save or discard
            //  2. Do the needful as per user choice
            //  3. Toggle the modal to create new project
            $('.project-exists').modal('toggle');            
        }else{
            $('.create-project-modal').modal('toggle');
        }            
    });

    //When create project button is clicked
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
                        draw_tree(tree_root, undoManager);
                        $('#searchInput').prop("disabled", false);
                        $('#search-con-button').prop("disabled", false);
                        $('#search-policy-button').prop("disabled", false);                        
                        $('.create-project-modal').modal('toggle');
                    }
                }else if(response.status == 200 && !response.isAvailable){
                    displayToastMessage('Project with same name already exists. Please choose another name for your new project.');
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

    //When user clicks the "Load Project" option in left sidebar
    $('#fw-view-items').on('click', function(){
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
                        var dateStr = (pdate.getMonth() + 1) + '/' + pdate.getDate() + '/' + pdate.getFullYear();
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
                    $('.open-project').modal('toggle');$('#search-con-button').prop("disabled", false);
                    $('#searchInput').prop("disabled", false);
                    $('#search-con-button').prop("disabled", false);
                    $('#search-policy-button').prop("disabled", false);
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
        $('.create-project-modal').modal('toggle');
    });

    $('#fw-delete-project').on('click', function(){
        var deletion = delete_project();
        delete_project();
    });

    $('#fw-delete-account').on('click', function(){
        window.location.href = "/delete_account";
    });

    $('#fw-add-policies').on('click', function(){
        var pid = $('#newPolicyIdentifier').val('');
        var pname = $('#newPolicyName').val('');
        var pcat = $('#newPolicyCategory').val('');
        var pdesc = $('#policy-desc').val('');
        $('.error-msg').html('');
        $('#addPolicyModal').modal({backdrop: 'static', keyboard: false, show: true});
    });

    $('#CreatePolicy').on('click', function(){
        var pid = $('#newPolicyIdentifier').val();
        var pname = $('#newPolicyName').val();
        var pcat = $('#newPolicyCategory').val();
        var pdesc = $('#policy-desc').val();

        //Validate the text input entered by the user.
        var i, code;
        for(i = 0; i < pid.length; i++){
            code = pid.charCodeAt(i);
            if(!isAlphaNumeric(pid.charAt(i)) && !isWhiteSpace(pid.charAt(i)) && code !== 46 || pid.length < 3 || pid.length > 10){
                $('.error-msg').html(generateAlertMessage('Invalid identifier format. Should contain only numbers and letters of length 3-10 characters.'));
                $('#newPolicyIdentifier').focus();
                return false;
            }
        }

        for(i = 0; i < pname.length; i++){
            code = pname.charCodeAt(i);
            if(!isAlphaNumeric(pname.charAt(i)) && !isWhiteSpace(pname.charAt(i)) || pname.length < 3 || pname.length > 50){
                $('.error-msg').html(generateAlertMessage('Invalid policy name format. Should contain only numbers and letters of length 3-50 characters.'));
                $('#newPolicyName').focus();
                return false;
            }
        }

        for(i = 0; i < pcat.length; i++){
            code = pcat.charCodeAt(i);
            if(!isAlphaNumeric(pcat.charAt(i)) && !isWhiteSpace(pcat.charAt(i)) || pcat.length < 3 || pcat.length > 50){
                $('.error-msg').html(generateAlertMessage('Invalid policy category format. Should contain only numbers and letters of length 3-50 characters.'));
                $('#newPolicyCategory').focus();
                return false;
            }
        }

        for(i = 0; i < pdesc.length; i++){
            code = pdesc.charCodeAt(i);
            if(!isAlphaNumeric(pdesc.charAt(i)) && !isWhiteSpace(pdesc.charAt(i)) && code !== 44 && code !== 45 && code!== 46 || pdesc.length < 10 || pdesc.length > 500){
                $('.error-msg').html(generateAlertMessage('Invalid policy description format. Should contain only numbers, letters and (.,-) of length 10-500 characters.'));
                $('#policy-desc').focus();
                return false;
            }
        }

        $.ajax({
            'url': '/add_policy',
            'type': 'POST',
            'contentType': 'application/json',
            'data': JSON.stringify({                
                'pid': pid,
                'pname': pname,
                'pcat': pcat,
                'pdesc': pdesc                
            }),
            'success': function(response){
                console.log('Policy added successfully');
                $('#addPolicyModal').modal('toggle');
                policies.push({
                    'policyid': pid,
                    'policy_name': pname,
                    'policy_category': pcat,
                    'policy_desc': pdesc
                });
                //Update policy map
                policy_map[pid] = pname;                
            },
            'error': function(request, status, error){
                if(request.responseText === 'Policy with same identifier already exists'){
                    displayToastMessage('Policy with the same identifier already exists.');
                }else{
                    displayToastMessage('There was an error adding the policy');
                }                
            },
            'timeout': 5000//timeout of the ajax call
        });
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
                policies = response.data;
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

    $('#fw-export-project').on('click', function(){
        /* This is to save as an image, but there is problems rendering the css correctly
        var fw_svg = document.getElementsByClassName('overlay')[0];
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var data = (new XMLSerializer()).serializeToString(fw_svg);
        var DOMURL = window.URL || window.webkitURL || window;
      
        var img = new Image();
        var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svgBlob);
      
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);

            var imgURI = canvas
                .toDataURL('image/png')
                .replace('image/png', 'image/octet-stream');
            
            triggerDownload(imgURI);
        };      
        img.src = url; 
        */
        //Make use of pptxgen library to generate slides for each consequence item.
        var pptx = new PptxGenJS();
        var consequencesArr = copyArray(tree_nodes);
       
        var slide = pptx.addNewSlide();
        slide.addText(
            consequencesArr[0].name,
            { x: 0.0, y: 0.25, w: '100%', h: 1.5, align: 'c', font_size: 24, color: '0088CC', fill: 'F1F1F1' }
        );
        for(var i = 1; i < consequencesArr.length; i++){
            var slide = pptx.addNewSlide();
            slide.addText(
                consequencesArr[i].name,
                { x:0.0, y:0.25, w:'100%', h:1.0, align:'c', font_size:24, color:'0088CC', fill:'F1F1F1' }
            );
            slide.addText("Related Description", { x:1.0, y:1.5, w:'100%', h:0.38, color:'0088CC' });
            var related_text = "";
            related_text += ("Impact : " + consequencesArr[i].impact + "\n");
            related_text += ("Importance : " + consequencesArr[i].importance + "\n");
            related_text += ("Notes : " + ((consequencesArr[i].notes.length) ? consequencesArr[i].notes : "Not Applicable") + "\n");
            var related_policies = [];
            for(var k = 0; k < consequencesArr[i].policies.length; k++){
                related_policies.push(policy_map[consequencesArr[i].policies[k]]);
            }
            related_text += ("Policies : " + related_policies + "\n");

            slide.addText(
                related_text,
                { x:1.0, y:2.0, w:'100%', h:1, color:'393939', font_size:16, bullet:true }
            );
        }     
        pptx.save(project_name);
    });

    $('#fw-logout').on('click', function(){
        if(tree_root == null){
            window.location.href = "/logout";
        }else{
            $('.save-project-before-logout').modal('toggle');
        }
    });

    $('#discardProjectLogout').on('click', function(){
        discard_project();
        window.location.href = "/logout";
    });

    $('#saveProjectLogout').on('click', function(){
        if(tree_root !== null){
            $.ajax({
                'url': '/save_project',
                'type': 'POST',
                'contentType': 'application/json',
                'data': JSON.stringify({
                    'pname': project_name,
                    'fw': copyArray(tree_nodes)
                    }),
                'success': function (response) {
                    response = JSON.parse(response);
                    console.log(response);
                    project_id = response.pid;
                    console.log('Project saved successfully'); 
                    window.location.href = "/logout";
                },
                'error': function(request, status, error){
                    displayToastMessage('Project could not be saved.');                
                },
                'timeout': 5000//timeout of the ajax call
            });
        }else{
            console.log('Nothing to save in auto-save');
        }
    });
});

function triggerDownload(imgURI) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });


    var a = document.createElement('a');
    a.setAttribute('download', project_name + '.png');
    a.setAttribute('href', imgURI);
    a.setAttribute('target', '_blank');
    a.dispatchEvent(evt);
    //document.body.removeChild(a);
}

function isAlphaNumeric(str) {
    var code = str.charCodeAt(0);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
    }    
    return true;
};

function isWhiteSpace(s) {
    return /\s/g.test(s);
}

function attachEvents(){
    $('.fw-proj-table-row').on('click', function(){
        var pid = $(this).attr('data-pid');        
       
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
                        draw_tree(tree_root, undoManager);
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
            if (source.hasOwnProperty(prop) && (prop === 'id' || prop === 'name' || prop === 'impact' || prop === 'importance' || prop === 'likelihood' || prop === 'notes' || prop === 'children' ||  prop === 'root_ind' || prop === 'policies')) {
                clone[prop] = copyObject(source[prop]);
            }
            //When a node is collapsed, the child nodes are stored in the _children property.
            if (source.hasOwnProperty(prop) && prop === '_children'){
                clone['children'] = copyObject(source[prop]);
            }
            if(source.hasOwnProperty(prop) && prop === 'parent'){
                clone['parentid'] = source[prop].id;
            }
            if(!('parent' in source)){
                clone['parentid'] = 0;
            }
            if(!('root_ind' in source)){
                clone['root_ind'] = 0;
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
    return result;
}

//Triggers a d3 click event on the consequence nodes
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
                response = JSON.parse(response);
                console.log(response);
                project_id = response.pid;
                displayToastMessage('Project saved successfully');
                if(is_existing_saved){
                    $('.project-exists').modal('toggle');
                    $('.overlay').remove();
                    $('.create-project-modal').modal('toggle');
                }
                is_existing_saved = false;
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

function save_project1(deletedpro){
    if(deletedpro != null){
        $.ajax({
            'url': '/save_project',
            'type': 'POST',
            'contentType': 'application/json',
            'data': JSON.stringify({
                'pname': 'copy',
                'fw': copyArray(treeNode)
                }),
            'success': function (response) {
                displayToastMessage('Project saved successfully with name copy');
                if(is_existing_saved){
                    $('.project-exists').modal('toggle');
                    $('.overlay').remove();
                    $('.create-project-modal').modal('toggle');
                }
                is_existing_saved = false;
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
var deletedpro = null;
var treeNode = null;
//var dataObj = null;

function delete_project(){ 
       
    if(tree_root != null){
        deletedpro = tree_root;
        treeNode = tree_nodes;
        if(project_id == -1){
            //When a new project is created but has not been saved yet
            discard_project();
            displayToastMessage('Project cleared from workspace');
            undoManager.add({
                undo: function () {
                    save_project1();
                }
                // redo: function () {
                //     console.log("inside redo function");
                //     delete_project();
                // }
            });
            return;
        }else{
            undoManager.add({
                undo: function () {
                    save_project1(deletedpro);
                }
                // redo: function () {
                //     console.log("inside redo function");
                //     delete_project();
                // }
            });
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

var autoSaveFunction = setInterval(function(){
    if(tree_root !== null){
        $.ajax({
            'url': '/save_project',
            'type': 'POST',
            'contentType': 'application/json',
            'data': JSON.stringify({
                'pname': project_name,
                'fw': copyArray(tree_nodes)
                }),
            'success': function (response) {
                response = JSON.parse(response);
                console.log(response);
                project_id = response.pid;
                console.log('Project saved successfully');                
            },
            'error': function(request, status, error){
                console.log('Project could not be saved.');                
            },
            'timeout': 5000//timeout of the ajax call
        });
    }else{
        console.log('Nothing to save in auto-save');
    }    
}, 60000);

function generateAlertMessage(msg){
    var html = '<div class="alert alert-danger alert-dismissable fw-alert">' +
					'<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' + 
					msg + '</div>';
	return html;
}
