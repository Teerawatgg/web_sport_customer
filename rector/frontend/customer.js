var charts = {};
/* ============================== */
document.addEventListener("DOMContentLoaded", function () {
    checkSession();
    loadFilterOptions();
    bindFilters();
    toggleCustomDate();
    loadAll();
});
/* ================= SESSION ================= */
function checkSession() {
    fetch("/sports_rental_system/rector/api/check_session.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
        if (!data.success) {
            window.location.href = "login.html";
        }
    })
        .catch(function () {
        window.location.href = "login.html";
    });
}
/* ================= FILTER ================= */
function bindFilters() {
    var _a;
    var ids = [
        "rangeSelect", "bookingTypeSelect", "userTypeSelect",
        "facultySelect", "yearSelect", "genderSelect",
        "startDate", "endDate"
    ];
    var userTypeEl = document.getElementById("userTypeSelect");
    if (userTypeEl) {
        userTypeEl.addEventListener("change", function () {
            var facultyEl = document.getElementById("facultySelect");
            var yearEl = document.getElementById("yearSelect");
            var value = userTypeEl.value;
            var isNotStudent = value === "general" || value === "external";
            if (facultyEl) {
                facultyEl.disabled = isNotStudent;
                if (isNotStudent)
                    facultyEl.value = "";
            }
            if (yearEl) {
                yearEl.disabled = isNotStudent;
                if (isNotStudent)
                    yearEl.value = "";
            }
        });
    }
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el)
            return;
        el.addEventListener("change", function () {
            if (id === "rangeSelect")
                toggleCustomDate();
            loadAll();
        });
    });
    (_a = document.getElementById("resetFilter")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", resetFilters);
}
/* ================= FILTER LOGIC ================= */
function getFilters() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        range: ((_a = document.getElementById("rangeSelect")) === null || _a === void 0 ? void 0 : _a.value) || "",
        start_date: ((_b = document.getElementById("startDate")) === null || _b === void 0 ? void 0 : _b.value) || "",
        end_date: ((_c = document.getElementById("endDate")) === null || _c === void 0 ? void 0 : _c.value) || "",
        booking_type: ((_d = document.getElementById("bookingTypeSelect")) === null || _d === void 0 ? void 0 : _d.value) || "",
        user_type: ((_e = document.getElementById("userTypeSelect")) === null || _e === void 0 ? void 0 : _e.value) || "",
        faculty_id: ((_f = document.getElementById("facultySelect")) === null || _f === void 0 ? void 0 : _f.value) || "",
        year: ((_g = document.getElementById("yearSelect")) === null || _g === void 0 ? void 0 : _g.value) || "",
        gender_id: ((_h = document.getElementById("genderSelect")) === null || _h === void 0 ? void 0 : _h.value) || ""
    };
}
function toggleCustomDate() {
    var _a;
    var range = (_a = document.getElementById("rangeSelect")) === null || _a === void 0 ? void 0 : _a.value;
    var box = document.getElementById("customDateBox");
    if (!box)
        return;
    box.style.display = range === "custom" ? "flex" : "none";
}
function resetFilters() {
    var ids = [
        "rangeSelect", "bookingTypeSelect", "userTypeSelect",
        "facultySelect", "yearSelect", "genderSelect",
        "startDate", "endDate"
    ];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el)
            return;
        if (id === "rangeSelect")
            el.value = "all";
        else
            el.value = "";
    });
    toggleCustomDate();
    loadAll();
}
/* ================= LOAD FILTER OPTIONS ================= */
function loadFilterOptions() {
    fetch("/sports_rental_system/rector/api/get_executive_overview.php")
        .then(function (res) { return res.json(); })
        .then(function (data) {
        var facSelect = document.getElementById("facultySelect");
        if (facSelect && data.faculty) {
            facSelect.innerHTML = '<option value="">ทุกคณะ</option>';
            data.faculty.forEach(function (f) {
                facSelect.add(new Option(f.name, f.id));
            });
        }
        var yearSelect = document.getElementById("yearSelect");
        if (yearSelect && data.year) {
            yearSelect.innerHTML = '<option value="">ทุกชั้นปี</option>';
            data.year.forEach(function (y) {
                yearSelect.add(new Option("\u0E1B\u0E35 ".concat(y), y));
            });
        }
        var genSelect = document.getElementById("genderSelect");
        if (genSelect && data.gender) {
            genSelect.innerHTML = '<option value="">ทุกเพศ</option>';
            data.gender.forEach(function (g) {
                genSelect.add(new Option(g.name, g.id));
            });
        }
    })
        .catch(function (err) { return console.error(err); });
}
/* ================= LOAD ================= */
function loadAll() {
    fetch("/sports_rental_system/rector/api/get_executive_overview.php?" +
        new URLSearchParams(getFilters()).toString())
        .then(function (res) { return res.json(); })
        .then(function (data) {
        if (!data.success)
            return;
        updateKPI(data.kpi);
        var chartsData = data.charts || {};
        updateTrend(chartsData.trend);
        updateFaculty(chartsData.top_faculty);
        updateGender(chartsData.gender);
        updateYear(chartsData.year);
    })
        .catch(function (err) { return console.error(err); });
}
/* ================= KPI ================= */
function updateKPI(kpi) {
    if (kpi === void 0) { kpi = {}; }
    updateKpiUI("kpiUsers", kpi.total_users, "");
    updateKpiUI("kpiPenetration", kpi.student_pct, "%");
    updateKpiUI("kpiGeneral", kpi.general_pct, "%");
    updateKpiUI("kpiExternal", kpi.external_pct, "%");
}
/* ================= CHART ================= */
function updateTrend(data) {
    var _a, _b;
    renderChart("trendUsersChart", {
        type: "line",
        data: {
            labels: ((_a = data === null || data === void 0 ? void 0 : data.labels) !== null && _a !== void 0 ? _a : []).map(function (l) {
                return new Date(l + "-01").toLocaleString('en-US', { month: 'short' });
            }),
            datasets: [{
                    data: (_b = data === null || data === void 0 ? void 0 : data.data) !== null && _b !== void 0 ? _b : [],
                    borderColor: "#339af0",
                    backgroundColor: "rgba(51,154,240,0.1)",
                    fill: true
                }]
        }
    });
}
function updateFaculty(data) {
    var _a, _b;
    renderChart("topFacultyChart", {
        type: "bar",
        data: {
            labels: (_a = data === null || data === void 0 ? void 0 : data.labels) !== null && _a !== void 0 ? _a : [],
            datasets: [{
                    data: (_b = data === null || data === void 0 ? void 0 : data.data) !== null && _b !== void 0 ? _b : [],
                    backgroundColor: "#51cf66"
                }]
        }
    });
}
function updateGender(data) {
    var _a, _b;
    var labels = (_a = data === null || data === void 0 ? void 0 : data.labels) !== null && _a !== void 0 ? _a : [];
    var colors = labels.map(function (l) {
        if (l.trim() === "ชาย")
            return "#4dabf7";
        if (l.trim() === "หญิง")
            return "#ff69b4";
        return "#adb5bd";
    });
    renderChart("genderChart", {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                    data: (_b = data === null || data === void 0 ? void 0 : data.data) !== null && _b !== void 0 ? _b : [],
                    backgroundColor: colors
                }]
        }
    });
}
function updateYear(data) {
    var _a, _b;
    renderChart("yearChart", {
        type: "bar",
        data: {
            labels: (_a = data === null || data === void 0 ? void 0 : data.labels) !== null && _a !== void 0 ? _a : [],
            datasets: [{
                    data: (_b = data === null || data === void 0 ? void 0 : data.data) !== null && _b !== void 0 ? _b : [],
                    backgroundColor: "#ff922b"
                }]
        }
    });
}
/* ================= HELPERS ================= */
function updateKpiUI(id, value, unit) {
    var el = document.getElementById(id);
    if (!el)
        return;
    var num = Number(value !== null && value !== void 0 ? value : 0);
    if (id === "kpiPenetration" || id === "kpiGeneral" || id === "kpiExternal") {
        el.innerText = num.toFixed(1) + unit;
    }
    else {
        el.innerText = num.toLocaleString() + unit;
    }
}
function renderChart(id, config) {
    var canvas = document.getElementById(id);
    if (!canvas)
        return;
    if (charts[id])
        charts[id].destroy();
    var ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    charts[id] = new Chart(ctx, config);
}
