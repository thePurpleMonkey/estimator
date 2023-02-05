"use strict";

var project_name;
var project;

var saved_projects = new Object();

var configuration = {
	hourlyRate: 30,
	taxRate: 15,
};

var form_dirty = false;

// Toasts
const savedProjectToast = new bootstrap.Toast(document.getElementById("saved-toast"));
const deleteEmptyProjectToast = new bootstrap.Toast(document.getElementById("delete-empty-project-toast"));

$(function() {
	loadProjects();
	loadConfiguration();
	setDefaults();
	$("input").change(recalculateProfit);
	$("input").change(makeFormDirty);

	$(".material-quantity").focus(function() {
		$(this).select();
	});

	$(".material-name").keyup(() => {
		if (checkForEmptyMaterial()) {
			addNewMaterial();
		}
	});

	$("#settings-link").click(() => {
		$("#configurationModal").modal("show");
	});

	addEventListener("beforeunload", dirtyPrompt, {capture: true});

	// Add button click handlers
	$("#clear-button").click(clearForm);
	$("#configuration-save-button").click(saveNewConfigs);
	$("#invoice-button").click(sendToInvoice);
	$("#save-button").click(saveProject);
	$("#project-save-button").click(modalSaveClick);
	$("#project-name-input").keyup(modalSaveInputChanged);
	$("#navbar-save-link").click(saveProject);
	$("#navbar-saveas-link").click(() => { $("#save-modal").modal("show"); loadProjects(); });
	$("#navbar-delete-link").click(navbarDelete);
	$("#confirm-delete-button").click(deleteProject);
	$("#navbar-load-link").click(showLoadProjectModal);
	$("#project-load-button").click(loadProject);

	$("#revenue-input").focus();
});

function checkForEmptyMaterial() {
	let result = true;

	$(".material-name").each((index, element) => {
		if (!$(element).val()) {
			result = false;
			return false;
		}
	});

	return result;
}

function addNewMaterial(name, quantity=1, cost) {
	let row = $("<div>").addClass("row");

	// Material name
	let div = $("<div>").addClass("col-md-6 col-sm-12 col-12");
	div.append($("<input>").addClass("form-control material-name").prop({
		type: "text",
		placeholder: "Name",
		value: name
	}).keyup(() => {
		if (checkForEmptyMaterial()) {
			addNewMaterial();
		}
	}).change(makeFormDirty));
	if (name) {

	}
	row.append(div);

	// Material quantity
	div = $("<div>").addClass("col-md-2 col-sm-4 col-4");
	div.append($("<input>").addClass("form-control material-quantity").prop({
		type: "number",
		min: 0,
		step: 1,
		value: quantity
	}).change(recalculateProfit).focus(function() {
		$(this).select();
	}).change(makeFormDirty));
	row.append(div);

	// Material cost
	div = $("<div>").addClass("col-md-2 col-sm-4 col-4");
	div.append($("<input>").addClass("form-control material-cost").prop({
		type: "number",
		min: 0,
		step: .01,
		value: cost
	}).change(recalculateProfit).change(makeFormDirty));
	row.append(div);

	// Material total
	div = $("<div>").addClass("col-md-2 col-sm-4 col-4 material-total-parent");
	// div.append($("<input>").addClass("form-control material-total").prop({
	// 	type: "number",
	// 	min: 0,
	// 	readonly: true,
	// 	disabled: true
	// }));
	div.append("<span>").addClass("material-total").text("$0.00");
	row.append(div);

	$("#materials-list").append(row);
}

function calculateMaterialsCost(e) {
	let totalCost = 0;
	let totalQuantity = 0;

	$("#materials-list > div").each((index, element) => {
		let quantity = $(element).find(".material-quantity").val();
		quantity = quantity.length == 0 ? 0 : parseFloat(quantity);
		let cost = $(element).find(".material-cost").val();
		cost = cost.length == 0 ? 0 : parseFloat(cost);

		let total = quantity * cost;

		// $(element).find(".material-total").val(total);
		$(element).find(".material-total").text("$" + total.toFixed(2));
		totalCost += total;
		totalQuantity += quantity;
	});

	$("#materials-cost").text("$" + totalCost.toFixed(2));
	$("#materials-quantity").text(totalQuantity);

	return totalCost;
}

function recalculateProfit(e) {
	let revenue = $("#revenue-input").val();
	let tax = $("#tax-input").val() / 100;
	let tax_withheld = revenue * tax;

	// Calculate material cost
	let materialsCost = calculateMaterialsCost(e);

	// Calculate labor cost
	let hours = $("#hours-input").val();
	hours = hours.length == 0 ? 0 : parseFloat(hours);
	let hourlyRate = $("#hourly-rate-input").val();
	hourlyRate = hourlyRate.length == 0 ? 0 : parseFloat(hourlyRate);

	let laborCost = hours * hourlyRate;

	// Calculate profit
	let profit = revenue - tax_withheld - laborCost - materialsCost;

	// Update UI
	$("#profit").text(profit.toFixed(2));
	$("#tax-withheld").text(tax_withheld.toFixed(2));
	$("#labor-input").val(laborCost.toFixed(2));
}

