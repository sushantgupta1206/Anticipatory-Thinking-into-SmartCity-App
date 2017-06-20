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
    tree_root = {
        "name": $('#mainEventInput').val(),
        "children": []
    };
    draw_tree({}, tree_root);
    $('#search-policy-button').removeClass('disabled');
});