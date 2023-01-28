"use strict";

var source = "none";
var sessionInvoicePresent = false;
var localInvoicePresent = false;


const noSavedInvoiceToast = new bootstrap.Toast(document.getElementById("no-saved-invoice-warning"));

$(function() {
	checkForSavedInvoices();
	populateInvoice();

	$("#save-button").click(saveInvoice);
	$("#discard-button").click(confirmDiscardInvoice);
	$("#modal-discard-button").click(discardInvoice);
});

function checkForSavedInvoices() {
	sessionInvoicePresent = !!sessionStorage.getItem("invoiceData");
	localInvoicePresent = !!localStorage.getItem("invoiceData");
}

function populateInvoice() {
	// Load invoice data from session storage (sent from estimator)
	let data = JSON.parse(sessionStorage.getItem("invoiceData"));

	if (data) {
		source = "session";
		console.log("Loaded invoice data from session storage:");
		console.log(data);
	} else {
		// Load saved invoice from local storage
		data = JSON.parse(localStorage.getItem("invoiceData"));

		if (data) {
			source = "local";
			console.log("Loaded invoice data from local storage:");
			console.log(data);
		} else {
			// No invoice data found in session or local storage
			data = new Object();
			source = "none";

			let suppressWarning = sessionStorage.getItem("suppressWarning");
			if (suppressWarning) {
				
				// alert("No invoice data found.");
				noSavedInvoiceToast.show();
			}
			return;
		}
	}

	if (data.date) {
		$("#date-input").val(data.date);
	} else { 
		$("#date-input").val(new Date().toISOString().substring(0, 10));
	}
	$("#hourly-input").val(data.hourlyRate);
	if (data.company) { $("#company-input").val(data.company); }
	if (data.customer) { $("#customer-input").val(data.customer); }
	$("#company-address-input").val(data.companyAddress);
	$("#customer-address-input").val(data.customerAddress);
	$("#description-input").val(data.description);
	// Materials
	data.materials.forEach(material => {
		if (material.name != "") {
			addMaterial(material.name, material.quantity, material.totalCost);
		}
	});
	addMaterial(); // Add blank material for user modification
	$("#invoice-total-input").val(data.total);
	$("#material-cost-input").val(data.materialsCost);
	$("#total-hourly-input").val(data.laborCost);
}

function addMaterial(name, quantity, totalCost) {
	let materialDiv = $("<div>").addClass("row");
	let materialInput = $("<div>").addClass("col-6").append($("<input type='text'>").addClass("form-control col-6 material-name").val(name));
	let quantityInput = $("<div>").addClass("col-3").append($("<input type='number'>").addClass("form-control col-6 material-quantity").val(quantity));
	let totalCostInput = $("<div>").addClass("col-3").append($("<input type='number'>").addClass("form-control col-6 material-total-cost").val(totalCost));
	
	materialDiv.append(materialInput);
	materialDiv.append(quantityInput);
	materialDiv.append(totalCostInput);

	$("#materials-list").append(materialDiv);
}

function saveInvoice() {
	let data = new Object();

	data.date = $("#date-input").val();
	data.hourlyRate = $("#hourly-input").val();
	data.company = $("#company-input").val();
	data.customer = $("#customer-input").val();
	data.companyAddress = $("#company-address-input").val();
	data.customerAddress = $("#customer-address-input").val();
	data.description = $("#description-input").val();
	// Materials
	data.materials = [];
	$("#materials-list").children().each((index, row) => {
		let material = {
			name: $(row).find(".material-name").val(),
			cost: $(row).find(".material-cost").val()
		};
		data.materials.push(material);
	});
	data.laborCost = $("#total-hourly-input").val();
	data.materialsCost = $("#material-cost-input").val();
	data.total = $("#invoice-total-input").val();

	console.log("Saving invoice:");
	console.log(data);

	localStorage.setItem("invoiceData", JSON.stringify(data));
	sessionStorage.removeItem("invoiceData"); // Saved data to local storage, so clear previous data from session storage
	source = "local"; // Change the source since we moved where the invoice is
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