function loadConfiguration() {
	let savedConfig = JSON.parse(localStorage.getItem("configuration"));
	if (savedConfig) {
		configuration = savedConfig;
	}
}

function saveConfiguration() {
	let config = JSON.stringify(configuration);
	localStorage.setItem("configuration", config);
}

function setDefaults() {
	console.log("Default hourly rate: " + configuration.hourlyRate);
	console.log("Default tax rate: " + configuration.taxRate);
	$("#hourly-rate-input").val(configuration.hourlyRate);
	$("#tax-input").val(configuration.taxRate);

	$("#default-hourly-rate").val(configuration.hourlyRate);
	$("#default-tax-rate").val(configuration.taxRate);
}

function clearForm() {
	console.log("Clearing form");
	$("#revenue-input").val("");
	$("#hours-input").val("");
	$("#materials-list").empty();
	$("#tax-input").val(configuration.taxRate);
	$("#hourly-rate-input").val(configuration.hourlyRate);
	addNewMaterial();
	recalculateProfit();
	form_dirty = false;
}

function saveNewConfigs() {
	let newTaxRate = parseFloat($("#default-tax-rate").val());
	let newHourlyRate = parseFloat($("#default-hourly-rate").val());

	if (newTaxRate) {
		configuration.taxRate = newTaxRate;
	}

	if (newHourlyRate) {
		configuration.hourlyRate = newHourlyRate;
	}

	saveConfiguration();
	setDefaults();
	recalculateProfit();

	$("#configurationModal").modal("hide");
}

function sendToInvoice() {
	if (project_name) {
		sessionStorage.setItem("currentProject", project_name);
		sessionStorage.removeItem("estimate");
	} else {
		// User has not saved estimate
		sessionStorage.removeItem("currentProject");
		
		let estimate = serializeData();
		sessionStorage.setItem("estimate", JSON.stringify(estimate));
	}

	window.location = "/draft_invoice.html"
}

function serializeProject() {
	project.materials = [];

	// Serialize materials
	$("#materials-list").children().each((index, element) => {
		let material = new Object();

		material.name = $(element).find(".material-name").val();
		material.quantity = $(element).find(".material-quantity").val();
		material.unitCost = $(element).find(".material-cost").val();
		material.totalCost = $(element).find(".material-total").text().slice(1);

		console.log(material);

		if (material.name) {
			project.materials.push(material);
		}
	});

	project.name = $("#name-input").val();
	project.total = $("#revenue-input").val();
	project.totalHours = $("#hours-input").val();
	project.laborHourlyRate = $("#hourly-rate-input").val();
	project.laborCost = $("#labor-input").val();
	project.taxRate = $("#tax-input").val();
	project.materialsCost = calculateMaterialsCost();

	return project;
}

function modalSaveClick() {
	let name = $("#project-name-input").val();
	console.log(name);
	if (name) {
		project_name = name;
		saveProject();
		$("#project-name").text(project_name);
	}
	$("#save-modal").modal("hide");
}

function modalSaveInputChanged() {
	if ($("#project-name-input").val()) {
		$("#project-save-button").removeAttr("disabled");
	} else {
		$("#project-save-button").attr("disabled", true);
	}
}

function showLoadProjectModal() {
	$("#load-modal").modal("show");
}

function loadProject() {
	project_name = $("#load-project-select").val();
	console.log("Loading project: " + project_name);
	$("#project-name").text(project_name);
	project = saved_projects[project_name];
	console.log(project);

	$("#revenue-input").val(project.total);
	// Materials
	$("#materials-list").empty();
	project.materials.forEach(material => {
		addNewMaterial(material.name, material.quantity, material.unitCost);
	});
	addNewMaterial(); // Add a blank material at the end

	$("#hours-input").val(project.totalHours);
	$("#hourly-rate-input").val(project.laborHourlyRate);
	$("#tax-input").val(project.taxRate);

	recalculateProfit();
	form_dirty = false;
	$("#load-modal").modal("hide");
}

function dirtyPrompt(event) {
	if (form_dirty) {
		event.preventDefault();
		return event.returnValue = "Are you sure you want to leave? There are unsaved changes on this page.";
	}
}

function makeFormDirty() {
	form_dirty = true;
}

function deleteCurrentProject() {
	delete saved_projects[project_name];
	project_name = ""
	$("#project-name").text("New")

	// Save new project list
	localStorage.setItem("projects", JSON.stringify(saved_projects));
	form_dirty = false;

	// Reload saved projects
	loadProjects();
}

function navbarDelete() {
	if (!project_name) {
		deleteEmptyProjectToast.show();
	} else {
		$("#confirm-delete-modal").modal("show");
	}
}

function deleteProject() {
	deleteCurrentProject();
	clearForm();
	$("#confirm-delete-modal").modal("hide");
}