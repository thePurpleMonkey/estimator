"use strict";

var project_name;
var saved_projects;
var estimate;
var project;
var form_dirty;

const savedProjectToast = new bootstrap.Toast(document.getElementById("saved-toast"));

$(function() {
	loadProjects();
	loadEstimate();
	populateInvoice();

	$("#save-button").click(saveProject);
	$("#print-button").click(printInvoice);
	$("#discard-button").click(confirmDiscardInvoice);
	$("#modal-discard-button").click(discardInvoice);
	$("#navbar-load-link").click(showLoadProjectModal);
	$("#project-load-button").click(loadProject);
});

function loadEstimate() {
	project_name = sessionStorage.getItem("currentProject");
	if (project_name) {
		// Load saved project
		console.log("saved_projects:");
		console.log(saved_projects);
		project = saved_projects[project_name];
		console.log("Loading project: " + project_name);
	} else {
		// Load estimate from sessionStorage
		project = JSON.parse(sessionStorage.getItem("estimate"));
		console.log("Loading estimate.");
	}
	console.log(project);
}

function populateInvoice() {
	console.log("Populating invoice:");
	console.log(project);
	if (project.date) {
		$("#date-input").val(project.date);
	} else { 
		$("#date-input").val(new Date().toISOString().substring(0, 10));
	}
	$("#hours-input").val(project.totalHours);
	$("#hourly-input").val(project.customerHourlyRate);
	if (project.company) { $("#company-input").val(project.company); }
	if (project.customer) { $("#customer-input").val(project.customer); }
	$("#company-address-input").val(project.companyAddress);
	$("#customer-address-input").val(project.customerAddress);
	$("#description-input").val(project.description);
	// Materials
	$("#materials-list").empty();
	project.materials.forEach(material => {
		if (material.name != "") {
			addMaterial(material.name, material.quantity, material.unitCost, material.totalCost);
		}
	});
	addMaterial(); // Add blank material for user modification
	$("#invoice-total-input").val(project.total);
	$("#material-cost-input").val(project.materialsCost);
	$("#total-hourly-input").val(project.laborCost);
}

function addMaterial(name, quantity, unitCost, totalCost) {
	let materialDiv = $("<div>").addClass("row");
	let quantityInput = $("<div>").addClass("col-3").append($("<input type='number'>").addClass("form-control col-6 material-quantity").val(quantity));
	let materialInput = $("<div>").addClass("col-6").append($("<input type='text'>").addClass("form-control col-6 material-name").val(name));
	let totalCostInput = $("<div>").addClass("col-3").append($("<input type='number'>").addClass("form-control col-6 material-total-cost").data("unit-cost", unitCost).val(totalCost));
	
	materialDiv.append(quantityInput);
	materialDiv.append(materialInput);
	materialDiv.append(totalCostInput);

	$("#materials-list").append(materialDiv);
}

function serializeProject() {
	project.date = $("#date-input").val();
	project.totalHours = $("#hours-input").val();
	project.customerHourlyRate = $("#hourly-input").val();
	project.company = $("#company-input").val();
	project.customer = $("#customer-input").val();
	project.companyAddress = $("#company-address-input").val();
	project.customerAddress = $("#customer-address-input").val();
	project.description = $("#description-input").val();
	// Materials
	project.materials = [];
	$("#materials-list").children().each((index, row) => {
		let material = {
			name: $(row).find(".material-name").val(),
			quantity: $(row).find(".material-quantity").val(),
			totalCost: $(row).find(".material-total-cost").val(),
			unitCost: $(row).find(".material-total-cost").data("unit-cost"),
		};

		if (material.name) {
			project.materials.push(material);
		}
	});
	project.laborCost = $("#total-hourly-input").val();
	project.materialsCost = $("#material-cost-input").val();
	project.total = $("#invoice-total-input").val();

	return project;
}

function saveInvoice() {
	let data = serializeProject();

	console.log("Saving invoice:");
	console.log(data);

	if (localInvoicePresent) {
		$("#overwrite-modal").modal("show");
		return;
	}

	localStorage.setItem("invoiceData", JSON.stringify(data));
	sessionStorage.removeItem("invoiceData"); // Saved data to local storage, so clear previous data from session storage
	source = "local"; // Change the source since we moved where the invoice is
	savedProjectToast.show();
}

function printInvoice() {
	let invoice = serializeProject();

	console.log("Invoice to print:");
	console.log(invoice);

	sessionStorage.setItem("printInvoiceData", JSON.stringify(invoice));
	window.location = "/print_invoice.html";
	// window.open("/print_invoice.html", "_blank");
}

function confirmDiscardInvoice() {
	switch (source) {
		case "session":
			$("#source-session").removeClass("d-none");
			break;
			
		case "local":
			$("#source-local").removeClass("d-none");
			break;
	}
	$("#discard-modal").modal("show");
}

function discardInvoice() {
	switch (source) {
		case "session":
			sessionStorage.removeItem("invoiceData");
			break;

		case "local":
			localStorage.removeItem("invoiceData");
			break;
	}

	sessionStorage.setItem("suppressWarning", true);
	location.reload();
}

function showLoadProjectModal() {
	$("#load-modal").modal("show");
}

function loadProject() {
	let project_name = $("#load-project-select").val();
	console.log("Loading project: " + project_name);
	project = saved_projects[project_name];
	project_name = project_name;
	populateInvoice();
	$("#load-modal").modal("hide");
}