"use strict";

// From StackOverflow: https://stackoverflow.com/a/16233919/697674
const currency = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
  
	// These options are needed to round to whole numbers if that's what you want.
	//minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
	//maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

let invoice;

$(function() {
	loadInvoice();
	updatePage();
	window.print();
});

function loadInvoice() {
	let invoiceString = sessionStorage.getItem("printInvoiceData");
	invoice = JSON.parse(invoiceString);
}

function updatePage() {
	$("#date").text(invoice.date);
	$("#hours").text(invoice.totalHours);
	$("#hourly-rate").text(currency.format(invoice.hourlyRate));
	$("#company").text(invoice.company);
	$("#customer").text(invoice.customer);
	$("#company-address").html(invoice.companyAddress.replaceAll("\n", "<br>"));
	$("#customer-address").html(invoice.customerAddress.replaceAll("\n", "<br>"));
	$("#description").html(invoice.description.replaceAll("\n", "<br>"));
	// Materials
	invoice.materials.forEach(material => {
		if (!isEmptyMaterial(material)) {
			addMaterial(material.name, material.quantity, material.totalCost);
		}
	});
	$("#total-hourly-price").text(currency.format(invoice.laborCost));
	$("#material-cost").text(currency.format(invoice.materialsCost));
	$("#invoice-total").text(currency.format(invoice.total));
}

function addMaterial(name, quantity, totalCost) {
	let materialDiv = $("<div>").addClass("row");
	let quantityInput = $("<div>").addClass("col-3 thick-left-cell").append($("<span>").addClass("col-6 material-quantity").text(quantity));
	let materialInput = $("<div>").addClass("col-6 thick-left-cell").append($("<span>").addClass("col-6 material-name").text(name));
	let totalCostInput = $("<div>").addClass("col-3 thick-right-cell").append($("<span>").addClass("col-6 material-total-cost").text(currency.format(totalCost)));
	
	materialDiv.append(quantityInput);
	materialDiv.append(materialInput);
	materialDiv.append(totalCostInput);

	$("#materials-list").append(materialDiv);
}

function isEmptyMaterial(material) {
	return material.name.length === 0 &&
	       material.quantity.length === 0 &&
		   material.totalCost.length === 0;
}