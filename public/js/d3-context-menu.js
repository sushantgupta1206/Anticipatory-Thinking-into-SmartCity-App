d3.contextMenu = function (menu, openCallback) {

	// create the div element that will hold the context menu
	d3.selectAll('.d3-context-menu').data([1])
		.enter()
		.append('div')
		.attr('class', 'd3-context-menu');

	// close menu
	d3.select('body').on('click.d3-context-menu', function() {
		d3.select('.d3-context-menu').style('display', 'none');
	});

	// this gets executed when a contextmenu event occurs
	return function(data, index) {	
		var elm = this;

		d3.selectAll('.d3-context-menu').html('');
		var list = d3.selectAll('.d3-context-menu').append('ul');
		list.selectAll('li').data(menu).enter()
			.append('li')
			.attr('class', function(d){
				if(d.divider)
					return "is-divider";
			})
			.html(function(d) {
				if(d.divider)
					return '<hr/>';
				var str = "<span>";
				if(d.title === "Create new consequence"){
					str = "<span class='create-con-option'>";
				}else if(d.title === "Edit consequence"){
					str = "<span class='edit-con-option'>";
				}else if(d.title === "Delete consequence"){
					str = "<span class='delete-con-option'>";
				}
				return (typeof d.title === 'string') ? str + d.title + "</span>" : str + d.title(data) + "</span>";
			})
			.on('click', function(d, i) {
				d.action(elm, data, index);
				d3.select('.d3-context-menu').style('display', 'none');
			});

		// the openCallback allows an action to fire before the menu is displayed
		// an example usage would be closing a tooltip
		if (openCallback) openCallback(data, index);

		// display context menu
		d3.select('.d3-context-menu')
			.style('left', (d3.event.pageX - 2) + 'px')
			.style('top', (d3.event.pageY - 2) + 'px')
			.style('display', 'block');

		d3.event.preventDefault();
		d3.event.stopPropagation();
	};
};