"use strict";

function loadProjects() {
	let data = JSON.parse(localStorage.getItem("projects"));
	// console.log(data);

	if (data) {
		saved_projects = data;
	}

	console.log("Saved projects:");
	console.log(saved_projects);

	// Populate load projects dialog
	$("#load-project-select").empty();
	Object.entries(saved_projects).forEach(project => {
		// console.log(project);
		let project_name = project[0];
		// console.log(project_name);
		let option = $("<option>").attr("value", project_name).text(project_name);
		$("#load-project-select").append(option);
	});
}

function saveProject() {
	if (!project_name) {
		// Prompt user to select a name for this project
		$("#save-modal").modal("show");
		return;
	}

	// Save project with given name
	console.log("Saving project");
	let project = serializeProject();
	console.log(project);
	saved_projects[project_name] = project;
	localStorage.setItem("projects", JSON.stringify(saved_projects));
	console.log(saved_projects);
	form_dirty = false;
	
	// Show confirmation toast
	savedProjectToast.show();
}