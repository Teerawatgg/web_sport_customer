declare const Chart: any;

let charts: Record<string, any> = {};

/* ============================== */
document.addEventListener("DOMContentLoaded", function () {
	checkSession();
	loadFilterOptions();
	bindFilters();
	toggleCustomDate();
	loadAll();
});

/* ================= SESSION ================= */
function checkSession(): void {
	fetch("/sports_rental_system/rector/api/check_session.php")
		.then(res => res.json())
		.then(data => {
			if (!data.success) {
				window.location.href = "login.html";
			}
		})
		.catch(() => {
			window.location.href = "login.html";
		});
}

/* ================= FILTER ================= */

function bindFilters(): void {
	const ids = [
		"rangeSelect", "bookingTypeSelect", "userTypeSelect",
		"facultySelect", "yearSelect", "genderSelect",
		"startDate", "endDate"
	];

	const userTypeEl = document.getElementById("userTypeSelect") as HTMLSelectElement;

	if (userTypeEl) {
		userTypeEl.addEventListener("change", function () {

			const facultyEl = document.getElementById("facultySelect") as HTMLSelectElement;
			const yearEl = document.getElementById("yearSelect") as HTMLSelectElement;

			const value = userTypeEl.value;
			const isNotStudent = value === "general" || value === "external";

			if (facultyEl) {
				facultyEl.disabled = isNotStudent;
				if (isNotStudent) facultyEl.value = "";
			}

			if (yearEl) {
				yearEl.disabled = isNotStudent;
				if (isNotStudent) yearEl.value = "";
			}
		});
	}

	ids.forEach(id => {
		const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
		if (!el) return;

		el.addEventListener("change", () => {
			if (id === "rangeSelect") toggleCustomDate();
			loadAll();
		});
	});

	document.getElementById("resetFilter")
		?.addEventListener("click", resetFilters);
}

/* ================= FILTER LOGIC ================= */

function getFilters() {
	return {
		range: (document.getElementById("rangeSelect") as HTMLSelectElement)?.value || "",
		start_date: (document.getElementById("startDate") as HTMLInputElement)?.value || "",
		end_date: (document.getElementById("endDate") as HTMLInputElement)?.value || "",
		booking_type: (document.getElementById("bookingTypeSelect") as HTMLSelectElement)?.value || "",
		user_type: (document.getElementById("userTypeSelect") as HTMLSelectElement)?.value || "",
		faculty_id: (document.getElementById("facultySelect") as HTMLSelectElement)?.value || "",
		year: (document.getElementById("yearSelect") as HTMLSelectElement)?.value || "",
		gender_id: (document.getElementById("genderSelect") as HTMLSelectElement)?.value || ""
	};
}

function toggleCustomDate(): void {
	const range = (document.getElementById("rangeSelect") as HTMLSelectElement)?.value;
	const box = document.getElementById("customDateBox") as HTMLElement;

	if (!box) return;
	box.style.display = range === "custom" ? "flex" : "none";
}

function resetFilters(): void {
	const ids = [
		"rangeSelect", "bookingTypeSelect", "userTypeSelect",
		"facultySelect", "yearSelect", "genderSelect",
		"startDate", "endDate"
	];

	ids.forEach(id => {
		const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
		if (!el) return;

		if (id === "rangeSelect") el.value = "all";
		else el.value = "";
	});

	toggleCustomDate();
	loadAll();
}

/* ================= LOAD FILTER OPTIONS ================= */

function loadFilterOptions(): void {
	fetch("/sports_rental_system/rector/api/get_executive_overview.php")
		.then(res => res.json())
		.then(data => {

			const facSelect = document.getElementById("facultySelect") as HTMLSelectElement;
			if (facSelect && data.faculty) {
				facSelect.innerHTML = '<option value="">ทุกคณะ</option>';
				data.faculty.forEach((f: any) => {
					facSelect.add(new Option(f.name, f.id));
				});
			}

			const yearSelect = document.getElementById("yearSelect") as HTMLSelectElement;
			if (yearSelect && data.year) {
				yearSelect.innerHTML = '<option value="">ทุกชั้นปี</option>';
				data.year.forEach((y: any) => {
					yearSelect.add(new Option(`ปี ${y}`, y));
				});
			}

			const genSelect = document.getElementById("genderSelect") as HTMLSelectElement;
			if (genSelect && data.gender) {
				genSelect.innerHTML = '<option value="">ทุกเพศ</option>';
				data.gender.forEach((g: any) => {
					genSelect.add(new Option(g.name, g.id));
				});
			}
		})
		.catch(err => console.error(err));
}

/* ================= LOAD ================= */

function loadAll(): void {

	fetch("/sports_rental_system/rector/api/get_executive_overview.php?" +
		new URLSearchParams(getFilters()).toString()
	)
		.then(res => res.json())
		.then(data => {

			if (!data.success) return;

			updateKPI(data.kpi);

			const chartsData = data.charts || {};

			updateTrend(chartsData.trend);
			updateFaculty(chartsData.top_faculty);
			updateGender(chartsData.gender);
			updateYear(chartsData.year);

		})
		.catch(err => console.error(err));
}

/* ================= KPI ================= */

function updateKPI(kpi: any = {}): void {
	updateKpiUI("kpiUsers", kpi.total_users, "");
	updateKpiUI("kpiPenetration", kpi.student_pct, "%");
	updateKpiUI("kpiGeneral", kpi.general_pct, "%");
	updateKpiUI("kpiExternal", kpi.external_pct, "%");
}

/* ================= CHART ================= */

function updateTrend(data: any): void {
	renderChart("trendUsersChart", {
		type: "line",
		data: {
			labels: (data?.labels ?? []).map((l: string) =>
				new Date(l + "-01").toLocaleString('en-US', { month: 'short' })
			),
			datasets: [{
				data: data?.data ?? [],
				borderColor: "#339af0",
				backgroundColor: "rgba(51,154,240,0.1)",
				fill: true
			}]
		}
	});
}

function updateFaculty(data: any): void {
	renderChart("topFacultyChart", {
		type: "bar",
		data: {
			labels: data?.labels ?? [],
			datasets: [{
				data: data?.data ?? [],
				backgroundColor: "#51cf66"
			}]
		}
	});
}

function updateGender(data: any): void {

	const labels = data?.labels ?? [];

	const colors = labels.map((l: string) => {
		if (l.trim() === "ชาย") return "#4dabf7";
		if (l.trim() === "หญิง") return "#ff69b4";
		return "#adb5bd";
	});

	renderChart("genderChart", {
		type: "doughnut",
		data: {
			labels,
			datasets: [{
				data: data?.data ?? [],
				backgroundColor: colors
			}]
		}
	});
}

function updateYear(data: any): void {
	renderChart("yearChart", {
		type: "bar",
		data: {
			labels: data?.labels ?? [],
			datasets: [{
				data: data?.data ?? [],
				backgroundColor: "#ff922b"
			}]
		}
	});
}

/* ================= HELPERS ================= */

function updateKpiUI(id: string, value: any, unit: string): void {
	const el = document.getElementById(id);
	if (!el) return;

	const num = Number(value ?? 0);

	if (id === "kpiPenetration" || id === "kpiGeneral" || id === "kpiExternal") {
		el.innerText = num.toFixed(1) + unit;
	} else {
		el.innerText = num.toLocaleString() + unit;
	}
}

function renderChart(id: string, config: any): void {
	const canvas = document.getElementById(id) as HTMLCanvasElement;
	if (!canvas) return;

	if (charts[id]) charts[id].destroy();

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	charts[id] = new Chart(ctx, config);
}