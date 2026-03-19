declare const Chart: any;

let bookingTrendChart: any;
let revenueTrendChart: any;
let channelChart: any;
let bookingRatioChart: any;
let branchChart: any;

/* ============================== */
document.addEventListener("DOMContentLoaded", function () {
	initCharts();
	loadRegions();
	loadProvinces();
	loadBranches();
	bindFilters();
	loadAll();
});

/* ============================== FILTER */

function bindFilters(): void {
	const ids = ["rangeSelect","regionSelect","provinceSelect","branchSelect","startDate","endDate"];

	ids.forEach(id => {
		const el = document.getElementById(id) as any;
		if (!el) return;
		el.addEventListener("change", loadAll);
	});

	document.getElementById("resetFilter")?.addEventListener("click", () => location.reload());
}

function getFilter() {
	return {
		range: (document.getElementById("rangeSelect") as any)?.value || "",
		start: (document.getElementById("startDate") as any)?.value || "",
		end: (document.getElementById("endDate") as any)?.value || "",
		region_id: (document.getElementById("regionSelect") as any)?.value || "",
		province_id: (document.getElementById("provinceSelect") as any)?.value || "",
		branch_id: (document.getElementById("branchSelect") as any)?.value || ""
	};
}

/* ============================== UTIL */

function safeArray(arr: any): any[] {
	return Array.isArray(arr) ? arr : [];
}

function getNiceMax(data: number[]): number {
	const max = Math.max(...data, 0);
	if (max === 0) return 5;

	const pow = Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
	return Math.ceil(max / pow) * pow;
}

/* ============================== LOAD */

function loadAll(): void {

	fetch("/sports_rental_system/executive/api/user_dashboard.php", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(getFilter())
	})
	.then(res => res.json())
	.then(result => {

		if (result.error) {
			console.error(result.message);
			return;
		}

		const charts = result.charts || {};

		updateKPI(result.kpi);

		/* donut */
		updateBookingTrend({
			labels: ["ลูกค้าใหม่", "ลูกค้าเดิม"],
			bookings: [
				charts.new_vs_returning?.new ?? 0,
				charts.new_vs_returning?.returning ?? 0
			]
		});

		/* 🔥 dynamic booking group (ตรงกับ PHP ใหม่) */
		updateRevenueTrend({
			labels: charts.booking_group?.labels ?? [],
			revenue: charts.booking_group?.data ?? []
		});

		updateChannel({
			labels: safeArray(charts.revenue_by_type?.labels),
			data: safeArray(charts.revenue_by_type?.data)
		});

		updateBookingRatio({
			labels: safeArray(charts.cancel_by_type?.labels),
			data: safeArray(charts.cancel_by_type?.data)
		});

		updateBranches({
			labels: safeArray(charts.customers_by_branch?.labels),
			data: safeArray(charts.customers_by_branch?.data)
		});

	})
	.catch(err => console.error(err));
}

/* ============================== KPI */

function updateKPI(kpi: any): void {
	document.getElementById("kpiBookings")!.textContent =
		(Number(kpi?.total_customers ?? 0)).toLocaleString() + " คน";

	document.getElementById("kpiRevenue")!.textContent =
		(Number(kpi?.repeat_rate ?? 0)).toFixed(2) + " %";

	document.getElementById("kpiAvg")!.textContent =
		(Number(kpi?.avg_booking ?? 0)).toLocaleString() + " ครั้ง/คน";

	document.getElementById("kpiCancel")!.textContent =
		(Number(kpi?.arpu ?? 0)).toLocaleString() + " บาท";
}

/* ============================== CHART UPDATE */

function updateRevenueTrend(data: any): void {
	if (!revenueTrendChart) return;

	let values = data?.revenue ?? [];
	if (!values.length) values = [0];

	const maxY = getNiceMax(values);

	revenueTrendChart.options.scales.y.min = 0;
	revenueTrendChart.options.scales.y.max = maxY;

	revenueTrendChart.data.labels = data?.labels ?? [];
	revenueTrendChart.data.datasets[0].data = values;

	revenueTrendChart.update();
}

function updateChannel(data: any): void {
	if (!channelChart) return;

	const labels = data?.labels?.length ? data.labels : ["ไม่มีข้อมูล"];
	const values = data?.data?.length ? data.data : [0];

	const maxY = getNiceMax(values);

	channelChart.options.scales.y.min = 0;
	channelChart.options.scales.y.max = maxY;

	channelChart.data.labels = labels;
	channelChart.data.datasets[0].data = values;

	channelChart.update();
}

