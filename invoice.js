"use strict";

var current_project;

var saved_projects = new Object();

var configuration = {
	hourlyRate: 30,
	taxRate: 15,
};

// Toasts
const savedProjectToast = new bootstrap.Toast(document.getElementById("saved-toast"));

$(function() {
	loadProjects();
	loadConfiguration();
	setDefaults();
	$("input").change(recalculateProfit);

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
	})

	// Add button click handlers
	$("#clear-button").click(clearForm);
	$("#configuration-save-button").click(saveNewConfigs);
	$("#invoice-button").click(sendToInvoice);
	$("#save-button").click(saveProject);
	$("#project-save-button").click(modalSaveClick);
	$("#project-name-input").keyup(modalSaveInputChanged)
	$("#navbar-save-link").click(saveProject);
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
	}));
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
	}).change(recalculateProfit)).focus(function() {
		$(this).select();
	});
	row.append(div);

	// Material cost
	div = $("<div>").addClass("col-md-2 col-sm-4 col-4");
	div.append($("<input>").addClass("form-control material-cost").prop({
		type: "number",
		min: 0,
		value: cost
	}).change(recalculateProfit));
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
	console.log("Calculating materials cost");

	let totalCost = 0;
	let totalQuantity = 0;

	$("#materials-list > div").each((index, element) => {
		console.log(element);
		let quantity = $(element).find(".material-quantity").val();
		quantity = quantity.length == 0 ? 0 : parseFloat(quantity);
		let cost = $(element).find(".material-cost").val();
		cost = cost.length == 0 ? 0 : parseFloat(cost);

		console.log(`Material quantity: ${quantity}`);
		console.log(`Material cost: ${cost}`);

		let total = quantity * cost;
		console.log(`Material total: ${total}`);

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

	console.log("Revenue: " + revenue);
	console.log("Tax: " + tax);
	console.log("Tax withheld: " + tax_withheld);

	// Calculate labor cost
	let hours = $("#hours-input").val();
	hours = hours.length == 0 ? 0 : parseFloat(hours);
	let hourlyRate = $("#hourly-rate-input").val();
	hourlyRate = hourlyRate.length == 0 ? 0 : parseFloat(hourlyRate);
	
	console.log("Hours: " + hours);
	console.log("Hourly rate: " + hourlyRate);

	let laborCost = hours * hourlyRate;

	console.log("Labor cost: " + laborCost);

	// Calculate profit
	let profit = revenue - tax_withheld - laborCost - materialsCost;

	console.log("Profit: " + profit);

	// Update UI
	$("#profit").text(profit.toFixed(2));
	$("#tax-withheld").text(tax_withheld.toFixed(2));
	$("#labor-input").val(laborCost.toFixed(2));
}

function loadProjects() {
	let data = JSON.parse(localStorage.getItem("projects"));
	console.log(data);

	if (data) {
		saved_projects = data;
	}

	// Populate load projects dialog
	Object.entries(saved_projects).forEach(project => {
		console.log(project);
		let project_name = project[0];
		console.log(project_name);
		let option = $("<option>").attr("value", project_name).text(project_name);
		$("#load-project-select").append(option);
	});
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
	addNewMaterial();
	recalculateProfit();
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
	let estimate = serializeData();

	console.log("Estimate data:");
	console.log(estimate);
	sessionStorage.setItem("invoiceData", JSON.stringify(estimate));
	window.location = "/draft_invoice.html"
}

function serializeData() {
	let estimate = new Object();
	estimate.materials = [];

	// Serialize materials
	$("#materials-list").children().each((index, element) => {
		let material = new Object();

		material.name = $(element).find(".material-name").val();
		material.quantity = $(element).find(".material-quantity").val();
		material.unitCost = $(element).find(".material-cost").val();
		material.totalCost = $(element).find(".material-total").text().slice(1);

		console.log(material);

		if (material.name) {
			estimate.materials.push(material);
		}
	});

	estimate.name = $("#name-input").val();
	estimate.total = $("#revenue-input").val();
	estimate.totalHours = $("#hours-input").val();
	estimate.hourlyRate = $("#hourly-rate-input").val();
	estimate.laborCost = $("#labor-input").val();
	estimate.taxRate = $("#tax-input").val();
	estimate.materialsCost = calculateMaterialsCost();

	return estimate;
}

function saveProject() {
	if (!current_project) {
		// Prompt user to select a name for this project
		$("#save-modal").modal("show");
		return;
	}

	// Save project with given name
	console.log("Saving project");
	let project = serializeData();
	console.log(project);
	saved_projects[current_project] = project;
	localStorage.setItem("projects", JSON.stringify(saved_projects));
	console.log(saved_projects);
	
	// Show confirmation toast
	savedProjectToast.show();
}

function modalSaveClick() {
	let name = $("#project-name-input").val();
	console.log(name);
	if (name) {
		current_project = name;
		saveProject();
		$("#project-name").text(current_project);
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
	let project_name = $("#load-project-select").val();
	console.log("Loading project: " + project_name);
	$("#project-name").text(project_name);
	let project = saved_projects[project_name];
	current_project = project_name
	console.log(project);

	$("#revenue-input").val(project.total);
	// Materials
	$("#materials-list").empty();
	project.materials.forEach(material => {
		addNewMaterial(material.name, material.quantity, material.unitCost);
	});
	addNewMaterial(); // Add a blank material at the end

	$("#hours-input").val(project.totalHours);
	$("#hourly-rate-input").val(project.hourlyRate);
	$("#tax-input").val(project.taxRate);

	recalculateProfit();
	$("#load-modal").modal("hide");
}