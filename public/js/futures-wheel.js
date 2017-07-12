$("#CreateNodeForm").on('click', function () {
    var type = document.querySelector('input[name="con-type"]:checked').value;
    console.log("Consequence type - " + type);
    create_node(type);
    return false;
});

$("#EditConsequenceForm").on('click', function () {
    rename_node();
    return false;
});

$("#create-button").on('click', function () {
    var role = $(this).data('role');
    if(role === 'create-event'){
        tree_root = {
            "name": $('#mainEventInput').val(),
            "children": []
        };
        draw_tree(tree_root);
        $(this).attr('data-role', 'search-consequence');
        $(this).html('Search Consequences');
        console.log('Done!');
    }else{
        alert($this.text());
        console.log('TODO');
    }    
    $('#search-policy-button').removeClass('disabled');
});