function updateBookingTrend(data: any): void {
	if (!bookingTrendChart) return;

	bookingTrendChart.data.labels = data?.labels ?? [];
	bookingTrendChart.data.datasets[0].data = data?.bookings ?? [];

	bookingTrendChart.update();
}

function updateBookingRatio(data: any): void {
	if (!bookingRatioChart) return;

	let values = data?.data ?? [];
	if (!values.length) values = [1];

	bookingRatioChart.data.labels = data?.labels ?? ["ไม่มีข้อมูล"];
	bookingRatioChart.data.datasets[0].data = values;

	bookingRatioChart.update();
}

function updateBranches(data: any): void {
	if (!branchChart) return;

	const labels = data?.labels?.length ? data.labels : ["ไม่มีข้อมูล"];
	const values = data?.data?.length ? data.data : [0];

	const maxY = getNiceMax(values);

	branchChart.options.scales.y.min = 0;
	branchChart.options.scales.y.max = maxY;

	branchChart.data.labels = labels;
	branchChart.data.datasets[0].data = values;

	branchChart.update();
}

/* ============================== DROPDOWN */

function loadRegions(): void {
	fetch("/sports_rental_system/executive/api/get_regions.php")
	.then(res => res.json())
	.then(res => {
		const data = res.data || [];
		const select = document.getElementById("regionSelect") as HTMLSelectElement;
		select.innerHTML = `<option value="">ทั้งหมด</option>`;
		data.forEach((r: any) => {
			select.innerHTML += `<option value="${r.region_id}">${r.region_name}</option>`;
		});
	});
}

function loadProvinces(): void {
	const regionId = (document.getElementById("regionSelect") as any)?.value || "";

	fetch("/sports_rental_system/executive/api/get_provinces.php", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ region_id: regionId })
	})
	.then(res => res.json())
	.then(res => {
		const data = res.data || [];
		const select = document.getElementById("provinceSelect") as HTMLSelectElement;
		select.innerHTML = `<option value="">ทั้งหมด</option>`;
		data.forEach((p: any) => {
			select.innerHTML += `<option value="${p.province_id}">${p.name}</option>`;
		});
	});
}

function loadBranches(): void {
	const regionId = (document.getElementById("regionSelect") as any)?.value || "";
	const provinceId = (document.getElementById("provinceSelect") as any)?.value || "";

	fetch("/sports_rental_system/executive/api/get_branches.php", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			region_id: regionId,
			province_id: provinceId
		})
	})
	.then(res => res.json())
	.then(res => {
		const data = res.data || [];
		const select = document.getElementById("branchSelect") as HTMLSelectElement;
		select.innerHTML = `<option value="">ทั้งหมด</option>`;
		data.forEach((b: any) => {
			select.innerHTML += `<option value="${b.branch_id}">${b.name}</option>`;
		});
	});
}

/* ============================== INIT CHART */

function initCharts(): void {

	const baseOptions = (unit: string = "") => ({
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { position: "bottom" }
		},
		scales: {
			y: {
				min: 0,
				ticks: {
					stepSize: 1,
					precision: 0,
					callback: (v: any) => (v % 1 === 0 ? v + " " + unit : "")
				}
			}
		}
	});

	bookingTrendChart = new Chart(document.getElementById("bookingTrendChart"), {
		type: "doughnut",
		data: { labels: [], datasets: [{ data: [], backgroundColor: ["#22c55e", "#3b82f6"] }] }
	});

	revenueTrendChart = new Chart(document.getElementById("revenueTrendChart"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "จำนวนลูกค้า",
				data: [],
				backgroundColor: "#fff700"
			}]
		},
		options: baseOptions("คน")
	});

	channelChart = new Chart(document.getElementById("channelChart"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "รายได้",
				data: [],
				backgroundColor: ["#f700ff", "#00ff1e"]
			}]
		},
		options: baseOptions("บาท")
	});

	bookingRatioChart = new Chart(document.getElementById("bookingRatioChart"), {
		type: "doughnut",
		data: {
			labels: [],
			datasets: [{
				data: [],
				backgroundColor: ["#f700ff", "#00ff1e"]
			}]
		}
	});

	branchChart = new Chart(document.getElementById("topChart"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "จำนวนลูกค้า",
				data: [],
				backgroundColor: "#3b82f6"
			}]
		},
		options: baseOptions("คน")
	});
}