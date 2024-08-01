function $(id) {
	id = id.substr(1);
	return document.getElementById(id);
}

HTMLElement.prototype.show = function() {
	this.style.display = 'inline';
}

HTMLElement.prototype.hide = function() {
	this.style.display = 'none';
}

HTMLElement.prototype.val = function() {
	return this.value;
}

HTMLElement.prototype.click = function(listener) {
	this.addEventListener('click', listener);
}